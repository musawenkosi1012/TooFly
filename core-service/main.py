from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os

from api.v1.orders_router import router as orders_router
from api.v1.products_router import router as products_router
from api.v1.internal_router import router as internal_router
from api.v1.auth_router import router as auth_router
from api.v1.upload_router import router as upload_router
from core.config import settings
from db.session import engine
from db.base import Base 

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION
)

# Database initialization wrapped in startup event to prevent pod crashes on intermittent DB connectivity
@app.on_event("startup")
async def startup_event():
    try:
        # Build Database tables if they don't exist
        print("Initializing database tables...")
        Base.metadata.create_all(bind=engine)
        
        # One-time admin/it seeding
        from domain.users.models import User
        import bcrypt
        db_local = SessionLocal()
        try:
            hashed = bcrypt.hashpw(b"Musa2005", bcrypt.gensalt()).decode('utf-8')
            for u in [{"e": "admin@toofly.com", "r": "owner"}, {"e": "it@toofly.com", "r": "it_admin"}]:
                user = db_local.query(User).filter(User.email == u["e"]).first()
                if user:
                    user.hashed_password, user.role = hashed, u["r"]
                else:
                    db_local.add(User(email=u["e"], hashed_password=hashed, role=u["r"], is_active=True))
            db_local.commit()
            print("Admin/IT Seeding successful.")
        finally:
            db_local.close()
            
        print("Database initialization successful.")
    except Exception as e:
        print(f"Warning: Local DB initialization failed: {e}")
        print("The app will continue but DB-dependent features might fail until correctly configured in Choreo.")

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://too-fly.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://too-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Static Files (for images) - Use /tmp for writable storage on Read-only FS
static_dir = "/tmp/static"
uploads_dir = "/tmp/static/uploads"
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Core Routers
# Direct /api prefix mappings (Frontend compatibility)
app.include_router(auth_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(upload_router, prefix="/api")

# V1 Prefix mappings
app.include_router(orders_router, prefix=settings.API_V1_STR)
app.include_router(products_router, prefix=settings.API_V1_STR)
app.include_router(internal_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"status": "operational", "service": "Core Orchestrator"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

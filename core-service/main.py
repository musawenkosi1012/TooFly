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

# Build Database tables in Supabase (PostgreSQL)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://57dd5a30-006e-4019-9466-63f44aa32fc4.e1-eu-north-azure.choreoapps.dev",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
    uvicorn.run(app, host="0.0.0.0", port=8000)

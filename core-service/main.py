from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from api.v1.auth_router import router as auth_router
from api.v1.orders_router import router as orders_router
from api.v1.products_router import router as products_router
from api.v1.internal_router import router as internal_router
from api.v1.upload_router import router as upload_router

from core.config import settings
from db.session import engine
from db.base import Base 
from core.middleware import (
    PerformanceMiddleware, 
    SecurityMiddleware
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION
)

# Standardized CORS - Restricted in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://too-fly.vercel.app",
        "https://too-fly-spha.vercel.app",
        "https://toofly-official.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SecurityMiddleware)
app.add_middleware(PerformanceMiddleware)

@app.on_event("startup")
async def startup_event():
    try:
        print("Initializing database tables...")
        Base.metadata.create_all(bind=engine)
        print("Database initialization successful.")
    except Exception as e:
        print(f"Warning: Local DB initialization failed: {e}")

# Static Files
app.mount("/static", StaticFiles(directory=settings.STATIC_DIR), name="static")

# Refined Router Inclusion: One path per router for simplicity
api_v1_prefix = settings.API_V1_STR # Usually /api/v1

app.include_router(auth_router, prefix=api_v1_prefix, tags=["Authentication"])
app.include_router(products_router, prefix=api_v1_prefix, tags=["Products"])
app.include_router(orders_router, prefix=api_v1_prefix, tags=["Orders"])
app.include_router(internal_router, prefix=api_v1_prefix, tags=["Internal"])
app.include_router(upload_router, prefix=api_v1_prefix, tags=["Upload"])

@app.get("/")
def read_root():
    return {"status": "operational", "service": "Core Orchestrator"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

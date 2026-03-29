from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

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
        "https://toofly-official.vercel.app", # Final Vercel deployment domain
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

# Consolidated Router Configuration with Legacy Prefixes
v1_routers = [
    (products_router, ["/api", "/v1", settings.API_V1_STR]),
    (upload_router, ["/api"]),
    (orders_router, ["/api", "/v1", settings.API_V1_STR]),
    (internal_router, [settings.API_V1_STR]),
]

for router, prefixes in v1_routers:
    for prefix in prefixes:
        app.include_router(router, prefix=prefix)

# Root fallbacks (No prefix versions)
app.include_router(products_router)
app.include_router(orders_router)

@app.get("/")
def read_root():
    return {"status": "operational", "service": "Core Orchestrator"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

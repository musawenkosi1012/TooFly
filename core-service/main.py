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
from api.v1.designs_router import router as designs_router
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
        print("Database initialization successful.")
    except Exception as e:
        print(f"Warning: Local DB initialization failed: {e}")
        print("The app will continue but DB-dependent features might fail until correctly configured in Choreo.")

from fastapi.responses import JSONResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class DynamicCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")
        
        # Determine if origin is allowed
        is_allowed = False
        if not origin:
            is_allowed = True
        elif ".vercel.app" in origin or "localhost" in origin or "127.0.0.1" in origin:
            is_allowed = True
            
        # Handle Preflight OPTIONS
        if request.method == "OPTIONS" and is_allowed:
            response = Response()
            response.headers["Access-Control-Allow-Origin"] = origin or "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
            response.headers["Access-Control-Max-Age"] = "600"
            return response

        try:
            response = await call_next(request)
        except Exception as e:
            # Shield internal errors but maintain CORS headers for debugging
            response = JSONResponse(
                status_code=500,
                content={"detail": "Internal Server Error", "msg": str(e)}
            )
            
        if is_allowed:
            response.headers["Access-Control-Allow-Origin"] = origin or "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        
        return response

app.add_middleware(DynamicCORSMiddleware)



# Static Files (for images) - Use /tmp for writable storage on Read-only FS
app.mount("/static", StaticFiles(directory=settings.STATIC_DIR), name="static")

# 1. API Direct Prefix (Frontend /api/...)
app.include_router(auth_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(upload_router, prefix="/api")
app.include_router(designs_router, prefix="/api")
app.include_router(orders_router, prefix="/api")

# 2. V1 Direct Prefix (Cleaner /v1/...)
app.include_router(auth_router, prefix="/v1")
app.include_router(products_router, prefix="/v1")
app.include_router(orders_router, prefix="/v1")
app.include_router(designs_router, prefix="/v1")

# 3. Standard Versioned Prefix (/api/v1/...)
app.include_router(orders_router, prefix=settings.API_V1_STR)
app.include_router(products_router, prefix=settings.API_V1_STR)
app.include_router(internal_router, prefix=settings.API_V1_STR)
app.include_router(designs_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"status": "operational", "service": "Core Orchestrator"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

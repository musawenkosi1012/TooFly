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
        print("Database initialization successful.")
    except Exception as e:
        print(f"Warning: Local DB initialization failed: {e}")
        print("The app will continue but DB-dependent features might fail until correctly configured in Choreo.")

# Enhanced CORS configuration
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

class DynamicCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        origin = request.headers.get("origin")
        
        # Preflight handling
        if request.method == "OPTIONS":
            response = JSONResponse(content="OK")
            if origin:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Methods"] = "*"
                response.headers["Access-Control-Allow-Headers"] = "*"
            return response
        
        try:
            response = await call_next(request)
        except Exception as e:
            # Ensure CORS headers on 500 errors
            response = JSONResponse(
                status_code=500,
                content={"detail": "Internal Server Error", "msg": str(e)}
            )
            if origin:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
        
        if origin:
            # Allow any .vercel.app subdomain or localhost
            if ".vercel.app" in origin or "localhost" in origin or "127.0.0.1" in origin:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Methods"] = "*"
                response.headers["Access-Control-Allow-Headers"] = "*"
                response.headers["Access-Control-Expose-Headers"] = "*"
        
        return response

app.add_middleware(DynamicCORSMiddleware)



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

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from fastapi.responses import JSONResponse
from core.security import global_limiter, log_security_event
import time

class PerformanceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        response = await call_next(request)
        process_time = time.perf_counter() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response

class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        
        # 1. Global Rate Limiting
        if not global_limiter.is_allowed(client_ip):
            log_security_event("GLOBAL_RATE_LIMIT_EXCEEDED", "GUEST", client_ip, f"Path: {request.url.path}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Slow down."}
            )

        response = await call_next(request)
        
        # 2. Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN" # Allow frames for Swagger
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # CSP Update: Allow JS/CSS from CDNs for Swagger UI
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' cdn.jsdelivr.net; "
            "img-src 'self' data: https: fastapi.tiangolo.com;"
        )
        
        return response

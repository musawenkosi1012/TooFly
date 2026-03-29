from fastapi import HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import bcrypt
import time
from typing import List, Dict, Optional, Any

from core.config import settings
from db.session import get_db
# Injected Supabase authentication (suplanting legacy local model)

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login"
)

# --- Password & Token Security ---

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": int(expire.timestamp())})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

# --- Role-Based Access Control (RBAC) ---

from core.supabase import supabase

def get_current_user(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication credentials"
        )
    
    token = auth_header.split(" ")[1]
    
    try:
        # Get user via Supabase SDK (Server-side validation)
        res = supabase.auth.get_user(token)
        if not res.user:
            raise HTTPException(status_code=401, detail="Invalid session")
            
        # Roles are often stored in app_metadata when using RBAC/Claims
        # If not present, we default to customer for safety
        supabase_user = res.user
        setattr(supabase_user, "role", supabase_user.app_metadata.get("role", "customer"))
        
        return supabase_user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: Any = Depends(get_current_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have enough privileges"
            )
        return user

# --- Rate Limiting (In-memory Simple Implementation) ---

class RateLimiter:
    def __init__(self, requests_limit: int, window_seconds: int):
        self.limit = requests_limit
        self.window = window_seconds
        self.history: Dict[str, List[float]] = {}

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        if client_ip not in self.history:
            self.history[client_ip] = [now]
            return True
        
        # Cleanup old entries
        self.history[client_ip] = [t for t in self.history[client_ip] if now - t < self.window]
        
        if len(self.history[client_ip]) < self.limit:
            self.history[client_ip].append(now)
            return True
        return False

# Global limiters
auth_limiter = RateLimiter(requests_limit=5, window_seconds=60) # 5 login attempts per minute
global_limiter = RateLimiter(requests_limit=100, window_seconds=60) # 100 requests per minute

# --- Audit Logging (Simple Console implementation for now) ---

def log_security_event(event_type: str, user_email: str, ip: str, detail: str):
    timestamp = datetime.now(timezone.utc).isoformat()
    print(f"[AUDIT][{timestamp}] {event_type} | User: {user_email} | IP: {ip} | {detail}")

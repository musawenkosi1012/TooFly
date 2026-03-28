from fastapi import HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import time
from typing import List, Dict

from core.config import settings
from db.session import get_db
from domain.users.models import User

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login"
)

# --- Role-Based Access Control (RBAC) ---

def get_current_user(db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)):
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

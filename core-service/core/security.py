from fastapi import HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import time
from typing import List, Dict, Optional, Any
import bcrypt

from core.config import settings
from db.session import get_db
from domain.users.models import User

# Standard OAuth2 Flow Configuration
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

# --- Password Management (BCrypt) ---
def verify_password(plain_password: str, hashed_password: str):
    if not hashed_password:
        return False
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def hash_password(password: str):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

# --- JWT Generation & Validation ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": int(expire.timestamp())})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

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

# --- Rate Limiting (In-memory simple implementation) ---
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
        self.history[client_ip] = [t for t in self.history[client_ip] if now - t < self.window]
        if len(self.history[client_ip]) < self.limit:
            self.history[client_ip].append(now)
            return True
        return False

# Global limiters
auth_limiter = RateLimiter(requests_limit=5, window_seconds=60)
global_limiter = RateLimiter(requests_limit=100, window_seconds=60)

# --- Audit Logging ---
def log_security_event(event_type: str, user_email: str, ip: str, detail: str):
    timestamp = datetime.now(timezone.utc).isoformat()
    print(f"[AUDIT][{timestamp}] {event_type} | User: {user_email} | IP: {ip} | {detail}")

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Any, Dict
from pydantic import BaseModel, EmailStr

from db.session import get_db
from domain.users.models import User
from domain.products.models import Product
from core.config import settings
from jose import jwt
import bcrypt

router = APIRouter()
def verify_password(plain_password: str, hashed_password: str):
    # Check if we have a hashed password to compare against
    if not hashed_password:
        return False
    # bcrypt expects bytes for both arguments
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def hash_password(password: str):
    # bcrypt expects bytes for both arguments
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": int(expire.timestamp())})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

class UserRegister(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
async def register(user_in: UserRegister, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists",
        )
    new_user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        role="customer", # Default role
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {
        "email": new_user.email,
        "role": new_user.role
    }

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Standard check: Find user by email
    user = db.query(User).filter(User.email == form_data.username).first()
    
    # Verify user exists
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Safely verify password; if hash is invalid/legacy, it may raise ValueError in bcrypt
    password_ok = False
    try:
        password_ok = verify_password(form_data.password, user.hashed_password)
    except Exception as e:
        print(f"CRITICAL: Password verification crash for {form_data.username}: {e}")
        password_ok = False

    if not password_ok:
        print(f"WARNING: Login attempt failed for {form_data.username}. Authentication denied.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "role": user.role
        }
    }

@router.get("/ready")
@router.get("/v1/ready")
async def health_check():
    return {"status": "ready", "timestamp": str(datetime.now(timezone.utc))}

# Compatibility Aliases for older/cached frontend requests
@router.post("/v1/login")
async def login_compat(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    return await login(form_data, db)

@router.post("/v1/register")
async def register_compat(user_in: UserRegister, db: Session = Depends(get_db)):
    return await register(user_in, db)

from sqlalchemy import func
from domain.products.models import Product, Comment

@router.get("/owner/dashboard")
async def owner_dashboard(db: Session = Depends(get_db)):
    # Calculate real engagement metrics
    total_likes = db.query(func.sum(Product.likes_count)).scalar() or 0
    total_comments = db.query(Comment).count()
    total_users = db.query(User).count()
    
    # Real data: weighted traffic score
    real_traffic = (total_likes * 3) + (total_comments * 5) + (total_users * 12)
    
    return {
        "active_products": db.query(Product).count(),
        "total_traffic": real_traffic,
        "conversion_rate": round(min(100, (total_comments / (total_likes + 1)) * 100), 1) if total_likes > 0 else 0,
        "recent_sales": []
    }

# Catch double /api/api or /api/v1 calls if frontend is misconfigured
@router.get("/api/owner/dashboard")
@router.get("/v1/owner/dashboard")
async def owner_dashboard_compat(db: Session = Depends(get_db)):
    return await owner_dashboard(db)


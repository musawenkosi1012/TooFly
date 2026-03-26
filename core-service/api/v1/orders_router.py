from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from db.session import get_db
from services.order_service import order_service
from typing import Dict, Any

router = APIRouter(prefix="/orders")

@router.post("/checkout")
async def checkout(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    # Mock user for now since full auth is complex to rebuild quickly
    # In production, this would use a Depends(get_current_active_user)
    from domain.users.models import User
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=401, detail="No user found to simulate checkout. Seed users first.")
        
    return order_service.create_order(db, user, data)

@router.post("/status/{order_id}")
async def check_order_status(order_id: int, db: Session = Depends(get_db)):
    return order_service.sync_order_status(db, order_id)

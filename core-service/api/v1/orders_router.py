from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from db.session import get_db
from services.order_service import order_service
from typing import Dict, Any
from core.security import get_current_user
from domain.users.models import User
from domain.orders.schemas import OrderCreate

router = APIRouter(prefix="/orders")

@router.post("/checkout")
async def checkout(order_data: OrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Convert Pydantic model to dict for existing order_service
    data = order_data.model_dump()
    return order_service.create_order(db, current_user, data)

@router.post("/status/{order_id}")
async def check_order_status(order_id: int, db: Session = Depends(get_db)):
    return order_service.sync_order_status(db, order_id)

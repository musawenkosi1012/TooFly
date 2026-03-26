from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from db.session import get_db
from core.config import settings
from services.order_service import order_service
from typing import Dict, Any, Optional

router = APIRouter(prefix="/internal")

def verify_internal_key(x_internal_key: Optional[str] = Header(None)):
    if not x_internal_key or x_internal_key != settings.INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid internal security key")
    return x_internal_key

@router.post("/payment-update", dependencies=[Depends(verify_internal_key)])
async def payment_update(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    order_id = data.get("order_id")
    status = data.get("status")
    poll_url = data.get("poll_url")
    
    if not order_id or not status:
        raise HTTPException(status_code=400, detail="Malformed update payload")
        
    success = order_service.process_payment_update(db, int(order_id), status, poll_url)
    if not success:
        raise HTTPException(status_code=404, detail=f"Order #{order_id} not found")
        
    return {"message": "Order updated successfully", "status": status}

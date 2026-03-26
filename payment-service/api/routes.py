from fastapi import APIRouter, Request, HTTPException, Depends
from services.payment_service import payment_service
from typing import Dict, Any

router = APIRouter(prefix="/api/v1/payments")

@router.post("/create")
async def create_payment(request: Request):
    data = await request.json()
    if not all(k in data for k in ("order_id", "email", "amount")):
        raise HTTPException(status_code=400, detail="Missing required payment data")
    return payment_service.initiate_payment(data)

@router.post("/status")
async def check_status(request: Request):
    payload = await request.json()
    poll_url = payload.get("poll_url")
    if not poll_url:
        raise HTTPException(status_code=400, detail="poll_url is required")
    return payment_service.handle_status_check(poll_url)

@router.post("/callback")
async def paynow_callback(request: Request):
    form_raw = await request.form()
    form_data = {k: v for k, v in form_raw.items()}
    return payment_service.handle_callback(form_data)

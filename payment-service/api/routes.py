from fastapi import APIRouter, Request, HTTPException, Depends
from services.payment_service import payment_service
from typing import Dict, Any
from api.schemas import PaymentCreate, PaymentStatusCheck

router = APIRouter(prefix="/api/v1/payments")

@router.post("/create")
async def create_payment(payment_data: PaymentCreate):
    data = payment_data.model_dump()
    return payment_service.initiate_payment(data)

@router.post("/status")
async def check_status(status_req: PaymentStatusCheck):
    return payment_service.handle_status_check(status_req.poll_url)

@router.post("/callback")
async def paynow_callback(request: Request):
    form_raw = await request.form()
    form_data = {k: v for k, v in form_raw.items()}
    return payment_service.handle_callback(form_data)

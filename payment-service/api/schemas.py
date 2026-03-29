from pydantic import BaseModel, EmailStr

class PaymentCreate(BaseModel):
    order_id: int
    email: EmailStr
    amount: float

class PaymentStatusCheck(BaseModel):
    poll_url: str

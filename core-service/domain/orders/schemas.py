from pydantic import BaseModel
from typing import List, Optional

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    price_at_order: float

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    total_amount: float
    shipping_address: Optional[str] = None

from pydantic import BaseModel
from typing import Optional, List

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: Optional[str] = "General"
    image_url: Optional[str] = None
    stock: Optional[int] = 0

class ProductImageCreate(BaseModel):
    urls: List[str]

class CommentCreate(BaseModel):
    content: str

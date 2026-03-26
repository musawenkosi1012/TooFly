from sqlalchemy import Column, Integer, String, Float, Text
from db.base_class import Base

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    category = Column(String(50))
    image_url = Column(String(500))
    stock = Column(Integer, default=0)
    likes_count = Column(Integer, default=0)

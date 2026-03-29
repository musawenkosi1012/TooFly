from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from db.base_class import Base

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    # Supabase-compatible identity (email as string)
    user_email = Column(String(255), nullable=True) # or nullable=False if always required
    total_amount = Column(Float, nullable=False)
    status = Column(String, default="pending") # pending, paid, failed
    payment_reference = Column(String, nullable=True) # poll_url from Paynow/Stripe
    created_at = Column(DateTime, default=datetime.utcnow)
    
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer) # For simplicity, not linking to product table yet
    quantity = Column(Integer, nullable=False)
    price_at_order = Column(Float, nullable=False)
    
    order = relationship("Order", back_populates="items")

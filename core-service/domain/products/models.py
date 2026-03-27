from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    category = Column(String(50))
    image_url = Column(Text)
    stock = Column(Integer, default=0)
    likes_count = Column(Integer, default=0)
    
    # Relationship to additional images
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")

class ProductImage(Base):
    __tablename__ = "product_images"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    url = Column(Text, nullable=False)
    
    product = relationship("Product", back_populates="images")

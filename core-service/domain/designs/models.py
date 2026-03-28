from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from db.base_class import Base

class Design(Base):
    __tablename__ = "designs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"))
    name = Column(String, default="Untitled Perspective")
    canvas_json = Column(JSON)
    preview_url = Column(String, nullable=True) # Low-res for UI
    final_output_url = Column(String, nullable=True) # High-res generated from JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="designs")

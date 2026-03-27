from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from db.base_class import Base

class User(Base):
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="customer") # customer, it_admin, owner
    is_active = Column(Boolean, default=True)

    designs = relationship("Design", back_populates="user")

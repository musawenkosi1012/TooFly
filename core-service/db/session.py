from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from core.config import settings
from typing import Generator

# Supabase PostgreSQL connection Pooler (Using Transaction Mode port 6543 for better connection management)
DATABASE_URL = f"postgresql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:6543/{settings.DB_NAME}?sslmode=require"

# Added pool_pre_ping=True to automatically recover from dropped connections
engine = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

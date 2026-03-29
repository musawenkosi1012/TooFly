import sys
import os

# Add the current directory to sys.path so we can import modules from core-service
sys.path.append(os.getcwd())

from db.session import SessionLocal
from domain.users.models import User
from core.security import hash_password

def seed():
    db = SessionLocal()
    try:
        # 1. Create IT Admin (Access to System Monitor)
        admin_email = "admin@toofly.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                hashed_password=hash_password("admin123"),
                role="it_admin",
                is_active=True
            )
            db.add(admin)
            print(f"Created IT Admin: {admin_email} / admin123")
        else:
            print(f"IT Admin already exists: {admin_email}")

        # 2. Create Owner (Access to Admin Portal/Inventory)
        owner_email = "owner@toofly.com"
        owner = db.query(User).filter(User.email == owner_email).first()
        if not owner:
            owner = User(
                email=owner_email,
                hashed_password=hash_password("owner123"),
                role="owner",
                is_active=True
            )
            db.add(owner)
            print(f"Created Owner: {owner_email} / owner123")
        else:
            print(f"Owner already exists: {owner_email}")

        db.commit()
        print("--- Seeding completed successfully ---")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()

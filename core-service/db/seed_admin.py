import sys
import os
import bcrypt

# Add the parent directory to the path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from sqlalchemy.orm import Session
from db.session import SessionLocal
from domain.users.models import User

def hash_password_direct(password: str):
    # bcrypt.hashpw expects bytes
    byte_pwd = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(byte_pwd, salt)
    return hashed.decode('utf-8')

def seed_admin():
    db: Session = SessionLocal()
    try:
        email = "admin@toofly.com"
        password = "Musa2005"
        
        print(f"Target Email: {email}")
        print(f"Password length: {len(password)}")
        
        # Use bcrypt directly to avoid passlib version conflicts
        hashed = hash_password_direct(password)
        print(f"Hashed password generated directly using bcrypt.")
        
        # Check if user already exists
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"User {email} already exists. Updating password and role...")
            user.hashed_password = hashed
            user.role = "owner"
            user.is_active = True
        else:
            print(f"Creating new admin user: {email}")
            user = User(
                email=email,
                hashed_password=hashed,
                role="owner",
                is_active=True
            )
            db.add(user)
        
        db.commit()
        print("Successfully committed to database.")
    except Exception as e:
        print(f"Error seeding admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()

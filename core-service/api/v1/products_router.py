from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from db.session import get_db
from domain.products.models import Product, ProductImage, Comment, ProductLike
from domain.users.models import User
from typing import List, Optional
from datetime import datetime
from core.config import settings
from jose import jwt
from fastapi.security import OAuth2PasswordBearer

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login"
)

def get_current_user(db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

router = APIRouter(prefix="/products")

@router.get("/", response_model=List[dict])
def get_products(db: Session = Depends(get_db)):
    products = db.query(Product).options(joinedload(Product.images), joinedload(Product.comments)).all()
    # Simple formatting for frontend compatibility
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "category": p.category,
            "image_url": p.image_url,
            "images": [{"id": img.id, "url": img.url} for img in p.images],
            "comments": [{"id": c.id, "content": c.content, "timestamp": c.timestamp} for c in p.comments],
            "stock": p.stock,
            "likes_count": p.likes_count
        } for p in products
    ]

@router.post("/", response_model=dict)
def create_product(product_data: dict, db: Session = Depends(get_db)):
    new_product = Product(
        name=product_data["name"],
        description=product_data.get("description"),
        price=product_data["price"],
        category=product_data.get("category", "General"),
        image_url=product_data.get("image_url"),
        stock=product_data.get("stock", 0)
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return {"id": new_product.id, "status": "created"}
@router.delete("/{product_id}", response_model=dict)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"status": "deleted", "id": product_id}

@router.delete("/manage/wipe", response_model=dict)
def wipe_all_products(db: Session = Depends(get_db)):
    # CAUTION: This removes all products. Use sparingly.
    count = db.query(Product).delete()
    db.commit()
    return {"status": "wiped", "count": count}

@router.post("/{product_id}/images", response_model=dict)
def add_product_images(product_id: int, payload: dict, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    urls = payload.get("urls", [])
    for url in urls:
        new_img = ProductImage(product_id=product_id, url=url)
        db.add(new_img)
    
    db.commit()
    return {"status": "success", "added": len(urls)}

@router.post("/{product_id}/like", response_model=dict)
def like_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if already liked
    existing_like = db.query(ProductLike).filter(
        ProductLike.product_id == product_id,
        ProductLike.user_id == current_user.id
    ).first()
    
    if existing_like:
        # Unlike
        db.delete(existing_like)
        product.likes_count = max(0, product.likes_count - 1)
        db.commit()
        return {"status": "unliked", "new_count": product.likes_count, "is_liked": False}
    else:
        # Like
        new_like = ProductLike(product_id=product_id, user_id=current_user.id)
        db.add(new_like)
        product.likes_count += 1
        db.commit()
        return {"status": "liked", "new_count": product.likes_count, "is_liked": True}

@router.post("/{product_id}/comment", response_model=dict)
def add_comment(product_id: int, payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    new_comment = Comment(
        product_id=product_id,
        user_id=current_user.id,
        content=payload["content"]
    )
    db.add(new_comment)
    db.commit()
    return {"status": "commented", "id": new_comment.id}

@router.post("/seed", response_model=dict)
def seed_products(db: Session = Depends(get_db)):

    # Check if products already exist
    if db.query(Product).first():
        return {"status": "already seeded"}
        
    initial_products = [
        {
            "name": "Nova Shell",
            "description": "Adaptive weather-reactive outer layer, SS26 Alpha Edition. GORE-TEX Pro 3L construction with dynamic venting.",
            "price": 890.00,
            "category": "Outerwear",
            "image_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
            "stock": 15
        },
        {
            "name": "Metric Cargo v2",
            "description": "High-tenacity nylon ripstop with 14 integrated modular storage compartments. Articulated knees for full range of motion.",
            "price": 540.00,
            "category": "Pants",
            "image_url": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800",
            "stock": 25
        },
        {
            "name": "Vektor Base Tier",
            "description": "Merino-blend moisture-wicking compression layer with silver-thread anti-microbial properties.",
            "price": 180.00,
            "category": "Streetwear",
            "image_url": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
            "stock": 50
        }
    ]
    
    for p_data in initial_products:
        product = Product(**p_data)
        db.add(product)
    
    db.commit()
    return {"status": "success", "count": len(initial_products)}

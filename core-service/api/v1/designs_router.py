from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from db.session import get_db
from domain.designs.models import Design
from domain.users.models import User
from api.v1.products_router import get_current_user
from typing import List, Optional
from datetime import datetime
import os
import io
import json
import base64
from PIL import Image, ImageDraw, ImageFont, ImageOps

router = APIRouter(prefix="/designs")

# Printing specs (Standard 300 DPI)
DPI_SCALE = 6 # Viewport 500x600 -> Export 3000x3600
EXPORT_WIDTH = 500 * DPI_SCALE
EXPORT_HEIGHT = 600 * DPI_SCALE

@router.post("/", response_model=dict)
def save_design(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Saves a design and generates a high-res print file in the background (simulated for now)
    """
    # 1. Store Low-Res Preview (Base64 from frontend)
    preview_data = payload.get("preview_base64", "")
    preview_url = None
    if preview_data:
        # Save to /tmp/static/previews
        os.makedirs("/tmp/static/previews", exist_ok=True)
        filename = f"design_{datetime.now().timestamp()}.png"
        file_path = f"/tmp/static/previews/{filename}"
        
        # Strip header
        if "," in preview_data:
            preview_data = preview_data.split(",")[1]
            
        with open(file_path, "wb") as f:
            f.write(base64.b64decode(preview_data))
        preview_url = f"/static/previews/{filename}"

    # 2. Create Design Record
    design = Design(
        user_id=current_user.id,
        name=payload.get("name", "Untitled Piece"),
        canvas_json=payload.get("elements", []),
        preview_url=preview_url
    )
    db.add(design)
    db.commit()
    db.refresh(design)

    # 3. BACKGROUND: Render High-Res Production File (Pillow)
    render_high_res(design.id, payload.get("elements", []), db)

    return {
        "id": design.id,
        "name": design.name,
        "preview_url": design.preview_url,
        "status": "synchronized"
    }

@router.get("/", response_model=List[dict])
def get_user_designs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    designs = db.query(Design).filter(Design.user_id == current_user.id).order_by(Design.created_at.desc()).all()
    return [{
        "id": d.id,
        "name": d.name,
        "preview_url": d.preview_url,
        "created_at": d.created_at
    } for d in designs]

def render_high_res(design_id: int, elements: list, db: Session):
    """
    Core Rendering Pipeline: Reconstructs the canvas element-by-element
    at 300 DPI for production-ready PNG output.
    """
    try:
        # Create transparent base
        img = Image.new("RGBA", (EXPORT_WIDTH, EXPORT_HEIGHT), (255, 255, 255, 0))
        draw = ImageDraw.Draw(img)

        for el in elements:
            # Scale coordinates
            x = el.get("x", 0) * DPI_SCALE
            y = el.get("y", 0) * DPI_SCALE
            
            if el["type"] == "text":
                # Font logic (using fallback for now)
                font_size = el.get("fontSize", 24) * DPI_SCALE
                try:
                    # Attempt to find system font or bundled font
                    font = ImageFont.truetype("arial.ttf", int(font_size))
                except:
                    font = ImageFont.load_default()
                
                color = el.get("color", "#000000")
                draw.text((x, y), el.get("text", ""), fill=color, font=font)
            
            elif el["type"] == "image":
                # Image rendering with scaling
                src = el.get("src", "")
                if src:
                    # Handle internal vs external images
                    # (In production, load from object storage)
                    pass

        # Save final output
        os.makedirs("/tmp/static/production", exist_ok=True)
        filename = f"production_{design_id}.png"
        file_path = f"/tmp/static/production/{filename}"
        img.save(file_path, "PNG", dpi=(300, 300))
        
        # Update record
        design = db.query(Design).filter(Design.id == design_id).first()
        if design:
            design.final_output_url = f"/static/production/{filename}"
            db.commit()
            
    except Exception as e:
        print(f"Rendering failed: {e}")

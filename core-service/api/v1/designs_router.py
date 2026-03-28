from fastapi import APIRouter, Depends, HTTPException, Header, BackgroundTasks
from sqlalchemy.orm import Session
from db.session import get_db
from domain.designs.models import Design
from domain.users.models import User
from api.v1.products_router import get_current_user
from core.config import settings
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
def save_design(payload: dict, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Saves a design and generates a high-res print file in the background (simulated for now)
    """
    # 1. Store Low-Res Preview (Base64 from frontend)
    preview_data = payload.get("preview_base64", "")
    preview_url = None
    if preview_data:
        # Save to centralized previews dir
        os.makedirs(settings.PREVIEW_DIR, exist_ok=True)
        filename = f"design_{datetime.now().timestamp()}.png"
        file_path = os.path.join(settings.PREVIEW_DIR, filename)
        
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
    background_tasks.add_task(render_high_res, design.id, payload.get("elements", []), db)

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
        "final_output_url": d.final_output_url,
        "created_at": d.created_at
    } for d in designs]

@router.get("/{design_id}", response_model=dict)
def get_design(design_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    design = db.query(Design).filter(Design.id == design_id, Design.user_id == current_user.id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    return {
        "id": design.id,
        "name": design.name,
        "elements": design.canvas_json,
        "preview_url": design.preview_url,
        "final_output_url": design.final_output_url,
        "created_at": design.created_at
    }

def render_high_res(design_id: int, elements: list, db: Session):
    """
    Core Rendering Pipeline: Reconstructs the canvas element-by-element
    at 300 DPI for production-ready PNG output.
    """
    try:
        # Create transparent base
        img = Image.new("RGBA", (EXPORT_WIDTH, EXPORT_HEIGHT), (255, 255, 255, 0))

        for el in elements:
            # Scale coordinates
            x = el.get("x", 0) * DPI_SCALE
            y = el.get("y", 0) * DPI_SCALE
            rotation = el.get("rotation", 0)
            
            if el["type"] == "text":
                text_str = el.get("text", "")
                font_size = el.get("fontSize", 24) * DPI_SCALE
                color = el.get("color", "#000000")
                
                try:
                    font = ImageFont.truetype("arial.ttf", int(font_size))
                except:
                    font = ImageFont.load_default()
                
                # Measure text
                left, top, right, bottom = font.getbbox(text_str)
                w, h = right - left, bottom - top
                if w <= 0 or h <= 0: continue
                
                # Create element canvas (add padding to prevent clipping during rotation)
                padding = 20
                el_img = Image.new("RGBA", (w + padding*2, h + padding*2), (0,0,0,0))
                el_draw = ImageDraw.Draw(el_img)
                el_draw.text((padding - left, padding - top), text_str, fill=color, font=font)
                
                # Apply scaling
                scale_x = el.get("scaleX", 1)
                scale_y = el.get("scaleY", 1)
                if scale_x != 1 or scale_y != 1:
                    el_img = el_img.resize((int(el_img.width * scale_x), int(el_img.height * scale_y)), Image.Resampling.LANCZOS)
                
                # Apply rotation
                if rotation != 0:
                    # Konva rotates clockwise, PIL rotates counter-clockwise
                    el_img = el_img.rotate(-rotation, expand=True, resample=Image.Resampling.BICUBIC)
                
                # Composite onto base
                img.alpha_composite(el_img, (int(x - padding), int(y - padding)))
                
            elif el["type"] == "image":
                src = el.get("src", "")
                if not src: continue
                
                el_img = None
                if src.startswith("data:image"):
                    try:
                        # Extract base64
                        header, encoded = src.split(",", 1)
                        img_data = base64.b64decode(encoded)
                        el_img = Image.open(io.BytesIO(img_data)).convert("RGBA")
                    except Exception as e:
                        print(f"Failed to decode base64: {e}")
                
                if el_img:
                    # Scale based on DPI and element scale
                    scale_x = el.get("scaleX", 1) * DPI_SCALE
                    scale_y = el.get("scaleY", 1) * DPI_SCALE
                    target_w = int(el_img.width * scale_x)
                    target_h = int(el_img.height * scale_y)
                    
                    if target_w > 0 and target_h > 0:
                        el_img = el_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
                    
                    if rotation != 0:
                        el_img = el_img.rotate(-rotation, expand=True, resample=Image.Resampling.BICUBIC)
                        
                    img.alpha_composite(el_img, (int(x), int(y)))

        # Save final output
        # In production, use persistent storage; using centralized STATIC_DIR
        os.makedirs(settings.PRODUCTION_DIR, exist_ok=True)
        filename = f"production_{design_id}.png"
        file_path = os.path.join(settings.PRODUCTION_DIR, filename)
        img.save(file_path, "PNG", dpi=(300, 300))
        
        # We need a new session context since BackgroundTasks might run after req finishes
        # But for now, we'll try with the passed session, though it's safer to create a new one
        design = db.query(Design).filter(Design.id == design_id).first()
        if design:
            design.final_output_url = f"/static/production/{filename}"
            db.commit()
            
    except Exception as e:
        print(f"Rendering failed: {e}")

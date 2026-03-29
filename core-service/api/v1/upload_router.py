from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import pathlib
import uuid

router = APIRouter()

# For a production app, you'd use S3 or a similar persistent media store.
# Choreo uses a read-only FS, so we'll save in /tmp/static/uploads (backed by emptyDir)
UPLOAD_DIR = pathlib.Path("/tmp/static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

from core.supabase import supabase

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only images are allowed")
    
    try:
        # Generate unique filename
        ext = pathlib.Path(file.filename).suffix
        filename = f"{uuid.uuid4()}{ext}"
        
        # Read file content with 5MB limit
        MAX_SIZE = 5 * 1024 * 1024 # 5 MB
        content = await file.read()
        if len(content) > MAX_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 5MB.")
        
        # Upload to Supabase Storage - Default bucket 'product-images'
        res = supabase.storage.from_("product-images").upload(
            path=filename,
            file=content,
            file_options={"content-type": file.content_type}
        )
        
        # Get public URL
        public_url = supabase.storage.from_("product-images").get_public_url(filename)
        
        return {"image_url": public_url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload to Supabase failed: {str(e)}")

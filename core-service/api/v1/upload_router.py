from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import pathlib
import uuid

router = APIRouter()

# For a production app, you'd use S3 or a similar persistent media store.
# Choreo uses a read-only FS, so we'll save in /tmp/static/uploads (backed by emptyDir)
UPLOAD_DIR = pathlib.Path("/tmp/static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

import base64

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Validation
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only images are allowed")
    
    # Read the file and convert to Base64
    try:
        content = await file.read()
        encoded = base64.b64encode(content).decode('utf-8')
        data_uri = f"data:{file.content_type};base64,{encoded}"
        return {"image_url": data_uri}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not encode file: {e}")

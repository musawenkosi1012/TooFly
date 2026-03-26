from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import pathlib
import uuid

router = APIRouter()

# For a production app, you'd use S3 or a similar persistent media store.
# Choreo uses a read-only FS, so we'll save in /tmp/static/uploads (backed by emptyDir)
UPLOAD_DIR = pathlib.Path("/tmp/static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Simple validation
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only images are allowed")
    
    # Generate a unique filename
    extension = pathlib.Path(file.filename).suffix or ".jpg"
    filename = f"{uuid.uuid4()}{extension}"
    file_path = UPLOAD_DIR / filename
    
    # Save the file
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")
    
    # Return the relative URL. 
    # The frontend will prepend the API base URL if needed, or the browser will resolve if the app is on the same host.
    return {"image_url": f"/static/uploads/{filename}"}

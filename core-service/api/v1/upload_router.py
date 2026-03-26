from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import pathlib
import uuid

router = APIRouter()

# For a production app, you'd use S3 or a similar persistent media store.
# For this demo, we'll save locally in /app/public/uploads OR just return a mock URL.
UPLOAD_DIR = pathlib.Path("/app/static/uploads")
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
    
    # Return the URL.
    # We use a hardcoded domain OR relative URL depending on configuration.
    # For now, let's assume /static/uploads/... is served by the backend.
    return {"image_url": f"http://localhost:8000/static/uploads/{filename}"}

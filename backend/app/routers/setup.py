from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from pathlib import Path
import shutil
import uuid

from ..models.user import User
from ..utils.database import get_db
from ..routers.auth import get_current_user

router = APIRouter(prefix="/setup", tags=["setup"])

# Create directories if they don't exist
GUIDELINES_DIR = Path("data/guidelines")
TEMPLATES_DIR = Path("data/templates")
GUIDELINES_DIR.mkdir(parents=True, exist_ok=True)
TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/guidelines")
async def upload_guideline(
    file: UploadFile = File(...),
    name: str = None,
    description: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a new compliance guideline document"""
    try:
        # Generate unique filename
        ext = Path(file.filename).suffix
        filename = f"{uuid.uuid4()}{ext}"
        file_path = GUIDELINES_DIR / filename

        # Save the file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "id": filename,
            "name": name or file.filename,
            "description": description,
            "uploaded_by": current_user.email,
            "uploaded_at": "now"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/guidelines")
async def list_guidelines(
    current_user: User = Depends(get_current_user)
):
    """List all available compliance guidelines"""
    try:
        guidelines = []
        for file_path in GUIDELINES_DIR.glob("*"):
            if file_path.is_file():
                guidelines.append({
                    "id": file_path.name,
                    "name": file_path.stem,
                    "size": file_path.stat().st_size,
                    "uploaded_at": file_path.stat().st_mtime
                })
        return {"guidelines": guidelines}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/templates")
async def upload_template(
    file: UploadFile = File(...),
    name: str = None,
    description: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a new document template"""
    try:
        # Generate unique filename
        ext = Path(file.filename).suffix
        filename = f"{uuid.uuid4()}{ext}"
        file_path = TEMPLATES_DIR / filename

        # Save the file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "id": filename,
            "name": name or file.filename,
            "description": description,
            "uploaded_by": current_user.email,
            "uploaded_at": "now"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/templates")
async def list_templates(
    current_user: User = Depends(get_current_user)
):
    """List all available document templates"""
    try:
        templates = []
        for file_path in TEMPLATES_DIR.glob("*"):
            if file_path.is_file():
                templates.append({
                    "id": file_path.name,
                    "name": file_path.stem,
                    "size": file_path.stat().st_size,
                    "uploaded_at": file_path.stat().st_mtime
                })
        return {"templates": templates}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/setup/status")
def check_setup_status(db: Session = Depends(get_db)):
    try:
        # Check if any admin user exists
        admin_exists = db.query(User).filter(User.role == 'admin').first() is not None
        return {"isSetupComplete": admin_exists}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 
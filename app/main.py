from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from pathlib import Path
import uuid
from datetime import datetime

from app.services.pdf_service import extract_text_from_pdf
from app.services.llm_service import PSSIAnalyzerAgent
from app.tools.jira_tool import create_issue
from app.tools.infra_agent import analyze_infrastructure


# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="ComplianceAI Agent")

# Mount static files
app.mount("/static", StaticFiles(directory="complianceUI"), name="static")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return FileResponse("complianceUI/index.html")

@app.post("/upload")
async def upload_document(norm: UploadFile = File(...), pssi: UploadFile = File(...)):
    try:
        # Generate unique filenames
        norm_extension = norm.filename.split(".")[-1]
        pssi_extension = pssi.filename.split(".")[-1]
        
        norm_filename = f"{uuid.uuid4()}.{norm_extension}"
        pssi_filename = f"{uuid.uuid4()}.{pssi_extension}"
        
        norm_path = UPLOAD_DIR / norm_filename
        pssi_path = UPLOAD_DIR / pssi_filename
        
        # Save the files
        with open(norm_path, "wb") as norm_buffer:
            norm_content = await norm.read()
            norm_buffer.write(norm_content)
            
        with open(pssi_path, "wb") as pssi_buffer:
            pssi_content = await pssi.read()
            pssi_buffer.write(pssi_content)
        
        return {
            "norm_id": norm_filename,
            "pssi_id": pssi_filename,
            "uploaded_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze_documents(norm_id: str = Form(...), pssi_id: str = Form(...)):
    try:
        # Get file paths
        norm_path = UPLOAD_DIR / norm_id
        pssi_path = UPLOAD_DIR / pssi_id

        if not norm_path.exists() or not pssi_path.exists():
            raise HTTPException(status_code=404, detail="Files not found")

        # Extract text from PDFs
        norm_text = extract_text_from_pdf(norm_path)
        pssi_text = extract_text_from_pdf(pssi_path)

        # Initialize LLM service and analyze
        llm_service = PSSIAnalyzerAgent()
        tools = [create_issue, analyze_infrastructure]
        result = llm_service.analyze_documents(norm_text, pssi_text, tools)

        print(result)

        return result

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
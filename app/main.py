from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path
import uuid
from datetime import datetime

from app.services.pdf_service import extract_text_from_pdf
from app.agents.infra_agent import InfraAgent
from app.agents.norm_agent import PSSIAnalyzerAgent


# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Path to norms directory
NORMS_DIR = Path("norms")

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
    return FileResponse("complianceUI/setup.html")

@app.get("/norms")
async def get_available_norms():
    """Get a list of available norms/standards"""
    try:
        norm_files = list(NORMS_DIR.glob("*.pdf"))
        norms = [
            {
                "id": norm_file.stem,
                "name": norm_file.stem.replace("_", " ").title(),
                "filename": norm_file.name
            }
            for norm_file in norm_files
        ]
        return {"norms": norms}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_document(pssi: UploadFile = File(...)):
    try:
        # Generate unique filename for the PSSI document
        pssi_extension = pssi.filename.split(".")[-1]
        pssi_filename = f"{uuid.uuid4()}.{pssi_extension}"
        pssi_path = UPLOAD_DIR / pssi_filename
        
        # Save the file
        with open(pssi_path, "wb") as pssi_buffer:
            pssi_content = await pssi.read()
            pssi_buffer.write(pssi_content)
        
        return {
            "pssi_id": pssi_filename,
            "uploaded_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze_documents(pssi_id: str = Form(...), norm_name: str = Form(None)):
    try:
        # Get file paths
        pssi_path = UPLOAD_DIR / pssi_id
        
        # Use hardcoded norm if none provided
        if not norm_name:
            norm_name = "guide_hygiene_informatique_anssi.pdf"
            
        norm_path = NORMS_DIR / norm_name
        
        # Ensure norm file exists
        if not norm_path.exists():
            # Try with .pdf extension if it wasn't included
            norm_path = NORMS_DIR / f"{norm_name}.pdf"
            if not norm_path.exists():
                return JSONResponse(
                    status_code=404,
                    content={"detail": f"Norm file not found: {norm_name}. Using default instead."}
                )
                # Fall back to default norm
                norm_path = NORMS_DIR / "guide_hygiene_informatique_anssi.pdf"
        
        if not pssi_path.exists():
            return JSONResponse(
                status_code=404,
                content={"detail": "PSSI file not found"}
            )

        # Extract text from PDFs
        norm_text = extract_text_from_pdf(norm_path)
        pssi_text = extract_text_from_pdf(pssi_path)

        # Initialize agents and analyze
        norm_agent = PSSIAnalyzerAgent()
        infra_agent = InfraAgent()

        # Analyze documents
        doc_result = norm_agent.analyze_documents(norm_text, pssi_text)
        
        # Analyze infrastructure
        infra_result = infra_agent.analyze_infrastructure(pssi_text)

        # Return combined results
        return {
            "infrastructure_analysis": infra_result,
            "document_analysis": doc_result,
        }

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
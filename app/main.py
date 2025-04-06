from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from pathlib import Path
import uuid
import re
from datetime import datetime

from app.services.pdf_service import extract_text_from_pdf
from app.agents.infra_agent import InfraAgent
from app.agents.norm_agent import PSSIAnalyzerAgent
from app.agents.orchestrator import ComplianceOrchestrator, ReflectComplianceOrchestrator

from app.tools.jira_tool import create_issue


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

# Middleware to handle page refreshes and direct URL access
@app.middleware("http")
async def handle_page_refreshes(request: Request, call_next):
    # Get the path
    path = request.url.path
    
    # List of HTML files we want to serve directly
    html_files = ["dashboard.html", "report.html", "hitl.html", "loading.html", "fast_analyze.html"]
    
    # Check if it's a direct HTML file access (except for root/index)
    if path != "/" and any(path.endswith(file) for file in html_files):
        # Serve the file directly from complianceUI
        file_path = path.strip("/")
        return FileResponse(f"complianceUI/{file_path}")
    
    # Continue with normal request processing
    response = await call_next(request)
    return response

@app.get("/")
async def root():
    return FileResponse("complianceUI/setup.html")

@app.get("/fast")
async def fast_analyze_redirect():
    return RedirectResponse(url="/fast_analyze.html")

@app.get("/dashboard.html")
async def dashboard():
    return FileResponse("complianceUI/dashboard.html")

@app.get("/fast_analyze.html")
async def fast_analyze_page():
    return FileResponse("complianceUI/fast_analyze.html")

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
    

# Usage
@app.post("/fast_analyze")
async def analyze(policy: str = Form(...)):
    orchestrator = ComplianceOrchestrator()
    inspection_plan = orchestrator.policy_parser(policy)
    check_results = orchestrator.execute_checks(inspection_plan["checks"])
    
    return orchestrator.generate_report(check_results, inspection_plan["priority"])

@app.post("/reflect_analyze")
async def reflect_analyze(policy: str = Form(...)):
    """
    Analyze policy using the reflective agent-based orchestrator with planning and reflection capabilities.
    """
    try:
        # Check policy size - estimate tokens (roughly 4 chars = 1 token)
        estimated_tokens = len(policy) // 4
        max_safe_tokens = 12000  # Safe limit for policy text
        
        if estimated_tokens > max_safe_tokens:
            # Truncate with a notice
            truncation_point = max_safe_tokens * 4
            truncated_notice = "\n\n[NOTICE: Policy text was truncated to fit token limits. The analysis covers only the beginning portion.]"
            policy = policy[:truncation_point] + truncated_notice
            print(f"Policy text truncated from {estimated_tokens} to {max_safe_tokens} estimated tokens")
            
        orchestrator = ReflectComplianceOrchestrator()
        results = orchestrator.orchestrate(policy)
        
        # Add info about text truncation if it occurred
        if estimated_tokens > max_safe_tokens:
            results["truncated"] = True
            results["original_token_estimate"] = estimated_tokens
            if "summary" in results:
                results["summary"] = "**[TRUNCATED ANALYSIS]** " + results["summary"]
                
        return results
    except Exception as e:
        error_message = str(e)
        print(f"Error in reflect_analyze: {error_message}")
        
        # Check for token limit errors
        if "maximum context length" in error_message or "token" in error_message:
            raise HTTPException(
                status_code=413,
                detail="Policy text is too large for processing. Please reduce size or use standard analysis."
            )
        
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

        print("Document Analysis Steps:", doc_result["steps"])
        print("Infrastructure Analysis Result:", infra_result)

        # Pre-process results to extract structured data for the dashboard
        processed_results = {
            "document_analysis": {
                "raw": doc_result,
                "processed": extract_structured_data(doc_result)
            },
            "infrastructure_analysis": {
                "raw": infra_result,
                "processed": extract_structured_data(infra_result)
            }
        }

        return processed_results

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

def extract_structured_data(result):
    """
    Extract structured data from analysis results for easier frontend consumption
    """
    if not result or not isinstance(result, dict):
        return {
            "score": 0,
            "tickets": [],
            "issues": []
        }
    
    analysis_text = result.get("analysis", "")
    
    # Extract score from analysis text
    score = 70  # Default score
    score_patterns = [
        r'compliance\s+score:?\s*\*\*\s*(\d+)(?:\/100|\s*%)',
        r'#+\s*compliance\s+score:?\s*\**\s*(\d+)(?:\/100|\s*%)',
        r'\b(?:compliance\s+score|score)\s*:?\s*(\d+)(?:\s*%|\s*\/\s*100)?',
        r'\b(?:compliance)\s+(?:is|of)\s*:?\s*(\d+)(?:\s*%|\s*\/\s*100)?',
        r'\bscore\s+of\s+(\d+)(?:\s*%)?(?:\s+out\s+of\s+100)?',
        r'\bcompliance\s+of\s+(\d+)(?:\s*%|\s*\/\s*100)?',
        r'\b(\d+)(?:\s*%|\s*\/\s*100)\s+compliant'
    ]
    
    for pattern in score_patterns:
        matches = re.search(pattern, analysis_text, re.IGNORECASE)
        if matches and matches.group(1):
            score = int(matches.group(1))
            break
    
    # Extract tickets from analysis text
    tickets = []
    ticket_pattern = r'(?:Ticket|Issue|Item)\s+\d+:?\s*\*\*([^*]+)\*\*'
    ticket_matches = re.finditer(ticket_pattern, analysis_text, re.IGNORECASE)
    
    for match in ticket_matches:
        ticket_title = match.group(1).strip()
        start_pos = match.start()
        
        # Find next ticket or section
        next_ticket = analysis_text.find("Ticket", start_pos + 1)
        next_section = analysis_text.find("---", start_pos + 1)
        end_pos = min(
            next_ticket if next_ticket > -1 else float('inf'),
            next_section if next_section > -1 else float('inf'),
            len(analysis_text)
        )
        
        ticket_text = analysis_text[start_pos:end_pos]
        
        # Extract description
        desc_pattern = r'-\s*\*\*Description\*\*:\s*([^\n]+)'
        desc_match = re.search(desc_pattern, ticket_text, re.IGNORECASE)
        description = desc_match.group(1).strip() if desc_match else "No description provided"
        
        # Extract priority
        priority_pattern = r'-\s*\*\*Priority\*\*:\s*(High|Medium|Low)'
        priority_match = re.search(priority_pattern, ticket_text, re.IGNORECASE)
        priority = priority_match.group(1).lower() if priority_match else "medium"
        
        tickets.append({
            "title": ticket_title,
            "description": description,
            "severity": priority,
            "auto_remediate": priority != "high"
        })
    
    # Extract security issues (for infrastructure analysis)
    issues = []
    
    # Look for "Security Risk" markers
    if "Security Risk" in analysis_text:
        risk_lines = [line for line in analysis_text.split('\n') if "Security Risk" in line]
        for line in risk_lines:
            issue_match = re.search(r'\*\*([^:*]+)\*\*:\s*([^(]+)', line)
            if issue_match and issue_match.groups():
                issue_type = issue_match.group(1).strip()
                issue_value = issue_match.group(2).strip()
                
                issues.append({
                    "title": f"Security Risk: {issue_type}",
                    "description": f"{issue_type}: {issue_value} poses a security risk",
                    "severity": "high",
                    "auto_remediate": True
                })
    
    # Look for compliance issues section
    compliance_section = analysis_text.find("Key Compliance Issues:")
    if compliance_section > -1:
        section_text = analysis_text[compliance_section:]
        issue_pattern = r'\d+\.\s+\*\*([^*]+)\*\*:'
        for match in re.finditer(issue_pattern, section_text):
            issue_title = match.group(1).strip()
            start_pos = match.start()
            
            # Get description text
            end_pos = section_text.find("\n\n", start_pos + 1)
            if end_pos == -1:
                end_pos = len(section_text)
            
            issue_text = section_text[start_pos:end_pos]
            description = issue_text[issue_text.find(':') + 1:].strip()
            
            issues.append({
                "title": issue_title,
                "description": description,
                "severity": "high" if any(term in issue_title.lower() for term in ["critical", "encryption", "password", "authentication"]) else "medium",
                "auto_remediate": False
            })
    
    # If we have tools calls, extract them too
    tool_calls = result.get("tool_calls", [])
    for call in tool_calls:
        if call.get("name") == "create_issue":
            args = call.get("args", {})
            if isinstance(args, str):
                try:
                    import json
                    args = json.loads(args)
                except:
                    args = {"summary": args, "description": args}
            
            summary = args.get("summary", "Unknown Issue")
            description = args.get("description", "No description provided")
            
            tickets.append({
                "title": summary,
                "description": description,
                "severity": "high" if any(term in summary.lower() for term in ["critical", "encryption", "password", "authentication"]) else "medium",
                "auto_remediate": False
            })
    
    return {
        "score": score,
        "tickets": tickets,
        "issues": issues
    }

@app.post("/create-ticket")
async def create_jira_ticket(data: dict = Body(...)):
    try:
        summary = data.get("summary", "")
        description = data.get("description", "")
        
        if not summary or not description:
            return JSONResponse(
                status_code=400,
                content={"detail": "Summary and description are required"}
            )
        
        result = create_issue.invoke({"summary": summary, "description": description})
        return {"message": "Ticket created successfully", "result": result}
    
    except Exception as e:
        print(f"Error creating ticket: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
import os

base_dir = "analysis-service"

# Create directories
dirs = [
    "app",
    "app/api",
    "app/core",
    "app/models",
    "app/services",
    "app/utils"
]

for d in dirs:
    os.makedirs(os.path.join(base_dir, d), exist_ok=True)

files = {
    "requirements.txt": """fastapi==0.110.0
uvicorn==0.27.1
pydantic==2.6.3
requests==2.31.0
python-dotenv==1.0.1
""",
    "app/main.py": """from fastapi import FastAPI
from app.api import analyze
import os

app = FastAPI(title="ProofHire Analysis Service")

app.include_router(analyze.router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}
""",
    "app/api/analyze.py": """from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from app.services.analyzer import analyze_project_task

router = APIRouter()

class AnalyzeRequest(BaseModel):
    projectId: str
    filePath: str
    userId: str

@router.post("/analyze")
async def trigger_analysis(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    # Enqueue analysis in background
    background_tasks.add_task(analyze_project_task, request.projectId, request.filePath, request.userId)
    return {"success": True, "message": "Analysis started"}
""",
    "app/services/analyzer.py": """import os
import shutil
import time

def analyze_project_task(project_id: str, file_path: str, user_id: str):
    print(f"Starting analysis for project {project_id} from {file_path}")
    
    # 1. Validation & Secure Extraction
    temp_dir = f"/tmp/proofhire/{project_id}"
    os.makedirs(temp_dir, exist_ok=True)
    print(f"[{project_id}] Extracted to {temp_dir}")
    
    # Simulate processing time
    time.sleep(2)
    
    # 2. Static Analysis & ML Model calls (Simulated for now)
    print(f"[{project_id}] Running Static Analysis...")
    evidence = {
        "languages": [{"name": "Python", "confidence": 0.99}],
        "frameworks": [{"name": "FastAPI", "confidence": 0.95}],
    }
    
    # 3. Assessment Generation (Simulated LLM call)
    print(f"[{project_id}] Generating Assessment...")
    assessment = {
        "functionality": 88,
        "codeQuality": 82,
        "architecture": 79,
        "complexity": 85,
        "testing": 61,
        "documentation": 84,
        "security": 73,
        "maintainability": 80
    }
    
    # 4. Save to DB (Skipped in mock, in reality we push to Mongo or call Node.js API back)
    print(f"[{project_id}] Saving results...")
    
    # 5. Cleanup
    try:
        shutil.rmtree(temp_dir)
        print(f"[{project_id}] Cleaned up temp dir")
    except Exception as e:
        print(f"[{project_id}] Cleanup failed: {e}")
"""
}

for path, content in files.items():
    full_path = os.path.join(base_dir, path)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)


from fastapi import APIRouter, BackgroundTasks, HTTPException
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

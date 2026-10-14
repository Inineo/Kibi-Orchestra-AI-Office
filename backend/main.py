import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from config import OBSIDIAN_VAULT_PATH, NINEROUTER_URL
from services.obsidian import ObsidianService
from services.caveman import CavemanCompressor
from services.orchestrator import WorkflowOrchestrator

app = FastAPI(
    title="Kibi Orchestra AI Workforce - Python Backend",
    version="1.0.0",
    description="Backend Orchestrator with Obsidian Vault & Caveman Token Optimizer"
)

# Allow CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

obsidian_service = ObsidianService()
orchestrator = WorkflowOrchestrator()

# --- Request / Response Models ---
class DecomposeRequest(BaseModel):
    goal: str
    model: Optional[str] = None
    save_to_obsidian: bool = True

class SaveNoteRequest(BaseModel):
    filename: str
    content: str

class CreateProjectRequest(BaseModel):
    project_name: str
    description: Optional[str] = ""

# --- Endpoints ---
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "kibi-orchestra-python-backend",
        "obsidian_vault": str(OBSIDIAN_VAULT_PATH),
        "obsidian_exists": OBSIDIAN_VAULT_PATH.exists(),
        "ninerouter_url": NINEROUTER_URL
    }

@app.post("/api/projects/init")
def init_project_api(req: CreateProjectRequest):
    r"""
    Tugas Otomatis AI Intern:
    Membuat folder project baru di D:\Obsidian\Obsidian Memories\antigravity\<project_name>
    lengkap dengan subfolder plan, conversation, docs, dan file Index Hub.
    """
    if not req.project_name.strip():
        raise HTTPException(status_code=400, detail="Project name cannot be empty")
    
    res = obsidian_service.initialize_project(
        project_name=req.project_name.strip(),
        description=req.description or ""
    )
    return {
        "success": True,
        "data": res
    }

@app.post("/api/missions/decompose")
def decompose_mission_api(req: DecomposeRequest):
    """
    Decompose mission with PM, compress token context with Caveman,
    dan otomatis membuat file catatan Markdown di Obsidian Vault (antigravity).
    """
    if not req.goal.strip():
        raise HTTPException(status_code=400, detail="Goal cannot be empty")

    result = orchestrator.decompose_mission(req.goal, model=req.model)

    import uuid
    mission_id = str(uuid.uuid4())[:8]

    # 1. Simpan ke SQLite Database
    from services.database import Database
    Database.create_mission(
        mission_id=mission_id,
        title=f"Mission: {req.goal[:40]}...",
        goal=req.goal,
        requirements=[]
    )
    for idx, t in enumerate(result.get("tasks", [])):
        task_id = f"t-{mission_id}-{idx+1}"
        Database.create_task(
            task_id=task_id,
            mission_id=mission_id,
            title=t.get("title", ""),
            description=f"Estimated: {t.get('estimatedMinutes', 20)}m",
            assigned_to=f"agent-{t.get('assignedRole', 'backend')}",
            criteria=t.get("acceptanceCriteria", "")
        )

    # 2. Simpan ke Obsidian Vault
    saved_file = None
    if req.save_to_obsidian:
        saved_path = obsidian_service.save_mission_plan(
            mission_id=mission_id,
            goal=req.goal,
            pm_plan=result.get("plan", ""),
            tasks=result.get("tasks", [])
        )
        saved_file = str(saved_path)

    return {
        "success": True,
        "mission_id": mission_id,
        "plan": result.get("plan", ""),
        "tasks": result.get("tasks", []),
        "obsidian_file": saved_file
    }

class PMReviewRequest(BaseModel):
    goal: str
    plan_summary: str
    completed_tasks: List[Dict[str, Any]]
    mission_id: Optional[str] = None
    model: Optional[str] = None

@app.post("/api/missions/review")
def review_mission_api(req: PMReviewRequest):
    """
    PM Quality Audit Gate: Menilai hasil kerja tim (Backend, Frontend, QA, Intern).
    """
    review_result = orchestrator.review_mission_by_pm(
        mission_goal=req.goal,
        plan_summary=req.plan_summary,
        completed_tasks=req.completed_tasks,
        model=req.model
    )
    
    # Simpan review ke SQLite
    if req.mission_id:
        import uuid
        from services.database import Database
        Database.save_review(
            review_id=str(uuid.uuid4())[:8],
            mission_id=req.mission_id,
            reviewer_id="agent-pm",
            verdict=review_result.get("verdict", "APPROVED"),
            feedback=review_result.get("feedback", "")
        )
        # Update status mission jika lolos audit
        new_status = "completed" if review_result.get("verdict") == "APPROVED" else "needs_revision"
        Database.update_mission_status(req.mission_id, new_status)

        # 🧹 Hapus file plan markdown jika misi SUDAH APPROVED agar file tidak menumpuk di Obsidian
        if review_result.get("verdict") == "APPROVED":
            obsidian_service.delete_mission_plan(req.mission_id)

    return {
        "success": True,
        "review": review_result
    }

class CreateIssueRequest(BaseModel):
    title: str
    body: str
    role: Optional[str] = "task"
    task_id: Optional[str] = None

@app.post("/api/intern/github-issue")
def create_github_issue_api(req: CreateIssueRequest):
    """
    Tugas AI Intern: Membuat issue di GitHub saat ada task baru agar terlacak di repositori.
    """
    from services.intern_safety import InternGitSafetyService
    from pathlib import Path
    
    repo_root = Path(__file__).resolve().parent.parent
    intern_service = InternGitSafetyService(repo_root)
    
    res = intern_service.create_github_issue(
        title=req.title,
        body=req.body,
        labels=[req.role or "task", "ai-orchestra"]
    )
    return res

@app.get("/api/obsidian/notes")
def list_obsidian_notes():
    """Melihat semua file markdown di folder project saat ini (plan, conversation, docs)."""
    notes = obsidian_service.list_notes()
    return {
        "project_path": str(obsidian_service.project_path),
        "total": len(notes),
        "notes": notes
    }

@app.get("/api/obsidian/notes/{filename:path}")
def get_obsidian_note(filename: str):
    """Membaca isi file markdown catatan tertentu."""
    content = obsidian_service.read_note(filename)
    if content is None:
        raise HTTPException(status_code=404, detail="File not found")
    return {"filename": filename, "content": content}

@app.post("/api/obsidian/notes")
def create_or_update_note(req: SaveNoteRequest):
    """Simpan catatan Markdown kustom ke folder docs."""
    file_path = obsidian_service.docs_path / req.filename
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(req.content)
    return {"success": True, "saved_path": str(file_path)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

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
    title="TUYUL Orchestra — Task Unified Yield & Utility Layer",
    version="1.0.0",
    description="Autonomous Multi-Agent Orchestrator with SQLite, Obsidian Vault & Strix Security"
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

@app.on_event("startup")
def startup_db():
    """Pastikan tabel DB terbuat saat server start."""
    from services.database import Database
    Database.init_db()

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
    assignees: Optional[List[str]] = None
    milestone: Optional[str] = None
    project: Optional[str] = None

@app.post("/api/intern/github-issue")
def create_github_issue_api(req: CreateIssueRequest):
    """
    Tugas AI Intern: Membuat issue di GitHub dengan Security Gate dan Rich Metadata.
    """
    from services.intern_safety import InternGitSafetyService
    from pathlib import Path
    
    repo_root = Path(__file__).resolve().parent.parent
    intern_service = InternGitSafetyService(repo_root)
    
    res = intern_service.create_github_issue(
        title=req.title,
        body=req.body,
        labels=[req.role or "enhancement"],
        assignees=req.assignees,
        milestone=req.milestone,
        project=req.project
    )
    return res

class QAScanRequest(BaseModel):
    model: Optional[str] = None
    target_path: Optional[str] = None
    task_id: Optional[str] = None

@app.post("/api/qa/strix-scan")
def trigger_qa_strix_scan(req: QAScanRequest):
    """
    Tugas Agen QA (Maya Thorne): Menjalankan audit keamanan dan bug hunting
    menggunakan Strix Autonomous Security Agent dengan model yang aktif di 9Router.
    """
    from services.qa_strix import StrixQAService
    strix_service = StrixQAService()
    res = strix_service.run_security_scan(
        target_path=req.target_path,
        model=req.model
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

# ========== Phase 3: Memory & Context Persistence ==========

# --- Missions & Tasks Listing ---

@app.get("/api/missions")
def list_missions_api(status: Optional[str] = None, limit: int = 50):
    """Daftar semua misi, opsional filter by status."""
    from services.database import Database
    missions = Database.list_missions(status=status, limit=limit)
    return {"success": True, "total": len(missions), "missions": missions}

@app.get("/api/missions/{mission_id}")
def get_mission_api(mission_id: str):
    """Detail satu misi beserta subtasks-nya."""
    from services.database import Database
    mission = Database.get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    return {"success": True, "mission": mission}

@app.get("/api/tasks")
def list_tasks_api(mission_id: Optional[str] = None, status: Optional[str] = None, limit: int = 100):
    """Daftar tasks, opsional filter by mission_id dan/atau status."""
    from services.database import Database
    tasks = Database.list_tasks(mission_id=mission_id, status=status, limit=limit)
    return {"success": True, "total": len(tasks), "tasks": tasks}

# --- Agents Registry ---

class UpsertAgentRequest(BaseModel):
    id: str
    name: str
    role: str
    title: Optional[str] = ""
    department: Optional[str] = "orchestra"

@app.post("/api/agents")
def upsert_agent_api(req: UpsertAgentRequest):
    """Register atau update agent ke database."""
    from services.database import Database
    agent = Database.upsert_agent(req.id, req.name, req.role, req.title or "", req.department or "orchestra")
    return {"success": True, "agent": agent}

@app.get("/api/agents")
def list_agents_api():
    """Daftar semua agent yang terdaftar."""
    from services.database import Database
    agents = Database.list_agents()
    return {"success": True, "total": len(agents), "agents": agents}

# --- Task Artifacts & Agent Memory Retrieval ---

class SaveArtifactRequest(BaseModel):
    task_id: str
    type: Optional[str] = "markdown"
    url: Optional[str] = ""
    summary: str
    description: Optional[str] = ""

@app.post("/api/artifacts")
def save_artifact_api(req: SaveArtifactRequest):
    """Simpan ringkasan artefak task ke database untuk memory retrieval."""
    import uuid
    from services.database import Database
    artifact_id = str(uuid.uuid4())[:8]
    artifact = Database.save_artifact(
        artifact_id=artifact_id,
        task_id=req.task_id,
        artifact_type=req.type or "markdown",
        url=req.url or "",
        summary=req.summary,
        description=req.description or ""
    )
    return {"success": True, "artifact": artifact}

@app.get("/api/artifacts/task/{task_id}")
def get_task_artifacts_api(task_id: str):
    """Artefak dari satu task."""
    from services.database import Database
    artifacts = Database.get_artifacts_by_task(task_id)
    return {"success": True, "total": len(artifacts), "artifacts": artifacts}

@app.get("/api/artifacts/mission/{mission_id}")
def get_mission_artifacts_api(mission_id: str):
    """Semua artefak dari semua task dalam satu misi."""
    from services.database import Database
    artifacts = Database.get_artifacts_by_mission(mission_id)
    return {"success": True, "total": len(artifacts), "artifacts": artifacts}

@app.get("/api/agents/{agent_id}/memory")
def get_agent_memory_api(agent_id: str, limit: int = 20):
    """
    Agent Memory Retrieval: Riwayat task + artefak yang pernah dikerjakan agent.
    Digunakan agar agent mengingat pengerjaan sebelumnya tanpa re-indexing penuh.
    """
    from services.database import Database
    history = Database.get_agent_history(agent_id, limit=limit)
    return {"success": True, "agent_id": agent_id, "total": len(history), "history": history}

class CompleteTaskRequest(BaseModel):
    task_id: str
    result_summary: str
    artifact_type: Optional[str] = "markdown"
    artifact_url: Optional[str] = ""

@app.post("/api/tasks/{task_id}/complete")
def complete_task_api(task_id: str, req: CompleteTaskRequest):
    """
    Tandai task selesai dan otomatis simpan artefak ringkasan ke DB.
    Agent tidak perlu call 2 endpoint terpisah.
    """
    import uuid
    from services.database import Database
    Database.update_task_status(task_id, "completed")
    artifact = Database.save_artifact(
        artifact_id=str(uuid.uuid4())[:8],
        task_id=task_id,
        artifact_type=req.artifact_type or "markdown",
        url=req.artifact_url or "",
        summary=req.result_summary,
        description=""
    )
    return {"success": True, "task_id": task_id, "status": "completed", "artifact": artifact}

@app.patch("/api/tasks/{task_id}/status")
def update_task_status_api(task_id: str, status: str = "in_progress"):
    """Update status task (pending, assigned, in_progress, completed, blocked)."""
    from services.database import Database
    Database.update_task_status(task_id, status)
    return {"success": True, "task_id": task_id, "status": status}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

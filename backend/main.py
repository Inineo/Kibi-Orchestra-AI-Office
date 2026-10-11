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

@app.post("/api/missions/decompose")
def decompose_mission_api(req: DecomposeRequest):
    """
    Decompose mission with PM, compress token context with Caveman,
    dan otomatis membuat file catatan Markdown di Obsidian Vault (antigravity).
    """
    if not req.goal.strip():
        raise HTTPException(status_code=400, detail="Goal cannot be empty")

    result = orchestrator.decompose_mission(req.goal, model=req.model)

    saved_file = None
    if req.save_to_obsidian:
        import uuid
        mission_id = str(uuid.uuid4())[:8]
        saved_path = obsidian_service.save_mission_plan(
            mission_id=mission_id,
            goal=req.goal,
            pm_plan=result.get("plan", ""),
            tasks=result.get("tasks", [])
        )
        saved_file = str(saved_path)

    return {
        "success": True,
        "plan": result.get("plan", ""),
        "tasks": result.get("tasks", []),
        "obsidian_file": saved_file
    }

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

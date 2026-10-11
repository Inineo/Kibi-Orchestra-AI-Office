import os
import re
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from config import OBSIDIAN_VAULT_PATH, PROJECT_VAULT_PATH, CURRENT_PROJECT_NAME

class ObsidianService:
    r"""
    Obsidian Vault Service
    Menyimpan catatan hasil kerja agen langsung ke folder:
    D:\Obsidian\Obsidian Memories\antigravity\<CURRENT_PROJECT_NAME>\
        ├── plan\
        ├── conversation\
        └── docs\
    """

    def __init__(self, project_path: Optional[Path] = None):
        self.project_path = project_path or PROJECT_VAULT_PATH
        self.plan_path = self.project_path / "plan"
        self.conversation_path = self.project_path / "conversation"
        self.docs_path = self.project_path / "docs"

        self.project_path.mkdir(parents=True, exist_ok=True)
        self.plan_path.mkdir(parents=True, exist_ok=True)
        self.conversation_path.mkdir(parents=True, exist_ok=True)
        self.docs_path.mkdir(parents=True, exist_ok=True)

    def _sanitize_filename(self, title: str) -> str:
        """Membersihkan karakter ilegal untuk nama file Windows."""
        clean = re.sub(r'[\\/*?:"<>|]', "", title)
        clean = clean.replace(" ", "-").strip("-")
        return clean[:60] if clean else "note"

    def save_mission_plan(
        self,
        mission_id: str,
        goal: str,
        pm_plan: str,
        tasks: List[Dict[str, Any]],
        tags: Optional[List[str]] = None
    ) -> Path:
        """
        Menyimpan dokumen Misi ke subfolder 'plan' lengkap dengan Obsidian Wikilinks [[...]]
        """
        now = datetime.now()
        timestamp_str = now.strftime("%Y-%m-%d %H:%M:%S")
        date_prefix = now.strftime("%Y%m%d_%H%M")
        
        safe_title = self._sanitize_filename(goal)
        file_name = f"{date_prefix}_{safe_title}.md"
        file_path = self.plan_path / file_name

        tag_list = tags or ["antigravity", CURRENT_PROJECT_NAME.lower(), "plan", "mission"]
        tag_str = " ".join([f"#{t}" for t in tag_list])

        task_lines = []
        for idx, t in enumerate(tasks, 1):
            status_box = "[x]" if t.get("status") == "completed" else "[ ]"
            role = t.get("assignedRole", "unassigned")
            title = t.get("title", "")
            task_lines.append(f"- {status_box} **{role.upper()}**: {title}")

        tasks_md = "\n".join(task_lines) if task_lines else "- (Belum ada subtask)"

        content = f"""---
id: {mission_id}
date: {timestamp_str}
project: {CURRENT_PROJECT_NAME}
type: project-plan
tags: {tag_str}
---

# 🚀 Plan Misi: {goal}

> **Project**: [[{CURRENT_PROJECT_NAME}-Index]]  
> **Tanggal dibuat**: {timestamp_str}  
> **Status**: In Progress  
> **Tags**: {tag_str}  
> **Master Roadmap**: [[13-IMPLEMENTATION-PLAN]]  

---

## 📋 Hasil Dekomposisi Product Manager
{pm_plan}

---

## 🎯 Task Breakdown (Dikelola oleh Intern & Squad)
{tasks_md}

---

## 🔗 Referensi & Hubungan Dokumen (Wikilinks)
- Master Plan: [[13-IMPLEMENTATION-PLAN]]
- Log Percakapan: [[20261011_Dokumentasi-Percakapan-Kibi-Orchestra]]
- Prosedur Git Intern: [[Git-Intern-Safety-Procedure]]

---

## 📝 Catatan Tambahan (Manual / ChatGPT Browser)
<!-- Tambahkan catatan atau hasil ekspor ChatGPT di sini -->

"""
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

        return file_path

    def save_conversation_note(
        self,
        title: str,
        content: str,
        tags: Optional[List[str]] = None
    ) -> Path:
        """Menyimpan log percakapan / ekspor ChatGPT ke subfolder conversation/"""
        safe_title = self._sanitize_filename(title)
        file_path = self.conversation_path / f"{safe_title}.md"
        
        header = f"""---
project: {CURRENT_PROJECT_NAME}
type: conversation-log
date: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
tags: {" ".join([f"#{t}" for t in (tags or ["antigravity", "conversation"])])}
---

# 💬 {title}

> **Project Hub**: [[{CURRENT_PROJECT_NAME}-Index]]  
> **Master Plan**: [[13-IMPLEMENTATION-PLAN]]  

---

"""
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(header + content.strip() + "\n")
        return file_path

    def list_notes(self) -> List[Dict[str, Any]]:
        """Membaca daftar file markdown di seluruh subfolder project saat ini."""
        notes = []
        for file in self.project_path.rglob("*.md"):
            try:
                stat = file.stat()
                rel_path = file.relative_to(self.project_path)
                notes.append({
                    "filename": file.name,
                    "relative_path": str(rel_path),
                    "subfolder": rel_path.parent.name if rel_path.parent.name else "root",
                    "path": str(file),
                    "size_bytes": stat.st_size,
                    "updated_at": datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
            except Exception:
                continue
        return sorted(notes, key=lambda x: x["updated_at"], reverse=True)

    def read_note(self, relative_path: str) -> Optional[str]:
        """Membaca isi file markdown di dalam folder project."""
        file_path = self.project_path / relative_path
        if not file_path.exists():
            matches = list(self.project_path.rglob(relative_path))
            if matches:
                file_path = matches[0]

        if file_path.exists() and file_path.is_file():
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        return None

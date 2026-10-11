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

    def __init__(self, project_path: Optional[Path] = None, project_name: Optional[str] = None):
        self.project_name = project_name or CURRENT_PROJECT_NAME
        self.project_path = project_path or (OBSIDIAN_VAULT_PATH / self.project_name)
        self.plan_path = self.project_path / "plan"
        self.conversation_path = self.project_path / "conversation"
        self.docs_path = self.project_path / "docs"

        self.project_path.mkdir(parents=True, exist_ok=True)
        self.plan_path.mkdir(parents=True, exist_ok=True)
        self.conversation_path.mkdir(parents=True, exist_ok=True)
        self.docs_path.mkdir(parents=True, exist_ok=True)

    def initialize_project(self, project_name: str, description: str = "") -> Dict[str, Any]:
        """
        Tugas Otomatis AI Intern:
        Membuat struktur folder proyek baru dan file-file starter Markdown standar di Obsidian:
        antigravity/<project_name>/
            ├── <project_name>-Index.md   (Pusat navigasi)
            ├── plan/                     (Folder rencana)
            ├── conversation/             (Folder chat & ekspor ChatGPT)
            └── docs/                     (Folder SOP & dokumentasi teknis)
        """
        clean_name = self._sanitize_filename(project_name)
        proj_dir = OBSIDIAN_VAULT_PATH / clean_name
        plan_dir = proj_dir / "plan"
        conv_dir = proj_dir / "conversation"
        docs_dir = proj_dir / "docs"

        proj_dir.mkdir(parents=True, exist_ok=True)
        plan_dir.mkdir(parents=True, exist_ok=True)
        conv_dir.mkdir(parents=True, exist_ok=True)
        docs_dir.mkdir(parents=True, exist_ok=True)

        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 1. Buat Index Hub Proyek
        index_file = proj_dir / f"{clean_name}-Index.md"
        if not index_file.exists():
            index_content = f"""---
id: {clean_name.lower()}-index
title: {clean_name} Project & Knowledge Hub
project: {clean_name}
date: {now_str}
tags:
  - antigravity
  - {clean_name.lower()}
  - index
---

# 🌐 {clean_name} Knowledge Hub

Selamat datang di ruang kerja proyek **{clean_name}**.

> **Deskripsi**: {description or 'Proyek baru yang diinisialisasi oleh AI Intern.'}  
> **Tanggal Inisialisasi**: {now_str}  
> **Dikelola Oleh**: AI Intern (Alex Novak) & Kibi Orchestra Squad  

---

## 📂 Struktur Direktori Proyek

```
D:\\Obsidian\\Obsidian Memories\\antigravity\\{clean_name}\\
│
├── plan/             --> Menyimpan dokumen rencana misi & sprint teknis
├── conversation/     --> Menyimpan log obrolan & ekspor chat ChatGPT browser
└── docs/             --> Menyimpan pedoman SOP tim & dokumentasi referensi penting
```

---

## 📌 Dokumen Inti Penting
- 🗺️ Rencana Implementasi: `plan/13-IMPLEMENTATION-PLAN.md`
- 🛡️ SOP Peran AI: `docs/Role-Standard-Operating-Procedures.md`
- 🔒 SOP Keamanan Git: `docs/Git-Intern-Safety-Procedure.md`
"""
            with open(index_file, "w", encoding="utf-8") as f:
                f.write(index_content.strip() + "\n")

        # 2. Generate SOP Standar khusus project baru (terisolasi 100%, link ke index project ini)
        sop_target = docs_dir / "Role-Standard-Operating-Procedures.md"
        if not sop_target.exists():
            sop_content = f"""---
id: {clean_name.lower()}-role-sops
title: SOP Peran AI Workforce ({clean_name})
project: {clean_name}
location: {clean_name}/docs/Role-Standard-Operating-Procedures.md
date: {now_str}
tags:
  - antigravity
  - {clean_name.lower()}
  - sops
---

# 📜 Standar Operasional Prosedur (SOP) Role AI Workforce - {clean_name}

> **Folder Path**: `antigravity/{clean_name}/docs/`  
> **Index Utama**: [[{clean_name}-Index]]  

---

## 🧭 1. Product Manager (PM)
- Mengurai Mission Goal project {clean_name}.
- PM Review Gate: Verifikasi akhir kelulusan misi.

## ⚙️ 2. Back End Engineer
- API contract & business logic untuk {clean_name}.

## 🎨 3. Front End Engineer
- Antarmuka visual UI/UX untuk {clean_name}.

## 🧪 4. QA Automation Engineer
- Pengujian otomatis, edge-case, dan regresi {clean_name}.

## 🛡️ 5. Software Engineer Intern
- Git Safety audit & pengelolaan dokumentasi {clean_name}.
"""
            with open(sop_target, "w", encoding="utf-8") as f:
                f.write(sop_content.strip() + "\n")

        git_target = docs_dir / "Git-Intern-Safety-Procedure.md"
        if not git_target.exists():
            git_content = f"""---
id: {clean_name.lower()}-git-safety
title: SOP Git Safety ({clean_name})
project: {clean_name}
location: {clean_name}/docs/Git-Intern-Safety-Procedure.md
date: {now_str}
tags:
  - antigravity
  - {clean_name.lower()}
  - git-safety
---

# 🛡️ SOP Git Safety untuk Role Intern - {clean_name}

> **Folder Path**: `antigravity/{clean_name}/docs/`  
> **Index Utama**: [[{clean_name}-Index]]  

---

## 🛑 Aturan Ketat Git Safety:
1. PULL: Dilarang pull jika ada uncommitted changes di repo.
2. PUSH: Pastikan hanya push branch kerja {clean_name} yang sudah terverifikasi.
3. DOCS: Semua file baru disimpan di folder `plan/`, `conversation/`, atau `docs/` di dalam project {clean_name}.
"""
            with open(git_target, "w", encoding="utf-8") as f:
                f.write(git_content.strip() + "\n")

        return {
            "project_name": clean_name,
            "project_path": str(proj_dir),
            "created_folders": ["plan", "conversation", "docs"],
            "index_file": str(index_file),
            "message": f"AI Intern berhasil membuat ruang kerja Obsidian untuk project '{clean_name}' (terisolasi mandiri)."
        }

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

        proj_slug = self.project_name.lower()
        tag_list = tags or [f"{proj_slug}/plan", f"{proj_slug}/mission"]
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
project: {self.project_name}
type: project-plan
tags: {tag_str}
location: {self.project_name}/plan/{file_name}
---

# 🚀 Plan Misi: {goal}

> **Project Hub**: [[{self.project_name}-Index]]  
> **Folder Path**: `antigravity/{self.project_name}/plan/`  
> **Status**: In Progress  
> **Tags**: {tag_str}  

---

## 📋 Hasil Dekomposisi Product Manager
{pm_plan}

---

## 🎯 Task Breakdown
{tasks_md}

---

## 📝 Catatan Tambahan (Manual / ChatGPT Browser)
<!-- Tambahkan catatan atau hasil ekspor ChatGPT di sini -->
"""
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content.strip() + "\n")

        return file_path

    def save_conversation_note(
        self,
        title: str,
        content: str,
        tags: Optional[List[str]] = None
    ) -> Path:
        """Menyimpan log percakapan / ekspor ChatGPT ke subfolder conversation/ dengan nested tag."""
        safe_title = self._sanitize_filename(title)
        file_name = f"{safe_title}.md"
        file_path = self.conversation_path / file_name
        
        proj_slug = self.project_name.lower()
        tag_list = tags or [f"{proj_slug}/conversation"]
        header = f"""---
project: {self.project_name}
type: conversation-log
date: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
tags: {" ".join([f"#{t}" for t in tag_list])}
location: {self.project_name}/conversation/{file_name}
---

# 💬 {title}

> **Project Hub**: [[{self.project_name}-Index]]  
> **Folder Path**: `antigravity/{self.project_name}/conversation/`  

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

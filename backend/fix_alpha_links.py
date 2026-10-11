from pathlib import Path

alpha_dir = Path(r"D:\Obsidian\Obsidian Memories\antigravity\Project-Alpha")

sop_content = """---
id: project-alpha-role-sops
title: SOP Peran AI Workforce (Project-Alpha)
project: Project-Alpha
location: Project-Alpha/docs/Role-Standard-Operating-Procedures.md
date: 2026-10-11 16:42:00
tags:
  - antigravity
  - project-alpha
  - sops
---

# 📜 Standar Operasional Prosedur (SOP) Role AI Workforce - Project-Alpha

> **Folder Path**: `antigravity/Project-Alpha/docs/`  
> **Index Utama**: [[Project-Alpha-Index]]  

---

## 🧭 1. Product Manager (PM)
- Mengurai Mission Goal khusus Project-Alpha.
- PM Review Gate: Verifikasi akhir kelulusan misi Project-Alpha.

## ⚙️ 2. Back End Engineer
- API contract & business logic untuk Project-Alpha.

## 🎨 3. Front End Engineer
- Antarmuka visual UI/UX untuk Project-Alpha.

## 🧪 4. QA Automation Engineer
- Pengujian otomatis, edge-case, dan regresi Project-Alpha.

## 🛡️ 5. Software Engineer Intern
- Git Safety audit & pengelolaan dokumentasi Project-Alpha.
"""

git_content = """---
id: project-alpha-git-safety
title: SOP Git Safety (Project-Alpha)
project: Project-Alpha
location: Project-Alpha/docs/Git-Intern-Safety-Procedure.md
date: 2026-10-11 16:42:00
tags:
  - antigravity
  - project-alpha
  - git-safety
---

# 🛡️ SOP Git Safety untuk Role Intern - Project-Alpha

> **Folder Path**: `antigravity/Project-Alpha/docs/`  
> **Index Utama**: [[Project-Alpha-Index]]  

---

## 🛑 Aturan Ketat Git Safety:
1. PULL: Dilarang pull jika ada uncommitted changes di repositori.
2. PUSH: Pastikan hanya push branch kerja Project-Alpha yang sudah terverifikasi.
3. DOCS: Semua file baru disimpan di folder `plan/`, `conversation/`, atau `docs/` di dalam Project-Alpha.
"""

with open(alpha_dir / "docs" / "Role-Standard-Operating-Procedures.md", "w", encoding="utf-8") as f:
    f.write(sop_content.strip() + "\n")

with open(alpha_dir / "docs" / "Git-Intern-Safety-Procedure.md", "w", encoding="utf-8") as f:
    f.write(git_content.strip() + "\n")

print("Fixed Project-Alpha files! All cross-links to Kibi-Orchestra removed.")

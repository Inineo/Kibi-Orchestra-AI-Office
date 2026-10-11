from pathlib import Path

content = """---
id: kibi-orchestra-role-sops
title: Standar Operasional Prosedur (SOP) Peran AI Workforce
project: Kibi-Orchestra
location: Kibi-Orchestra/docs/Role-Standard-Operating-Procedures.md
date: 2026-10-11 16:34:00
tags:
  - antigravity
  - sops
  - roles
---

# 📜 Standar Operasional Prosedur (SOP) Role AI Workforce

> **Folder Path**: `antigravity/Kibi-Orchestra/docs/`  
> **Index Utama**: [[Kibi-Orchestra-Index]]  

---

## 🧭 1. Product Manager (PM) — Lead Orchestrator & Quality Gatekeeper
- **Tanggung Jawab**:
  1. Menganalisis kebutuhan User / Mission Goal.
  2. Memecah misi menjadi sub-task terukur untuk `Backend`, `Frontend`, `QA`, dan `Intern`.
  3. **PM Review Gate (Verifikasi Akhir)**: Mengaudit semua hasil pekerjaan sebelum misi dinyatakan `COMPLETED`. Jika ada kekurangan, PM berhak memberikan verdict `NEEDS_REVISION`.
- **Batasan**:
  - ❌ Dilarang menulis implementasi kode langsung.
  - ❌ Wajib menggunakan Caveman Prompt Compression untuk menghemat token.

---

## ⚙️ 2. Back End Engineer — Data & Logic Specialist
- **Tanggung Jawab**:
  1. Merancang arsitektur API endpoints, skema database, autentikasi, dan reverse proxy.
  2. Menyediakan API Contract yang jelas agar bisa dikonsumsi oleh Frontend.
- **Batasan**:
  - ❌ Dilarang menyentuh styling UI / komponen CSS.
  - ❌ Wajib memvalidasi payload input (Zod/Pydantic) sebelum data diproses.

---

## 🎨 3. Front End Engineer — UI/UX & Interaction Specialist
- **Tanggung Jawab**:
  1. Membangun antarmuka visual yang responsif, modern, dan berestetika tinggi (60 FPS).
  2. Mengonsumsi API endpoint yang telah disediakan oleh Backend.
- **Batasan**:
  - ❌ Dilarang mengubah skema API Backend secara sepihak.

---

## 🧪 4. QA Automation Engineer — Testing & Verification Specialist
- **Tanggung Jawab (Terpisah Khusus dari Intern)**:
  1. Menulis automated test suite (Unit testing & Integration tests).
  2. Menguji boundary inputs, edge cases, error boundary, dan potensi regresi.
  3. Melaporkan validation report kepada Product Manager untuk audit kelulusan.
- **Batasan**:
  - ❌ Dilarang melakukan Git push/pull langsung ke repositori produksi (tugas ini dipegang oleh Intern).

---

## 🛡️ 5. Software Engineer Intern — Git Safety & Obsidian Documentation
- **Tanggung Jawab**:
  1. Menjalankan verifikasi keamanan Git (cek uncommitted changes sebelum pull, cek commit lokal sebelum push).
  2. Menyimpan dan mengelola catatan Markdown di subfolder yang tepat (`plan/`, `conversation/`, atau `docs/`).
- **Batasan**:
  - ❌ Dilarang menjalankan `git pull` jika status working tree tidak bersih.
  - ❌ Dilarang melakukan testing arsitektur berat (dialihkan ke QA).
"""

target = Path(r"D:\Obsidian\Obsidian Memories\antigravity\Kibi-Orchestra\docs\Role-Standard-Operating-Procedures.md")
with open(target, "w", encoding="utf-8") as f:
    f.write(content.strip())
print("Updated Role-Standard-Operating-Procedures.md with clean folder path!")

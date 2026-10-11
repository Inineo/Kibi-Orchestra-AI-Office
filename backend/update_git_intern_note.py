from pathlib import Path

content = """---
id: git-intern-safety-procedure
title: Prosedur Operasi Standar (SOP) Git & Markdown untuk Role Intern
project: Kibi-Orchestra
location: Kibi-Orchestra/docs/Git-Intern-Safety-Procedure.md
date: 2026-10-11 16:34:00
tags:
  - antigravity
  - intern
  - sop
  - git-safety
---

# 🛡️ SOP Git Safety & Markdown untuk Role Intern

> **Folder Path**: `antigravity/Kibi-Orchestra/docs/`  
> **Index Utama**: [[Kibi-Orchestra-Index]]  

---

## 🎯 1. Tanggung Jawab Utama Role Intern
1. **Verifikasi & Eksekusi Git (Pull & Push)** secara aman dan terkontrol.
2. **Dokumentasi & Pengelolaan Folder Markdown**: Menyimpan file `.md` ke subfolder yang sesuai (`plan/`, `conversation/`, atau `docs/`).
3. **Mencegah Kerusakan Repositori**: Tidak melakukan push/pull sembarangan tanpa pemeriksaan status terlebih dahulu.

---

## 🛑 2. Aturan Ketat Git Safety (Anti-Konflik)

### A. Prosedur PULL Aman:
1. **Langkah 1**: Jalankan pemeriksaan status lokal:
   ```bash
   git status --porcelain
   ```
2. **Kondisi Larangan**: 
   - ⚠️ **JIKA ADA UNCOMMITTED CHANGES**, proses `git pull` **DILARANG KERAS** dilanjutkan! 
   - Tindakan: Perubahan harus di-commit terlebih dahulu atau di-stash.
3. **Langkah 2**: Periksa perubahan remote dengan dry-run:
   ```bash
   git fetch --dry-run
   ```
4. **Langkah 3**: Hanya lakukan `git pull` jika status lokal benar-benar bersih (*clean working tree*).

---

### B. Prosedur PUSH Aman:
1. **Langkah 1**: Periksa apakah ada commit lokal yang siap dikirim:
   ```bash
   git log @{u}..HEAD --oneline
   ```
   - Jika tidak ada commit baru, **TIDAK PERLU push**.
2. **Langkah 2**: Pastikan tidak ada file sensitif (`.env`, private keys) yang masuk ke stage (`git status`).
3. **Langkah 3**: Lakukan push hanya ke branch aktif yang ditugaskan.

---

## 📂 3. Standar Penempatan Path Folder (Tanpa Link Liar)

Setiap kali Role Intern membuat file dokumentasi:
1. File **WAJIB** disimpan ke subfolder path yang benar:
   - `antigravity/Kibi-Orchestra/plan/` -> untuk rencana misi / subtasks.
   - `antigravity/Kibi-Orchestra/conversation/` -> untuk log obrolan & ekspor chat ChatGPT.
   - `antigravity/Kibi-Orchestra/docs/` -> untuk SOP, panduan teknis, dan catatan umum.
2. Cantumkan metadata `location` di header:
   ```yaml
   location: Kibi-Orchestra/docs/nama_file.md
   ```
3. **Jangan membuat tautan silang acak** antar-file biasa agar Graph View tidak berantakan. Cukup hubungkan ke `[[Kibi-Orchestra-Index]]` jika file tersebut adalah dokumen inti.
"""

target = Path(r"D:\Obsidian\Obsidian Memories\antigravity\Kibi-Orchestra\docs\Git-Intern-Safety-Procedure.md")
with open(target, "w", encoding="utf-8") as f:
    f.write(content.strip())
print("Updated Git-Intern-Safety-Procedure.md with clean folder path!")

from pathlib import Path

content = """---
id: git-intern-safety-procedure
title: Prosedur Operasi Standar (SOP) Git & Markdown untuk Role Intern
project: Kibi-Orchestra
date: 2026-10-11 16:06:00
tags:
  - antigravity
  - intern
  - sop
  - git-safety
  - documentation
---

# 🛡️ SOP Git Safety & Markdown Linking untuk Role Intern

Dokumen ini adalah pedoman kerja resmi untuk agen dengan peran **Intern** di proyek **Kibi-Orchestra**.

---

## 🎯 1. Tanggung Jawab Utama Role Intern
1. **Verifikasi & Eksekusi Git (Pull & Push)** secara aman dan terkontrol.
2. **Dokumentasi & Hubungan Markdown**: Membuat dan menautkan file `.md` menggunakan Obsidian Wikilinks `[[...]]`.
3. **Mencegah Kerusakan Repositori**: Tidak melakukan push/pull sembarangan atau otomatis tanpa pemeriksaan diff.

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

## 📝 3. Standar Pembuatan & Linking Markdown (Obsidian)

Setiap kali Role Intern membuat file dokumentasi atau mencatat ringkasan tugas:
1. File **WAJIB** disimpan ke subfolder yang sesuai:
   - `antigravity/Kibi-Orchestra/plan/` untuk rencana misi / subtasks.
   - `antigravity/Kibi-Orchestra/conversation/` untuk log obrolan & ChatGPT.
   - `antigravity/Kibi-Orchestra/docs/` untuk SOP, panduan teknis, dan catatan umum.
2. Setiap file **WAJIB** memiliki tautan balik (Backlink) ke:
   - `[[Kibi-Orchestra-Index]]`
   - Dokumen terkait lainnya, misal: `[[13-IMPLEMENTATION-PLAN]]` atau `[[20261011_Dokumentasi-Percakapan-Kibi-Orchestra]]`.

---

## 🔗 Referensi Dokumen
- Index Utama: [[Kibi-Orchestra-Index]]
- Master Plan: [[13-IMPLEMENTATION-PLAN]]
- Log Percakapan: [[20261011_Dokumentasi-Percakapan-Kibi-Orchestra]]
"""

target = Path(r"D:\Obsidian\Obsidian Memories\antigravity\Kibi-Orchestra\docs\Git-Intern-Safety-Procedure.md")
with open(target, "w", encoding="utf-8") as f:
    f.write(content.strip())
print("Created Git-Intern-Safety-Procedure.md successfully!")

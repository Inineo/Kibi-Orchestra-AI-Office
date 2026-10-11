from pathlib import Path

content = """---
id: test-mission-01
title: Contoh Dekomposisi Misi Pertama
project: Kibi-Orchestra
location: Kibi-Orchestra/docs/20261011_1551_Contoh-Misi-Pertama.md
date: 2026-10-11 15:51:00
tags:
  - antigravity
  - mission-example
---

# 🚀 Contoh Dekomposisi Misi Pertama

> **Folder Path**: `antigravity/Kibi-Orchestra/docs/`  
> **Status**: Archived Example  

---

## 📋 Hasil Dekomposisi Product Manager
Rencana integrasi Obsidian & Kibi Orchestra.

---

## 🎯 Task Breakdown
- [x] **BACKEND**: Setup DB & Gateway Connector
- [ ] **FRONTEND**: Integrasi status agen ke dashboard
- [ ] **QA**: Test endpoints & verifikasi payload
- [ ] **INTERN**: Audit git status & dokumentasi Markdown
"""

target = Path(r"D:\Obsidian\Obsidian Memories\antigravity\Kibi-Orchestra\docs\20261011_1551_Contoh-Misi-Pertama.md")
with open(target, "w", encoding="utf-8") as f:
    f.write(content.strip())
print("Updated 20261011_1551_Contoh-Misi-Pertama.md with clean folder path!")

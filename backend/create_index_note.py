from pathlib import Path

content = """---
id: antigravity-index-hub
title: Index & Peta Navigasi Antigravity
date: 2026-10-11 15:58:00
tags:
  - antigravity
  - moc
  - index
  - kibi-orchestra
---

# Peta Navigasi & Index Vault Antigravity

Selamat datang di folder kerja utama Antigravity untuk proyek Kibi Orchestra V3.

Halaman ini berfungsi sebagai Map of Content (MOC) di Obsidian, menghubungkan semua percakapan AI, rencana aksi, dan detail implementasi secara otomatis menggunakan Obsidian Wikilinks [[...]] sehingga graf pengetahuan saling terhubung (Graph View).

---

## 1. Direktori Percakapan & Log Chat (/conversations)
Tempat menyimpan log sesi chat dan ekspor percakapan dari ChatGPT browser:
- [[20261011_Dokumentasi-Percakapan-Kibi-Orchestra]]: Rekapitulasi lengkap sesi percakapan, role agen, optimasi 60 FPS 3D, unlock kamera, dan keputusan backend Python.

---

## 2. Direktori Proyek & Misi (/projects)
Tempat menyimpan rencana arsitektur dan hasil dekomposisi misi aktif:
- [[13-IMPLEMENTATION-PLAN]]: Dokumen rencana implementasi resmi Kibi Orchestra V3.
- [[20261011_1551_Contoh-Misi-Pertama]]: Contoh misi breakdown awal oleh Product Manager.

---

## Panduan Menautkan Catatan Baru (Graph View)
Setiap kali Anda menambahkan file .md baru (misalnya ekspor dari ChatGPT):
1. Simpan di folder conversations/ atau projects/.
2. Tambahkan tautan dua arah dengan format:
   Terkait dengan: [[Index-Antigravity]] dan [[20261011_Dokumentasi-Percakapan-Kibi-Orchestra]]
3. Buka Graph View di Obsidian (Ctrl + G), dan Anda akan melihat node-node catatan Anda terhubung dengan garis rapi!
"""

target = Path(r"D:\Obsidian\Obsidian Memories\antigravity\Index-Antigravity.md")
with open(target, "w", encoding="utf-8") as f:
    f.write(content.strip())
print("Created Index-Antigravity.md successfully!")

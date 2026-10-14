"""
Sinkronisasi & Standarisasi Catatan Proyek Obsidian
Mengatur Index Hub, standardisasi nested tags per proyek, dan pembaruan SOP.
"""
import sys
from pathlib import Path

# Tambahkan backend root ke sys.path agar import config & services berjalan mulus
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from config import OBSIDIAN_VAULT_PATH, CURRENT_PROJECT_NAME
from services.obsidian import ObsidianService

def standardize_project_tags(project_name: str = CURRENT_PROJECT_NAME):
    """
    Menstandarkan semua tag pada file catatan agar terspesifikasi ke proyek
    (Contoh: #kibi-orchestra/plan bukan #plan global) agar Graph View tidak bercampur.
    """
    proj_dir = OBSIDIAN_VAULT_PATH / project_name
    if not proj_dir.exists():
        print(f"[WARN] Folder proyek {proj_dir} tidak ditemukan.")
        return

    proj_tag = project_name.lower()
    updated = 0

    for md_file in proj_dir.rglob("*.md"):
        try:
            content = md_file.read_text(encoding="utf-8")
            # Ganti tag generic #plan, #conversation, #docs menjadi nested tag per proyek
            new_content = content.replace("#plan", f"#{proj_tag}/plan")
            new_content = new_content.replace("#conversation", f"#{proj_tag}/conversation")
            new_content = new_content.replace("#docs", f"#{proj_tag}/docs")

            if new_content != content:
                md_file.write_text(new_content, encoding="utf-8")
                updated += 1
        except Exception as e:
            print(f"[ERR] Gagal memproses {md_file.name}: {e}")

    print(f"[OK] Standardisasi tag selesai ({updated} file diperbarui untuk {project_name}).")

def sync_project_hub(project_name: str = CURRENT_PROJECT_NAME):
    """
    Membuat atau menyinkronkan Index Hub dan starter docs proyek via ObsidianService.
    """
    service = ObsidianService(project_name=project_name)
    res = service.initialize_project(
        project_name=project_name,
        description=f"Workspace & Multi-Agent Collaboration Hub for {project_name}"
    )
    print(f"[OK] Project Hub terverifikasi: {res.get('project_hub')}")

if __name__ == "__main__":
    print(f"[*] Memulai sinkronisasi catatan Obsidian untuk {CURRENT_PROJECT_NAME}...")
    sync_project_hub(CURRENT_PROJECT_NAME)
    standardize_project_tags(CURRENT_PROJECT_NAME)
    print("[SUCCESS] Sinkronisasi catatan selesai!")

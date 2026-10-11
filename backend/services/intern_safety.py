import subprocess
from pathlib import Path
from typing import Dict, Any, List

class InternGitSafetyService:
    r"""
    Layanan Prosedur Keamanan Git & Pengelola Dokumentasi Markdown untuk Role Intern.
    
    Aturan Ketat (Safety Rules):
    1. TIDAK BOLEH melakukan push / pull otomatis tanpa pengecekan status (dry-run & diff).
    2. Wajib mengecek status repositori (git status, git diff) terlebih dahulu.
    3. Jika working tree kotor (ada uncommitted changes), PULL dilarang demi menghindari merge conflict tak terduga.
    4. Selalu membuat link Obsidian Wikilinks [[...]] setiap kali membuat atau memodifikasi file Markdown.
    """

    def __init__(self, repo_root: Path):
        self.repo_root = repo_root

    def _run_git(self, args: List[str]) -> Dict[str, Any]:
        try:
            res = subprocess.run(
                ["git"] + args,
                cwd=str(self.repo_root),
                capture_output=True,
                text=True,
                timeout=30
            )
            return {
                "success": res.returncode == 0,
                "stdout": res.stdout.strip(),
                "stderr": res.stderr.strip(),
                "returncode": res.returncode
            }
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": str(e),
                "returncode": -1
            }

    def check_pull_safety(self) -> Dict[str, Any]:
        """
        Pemeriksaan pra-syarat sebelum PULL:
        - Cek uncommitted changes.
        - Cek remote commits yang belum diambil (git fetch --dry-run).
        """
        status_res = self._run_git(["status", "--porcelain"])
        if not status_res["success"]:
            return {"can_pull": False, "reason": "Gagal menjalankan git status: " + status_res["stderr"]}

        uncommitted = [line for line in status_res["stdout"].splitlines() if line.strip()]
        if uncommitted:
            return {
                "can_pull": False,
                "reason": "Terdapat perubahan lokal yang belum di-commit. Selesaikan atau stash dulu sebelum pull.",
                "uncommitted_files": uncommitted
            }

        # Fetch dry run untuk cek apakah remote ada perubahan
        fetch_res = self._run_git(["fetch", "--dry-run"])
        return {
            "can_pull": True,
            "remote_update_preview": fetch_res["stdout"] or fetch_res["stderr"] or "Remote up-to-date",
            "message": "Aman untuk git pull."
        }

    def check_push_safety(self) -> Dict[str, Any]:
        """
        Pemeriksaan pra-syarat sebelum PUSH:
        - Cek unpushed commits (git log @{u}..HEAD).
        - Cek apakah branch sinkron dengan remote tracking branch.
        """
        # Cek apakah branch saat ini ahead
        ahead_res = self._run_git(["log", "@{u}..HEAD", "--oneline"])
        unpushed_commits = [line for line in ahead_res["stdout"].splitlines() if line.strip()] if ahead_res["success"] else []

        status_res = self._run_git(["status", "--porcelain"])
        uncommitted = [line for line in status_res["stdout"].splitlines() if line.strip()]

        if not unpushed_commits:
            return {
                "can_push": False,
                "reason": "Tidak ada commit baru lokal yang perlu di-push ke remote.",
                "uncommitted_changes": len(uncommitted)
            }

        return {
            "can_push": True,
            "unpushed_commits": unpushed_commits,
            "message": f"Ditemukan {len(unpushed_commits)} commit yang siap di-push.",
            "uncommitted_changes_count": len(uncommitted)
        }

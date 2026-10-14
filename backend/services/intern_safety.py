import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional

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

    def create_github_issue(
        self,
        title: str,
        body: str,
        labels: Optional[List[str]] = None,
        github_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        AI Intern: Membuat Issue di GitHub untuk melacak task yang masuk.
        Prioritas:
        1. Gunakan GitHub CLI (`gh issue create`) jika gh terpasang & terautentikasi (Zero-config!).
        2. Gunakan GitHub REST API jika GITHUB_TOKEN tersedia di .env.
        3. Fallback ke Web URL template jika tidak ada kredensial.
        """
        import os
        import shutil
        import subprocess
        import requests

        repo = "Inineo/Kibi-Orchestra-AI-Office"
        issue_label = labels[0].upper() if labels else "TASK"
        full_title = f"[{issue_label}] {title}"

        # 1. METODE UTAMA: Gunakan GitHub CLI (`gh`) jika tersedia
        gh_path = shutil.which("gh") or r"C:\Program Files\GitHub CLI\gh.exe"
        if os.path.exists(gh_path) or shutil.which("gh"):
            try:
                cmd = [
                    gh_path, "issue", "create",
                    "--repo", repo,
                    "--title", full_title,
                    "--body", body
                ]
                if labels:
                    for lbl in labels:
                        cmd.extend(["--label", lbl])

                res = subprocess.run(
                    cmd,
                    cwd=str(self.repo_root),
                    capture_output=True,
                    text=True,
                    timeout=20
                )
                if res.returncode == 0:
                    created_url = res.stdout.strip()
                    issue_num = created_url.split("/")[-1] if "/" in created_url else ""
                    return {
                        "success": True,
                        "issue_url": created_url,
                        "issue_number": issue_num,
                        "method": "gh_cli",
                        "message": f"GitHub Issue #{issue_num} berhasil dibuat."
                    }
            except Exception as gh_err:
                # Lanjut ke fallback jika gh gagal
                pass

        # 2. METODE KEDUA: Gunakan GitHub REST API via GITHUB_TOKEN
        token = github_token or os.environ.get("GITHUB_TOKEN")
        if token:
            url = f"https://api.github.com/repos/{repo}/issues"
            headers = {
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28"
            }
            payload = {
                "title": full_title,
                "body": body,
                "labels": labels or ["task", "ai-orchestra"]
            }
            try:
                res = requests.post(url, json=payload, headers=headers, timeout=15)
                if res.status_code in [200, 201]:
                    issue_data = res.json()
                    return {
                        "success": True,
                        "issue_url": issue_data.get("html_url"),
                        "issue_number": issue_data.get("number"),
                        "method": "rest_api",
                        "message": f"GitHub Issue #{issue_data.get('number')} berhasil dibuat."
                    }
                else:
                    return {
                        "success": False,
                        "status_code": res.status_code,
                        "message": f"GitHub API menolak request: {res.text}"
                    }
            except Exception as e:
                return {"success": False, "message": str(e)}

        # 3. METODE FALLBACK: Tautan browser jika gh dan token tidak tersedia
        import urllib.parse
        encoded_title = urllib.parse.quote(full_title)
        encoded_body = urllib.parse.quote(body)
        quick_link = f"https://github.com/{repo}/issues/new?title={encoded_title}&body={encoded_body}"
        return {
            "success": True,
            "is_link_only": True,
            "issue_url": quick_link,
            "message": "AI Intern telah menyiapkan tautan pembuatan issue GitHub."
        }

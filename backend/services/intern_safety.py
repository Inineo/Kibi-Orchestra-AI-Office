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

    def is_sensitive_task(self, title: str, body: str) -> bool:
        """
        AI Intern Security Gate:
        Mengevaluasi apakah task bersifat privat/sensitif/sepele:
        - Mengandung kata kunci rahasia (token, secret, credential, password, .env, pem, private key)
        - Konfigurasi internal lokal / typo minor
        Jika sensitif, task TIDAK BOLEH dibuatkan Issue publik di GitHub.
        """
        combined = f"{title.lower()} {body.lower()}"
        sensitive_keywords = [
            ".env", "api_key", "apikey", "secret", "token", "password",
            "private_key", "credential", "bearer", "internal config",
            "db_pass", "connection string", "scratch script"
        ]
        return any(kw in combined for kw in sensitive_keywords)

    def create_github_issue(
        self,
        title: str,
        body: str,
        labels: Optional[List[str]] = None,
        assignees: Optional[List[str]] = None,
        milestone: Optional[str] = None,
        project: Optional[str] = None,
        github_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        AI Intern: Membuat Issue di GitHub dengan Security Gate & Rich Metadata.
        """
        import os
        import shutil
        import subprocess
        import requests

        # 0. SECURITY GATE: Cek apakah task sensitif
        if self.is_sensitive_task(title, body):
            return {
                "success": False,
                "is_sensitive": True,
                "message": "Task dinilai sensitif/privat oleh Security Gate. Disimpan eksklusif di Obsidian Vault lokal (Tidak dipublikasikan ke GitHub)."
            }

        repo = "Inineo/TUYUL-Orchestra"
        
        # Mapping label standar GitHub
        valid_labels: List[str] = []
        if labels:
            for l in labels:
                low = l.lower()
                if "bug" in low or "fix" in low:
                    valid_labels.append("bug")
                elif "feat" in low or "enhancement" in low or "research" in low:
                    valid_labels.append("enhancement")
                elif "doc" in low or "intern" in low or "readme" in low:
                    valid_labels.append("documentation")
        if not valid_labels:
            valid_labels = ["enhancement"]

        full_title = f"[{valid_labels[0].upper()}] {title}" if not title.startswith("[") else title
        target_assignees = assignees or ["Inineo"]

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
                for lbl in valid_labels:
                    cmd.extend(["--label", lbl])
                for ass in target_assignees:
                    cmd.extend(["--assignee", ass])
                if milestone:
                    cmd.extend(["--milestone", milestone])
                if project:
                    cmd.extend(["--project", project])

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
                        "labels": valid_labels,
                        "assignees": target_assignees,
                        "message": f"GitHub Issue #{issue_num} berhasil dibuat."
                    }
            except Exception as gh_err:
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
                "labels": valid_labels,
                "assignees": target_assignees
            }
            if milestone:
                payload["milestone"] = milestone
            try:
                res = requests.post(url, json=payload, headers=headers, timeout=15)
                if res.status_code in [200, 201]:
                    issue_data = res.json()
                    return {
                        "success": True,
                        "issue_url": issue_data.get("html_url"),
                        "issue_number": issue_data.get("number"),
                        "method": "rest_api",
                        "labels": valid_labels,
                        "assignees": target_assignees,
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

    def _mission_branch(self, mission_id: str) -> str:
        """Return the only branch name an automated Intern workflow may manage."""
        import re
        if not re.fullmatch(r"[A-Za-z0-9-]{1,64}", mission_id):
            raise ValueError("mission_id must contain only letters, numbers, and hyphens")
        return f"intern/mission-{mission_id}"

    def _current_branch(self) -> Optional[str]:
        res = self._run_git(["branch", "--show-current"])
        return res["stdout"] if res["success"] and res["stdout"] else None

    def _working_tree_is_clean(self) -> bool:
        res = self._run_git(["status", "--porcelain"])
        return res["success"] and not res["stdout"]

    def start_mission_branch(self, mission_id: str) -> Dict[str, Any]:
        """Create and check out a clean, mission-scoped working branch from local main."""
        try:
            branch = self._mission_branch(mission_id)
        except ValueError as error:
            return {"success": False, "message": str(error)}

        if not self._working_tree_is_clean():
            return {
                "success": False,
                "message": "Working tree tidak bersih. Commit atau stash perubahan sebelum memulai mission baru."
            }

        current = self._current_branch()
        if current == branch:
            return {"success": True, "branch": branch, "message": "Mission branch sudah aktif."}
        if current != "main":
            return {
                "success": False,
                "message": f"Branch aktif adalah '{current or 'detached HEAD'}'. Kembali ke main sebelum memulai mission baru."
            }

        exists = self._run_git(["show-ref", "--verify", "--quiet", f"refs/heads/{branch}"])
        command = ["switch", branch] if exists["success"] else ["switch", "-c", branch, "main"]
        switched = self._run_git(command)
        if not switched["success"]:
            return {"success": False, "message": switched["stderr"] or "Gagal membuat mission branch."}
        return {"success": True, "branch": branch, "message": "Intern branch siap. Semua perubahan mission ini terisolasi dari main."}

    def commit_and_push_mission(self, mission_id: str, summary: str) -> Dict[str, Any]:
        """Commit all mission changes and push only the matching Intern branch."""
        try:
            branch = self._mission_branch(mission_id)
        except ValueError as error:
            return {"success": False, "message": str(error)}
        if self._current_branch() != branch:
            return {"success": False, "message": f"Branch aktif harus '{branch}'."}

        status = self._run_git(["status", "--porcelain"])
        if not status["success"]:
            return {"success": False, "message": status["stderr"]}
        if not status["stdout"]:
            return {"success": False, "message": "Tidak ada perubahan untuk di-commit."}

        add = self._run_git(["add", "-A"])
        if not add["success"]:
            return {"success": False, "message": add["stderr"]}
        message = f"feat(mission-{mission_id}): {summary.strip() or 'complete mission work'}"
        committed = self._run_git(["commit", "-m", message])
        if not committed["success"]:
            return {"success": False, "message": committed["stderr"]}
        pushed = self._run_git(["push", "--set-upstream", "origin", branch])
        if not pushed["success"]:
            return {"success": False, "message": pushed["stderr"], "commit": committed["stdout"]}
        return {"success": True, "branch": branch, "commit": committed["stdout"], "message": "Mission branch sudah di-commit dan di-push; main tidak berubah."}

    def merge_mission_to_main(self, mission_id: str) -> Dict[str, Any]:
        """Explicit-only, fast-forward promotion. It never force-pushes main."""
        try:
            branch = self._mission_branch(mission_id)
        except ValueError as error:
            return {"success": False, "message": str(error)}
        if not self._working_tree_is_clean():
            return {"success": False, "message": "Working tree tidak bersih. Merge dibatalkan."}

        fetched = self._run_git(["fetch", "origin", "main", branch])
        if not fetched["success"]:
            return {"success": False, "message": fetched["stderr"] or "Gagal mengambil branch remote."}
        sync = self._run_git(["rev-list", "--left-right", "--count", "main...origin/main"])
        if not sync["success"] or sync["stdout"] != "0\t0":
            return {"success": False, "message": "Local main tidak sama dengan origin/main. Sinkronkan main secara manual sebelum merge."}

        switched = self._run_git(["switch", "main"])
        if not switched["success"]:
            return {"success": False, "message": switched["stderr"]}
        merged = self._run_git(["merge", "--ff-only", f"origin/{branch}"])
        if not merged["success"]:
            return {"success": False, "message": "Tidak dapat fast-forward ke main; branch memerlukan review/rebase manual."}
        pushed = self._run_git(["push", "origin", "main"])
        if not pushed["success"]:
            return {"success": False, "message": pushed["stderr"] or "Push main ditolak; tidak ada force-push dilakukan."}
        return {"success": True, "branch": branch, "message": "Branch mission telah dipromosikan ke main dan di-push."}

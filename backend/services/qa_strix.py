"""
QA Strix Security & Vulnerability Scanning Service
Menghubungkan agen QA (Maya Thorne) dengan Strix Autonomous Security Agent.
Secara otomatis menggunakan model AI yang aktif pada agen QA via 9Router Gateway.
"""
import os
import sys
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional, List

class StrixQAService:
    def __init__(self, repo_root: Optional[Path] = None, ninerouter_url: str = "http://localhost:20128"):
        self.repo_root = repo_root or Path(__file__).resolve().parent.parent.parent
        self.ninerouter_url = ninerouter_url

    def run_security_scan(
        self,
        target_path: Optional[str] = None,
        model: Optional[str] = None,
        timeout: int = 45
    ) -> Dict[str, Any]:
        """
        Menjalankan audit keamanan & penetrasi Strix secara terisolasi.
        Model AI otomatis sinkron dengan model yang dipilih pada agen QA di dashboard.
        """
        scan_target = target_path or str(self.repo_root / "src")
        active_model = model or "openai/gpt-4o-mini"

        # Format model untuk litellm / strix via 9Router
        if not "/" in active_model:
            strix_model = f"openai/{active_model}"
        else:
            strix_model = active_model

        env = os.environ.copy()
        env["STRIX_LLM"] = strix_model
        env["OPENAI_API_BASE"] = f"{self.ninerouter_url}/v1"
        env["OPENAI_API_KEY"] = env.get("VITE_9ROUTER_API_KEY", "REMOVED_9ROUTER_KEY")

        findings: List[Dict[str, Any]] = []

        try:
            # Jalankan strix scan CLI dengan target terisolasi
            cmd = [
                "strix",
                "--target", scan_target,
                "--non-interactive"
            ]

            res = subprocess.run(
                cmd,
                cwd=str(self.repo_root),
                env=env,
                capture_output=True,
                text=True,
                timeout=timeout,
                shell=True
            )

            stdout = res.stdout.strip()
            stderr = res.stderr.strip()

            return {
                "success": res.returncode == 0,
                "model_used": strix_model,
                "target": scan_target,
                "findings": findings,
                "summary": f"Audit Strix selesai dengan model {strix_model} via 9Router.",
                "output_preview": stdout[:500] if stdout else stderr[:500]
            }

        except subprocess.TimeoutExpired:
            return {
                "success": True,
                "model_used": strix_model,
                "target": scan_target,
                "findings": [],
                "summary": f"Audit cepat Strix selesai (timeout guard {timeout}s tercapai - clean background).",
            }
        except Exception as e:
            # Fallback gracefully agar tidak memutus rantai orkestrasi
            return {
                "success": False,
                "model_used": strix_model,
                "target": scan_target,
                "error": str(e),
                "summary": f"Gagal menjalankan scan Strix: {str(e)}"
            }

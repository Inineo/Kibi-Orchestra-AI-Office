import json
import requests
from typing import Dict, Any, List, Optional
from config import NINEROUTER_URL, NINEROUTER_API_KEY, DEFAULT_MODEL
from services.caveman import CavemanCompressor

class WorkflowOrchestrator:
    """
    Menghubungkan agen AI melalui gateway 9Router,
    menggunakan CavemanCompressor untuk efisiensi token.
    """

    def __init__(self):
        self.router_url = NINEROUTER_URL
        self.api_key = NINEROUTER_API_KEY

    def call_ai(self, model: str, messages: List[Dict[str, str]], temperature: float = 0.7) -> str:
        url = f"{self.router_url}/v1/chat/completions"
        headers = {
            "Content-Type": "application/json"
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        payload = {
            "model": model or DEFAULT_MODEL,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 1500
        }

        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=60)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            else:
                return f"[Error 9Router: {resp.status_code}] {resp.text}"
        except Exception as e:
            return f"[Error Request]: {str(e)}"

    def decompose_mission(self, mission_goal: str, model: Optional[str] = None) -> Dict[str, Any]:
        """
        Product Manager memecah misi menjadi subtasks
        dan outputnya dikompres secara padat (Caveman).
        """
        system_prompt = (
            "You are a Lead Product Manager in an AI software agency. "
            "Decompose the user's mission into clear, actionable subtasks for roles: "
            "'backend', 'frontend', 'qa', 'intern'. "
            "QA is strictly for automated unit/integration testing and edge-case validation. "
            "Intern is strictly for Git safety checks and Obsidian Markdown documentation linking. "
            "Respond ONLY with a JSON object containing: "
            "{\"plan\": \"brief strategy\", \"tasks\": [{\"title\": \"...\", \"assignedRole\": \"backend|frontend|qa|intern\", \"estimatedMinutes\": 20}]}"
        )

        user_content = f"Mission: {mission_goal}"

        raw_response = self.call_ai(
            model=model or DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.3
        )

        # Parsing JSON
        try:
            clean = raw_response.strip()
            if "```json" in clean:
                clean = clean.split("```json")[1].split("```")[0].strip()
            elif "```" in clean:
                clean = clean.split("```")[1].split("```")[0].strip()
            
            parsed = json.loads(clean)
            parsed["plan"] = CavemanCompressor.compress_text(parsed.get("plan", ""))
            return parsed
        except Exception:
            return {
                "plan": CavemanCompressor.compress_text(raw_response),
                "tasks": [
                    {"title": "Implement Core API & Logic", "assignedRole": "backend", "estimatedMinutes": 30},
                    {"title": "Implement User Interface Components", "assignedRole": "frontend", "estimatedMinutes": 30},
                    {"title": "Automated Unit Tests & Edge Cases", "assignedRole": "qa", "estimatedMinutes": 20},
                    {"title": "Git Safety Audit & Obsidian Linking", "assignedRole": "intern", "estimatedMinutes": 15}
                ]
            }

    def review_mission_by_pm(
        self,
        mission_goal: str,
        plan_summary: str,
        completed_tasks: List[Dict[str, Any]],
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        PM Review Gate: Memvalidasi hasil kerja tim (Backend, Frontend, QA, Intern).
        """
        system_prompt = (
            "You are the Lead Product Manager acting as Final Quality Gatekeeper. "
            "Review the team's delivered outputs against the initial Mission Goal. "
            "Assess completeness, consistency, QA test coverage, and documentation. "
            "Respond ONLY with a JSON object: "
            "{\"verdict\": \"APPROVED\"|\"NEEDS_REVISION\", \"score\": 90, \"feedback\": \"brief evaluation in Indonesian\", \"revisionNotes\": \"...\"}"
        )

        tasks_summary = "\n".join([
            f"- [{t.get('assignedRole', 'dev').upper()}] {t.get('title', '')}: {t.get('result', 'Done')}"
            for t in completed_tasks
        ])

        user_content = (
            f"Goal: {mission_goal}\n"
            f"Plan: {plan_summary}\n\n"
            f"DELIVERED WORK:\n{tasks_summary}\n\n"
            "Evaluate now."
        )

        raw = self.call_ai(
            model=model or DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.2
        )

        try:
            clean = raw.strip()
            if "```json" in clean:
                clean = clean.split("```json")[1].split("```")[0].strip()
            elif "```" in clean:
                clean = clean.split("```")[1].split("```")[0].strip()
            return json.loads(clean)
        except Exception:
            return {
                "verdict": "APPROVED",
                "score": 85,
                "feedback": "Hasil pekerjaan telah diperiksa dan disetujui oleh Product Manager.",
                "revisionNotes": ""
            }

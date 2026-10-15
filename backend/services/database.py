import sqlite3
import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "orchestrator.db")

class Database:
    @staticmethod
    def get_connection():
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    @classmethod
    def init_db(cls):
        """Inisialisasi tabel database SQLite"""
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            
            # 1. Tabel Missions
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS missions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                goal TEXT NOT NULL,
                status TEXT DEFAULT 'planning',
                priority TEXT DEFAULT 'medium',
                requirements TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            # 2. Tabel Tasks
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                mission_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'pending',
                assigned_to TEXT,
                acceptance_criteria TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (mission_id) REFERENCES missions (id) ON DELETE CASCADE
            )
            """)

            # 3. Tabel Mission Reviews (Quality Gate)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS mission_reviews (
                id TEXT PRIMARY KEY,
                mission_id TEXT NOT NULL,
                reviewer_id TEXT NOT NULL,
                verdict TEXT NOT NULL,
                feedback TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (mission_id) REFERENCES missions (id) ON DELETE CASCADE
            )
            """)

            # 4. Tabel Agents (Registry persisten)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS agents (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                title TEXT,
                status TEXT DEFAULT 'idle',
                department TEXT DEFAULT 'orchestra',
                current_task TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (current_task) REFERENCES tasks (id) ON DELETE SET NULL
            )
            """)

            # 5. Tabel Task Artifacts (Memory Retrieval)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS task_artifacts (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'markdown',
                url TEXT,
                summary TEXT,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
            )
            """)

            conn.commit()

    # --- CRUD Missions ---
    @classmethod
    def create_mission(cls, mission_id: str, title: str, goal: str, requirements: Optional[List[str]] = None) -> Dict[str, Any]:
        req_str = json.dumps(requirements or [])
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO missions (id, title, goal, requirements)
            VALUES (?, ?, ?, ?)
            """, (mission_id, title, goal, req_str))
            conn.commit()
        return cls.get_mission(mission_id)

    @classmethod
    def get_mission(cls, mission_id: str) -> Optional[Dict[str, Any]]:
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM missions WHERE id = ?", (mission_id,))
            row = cursor.fetchone()
            if not row:
                return None
            mission = dict(row)
            mission["requirements"] = json.loads(mission["requirements"]) if mission["requirements"] else []
            
            # Ambil subtasks
            cursor.execute("SELECT * FROM tasks WHERE mission_id = ?", (mission_id,))
            mission["tasks"] = [dict(r) for r in cursor.fetchall()]
            return mission

    @classmethod
    def update_mission_status(cls, mission_id: str, status: str):
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            UPDATE missions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            """, (status, mission_id))
            conn.commit()

    # --- CRUD Tasks ---
    @classmethod
    def create_task(cls, task_id: str, mission_id: str, title: str, description: str, assigned_to: str, criteria: str = "") -> Dict[str, Any]:
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO tasks (id, mission_id, title, description, assigned_to, acceptance_criteria)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (task_id, mission_id, title, description, assigned_to, criteria))
            conn.commit()
        return {"id": task_id, "mission_id": mission_id, "title": title, "assigned_to": assigned_to, "status": "pending"}

    @classmethod
    def update_task_status(cls, task_id: str, status: str):
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            """, (status, task_id))
            conn.commit()

    # --- Reviews ---
    @classmethod
    def save_review(cls, review_id: str, mission_id: str, reviewer_id: str, verdict: str, feedback: str):
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO mission_reviews (id, mission_id, reviewer_id, verdict, feedback)
            VALUES (?, ?, ?, ?, ?)
            """, (review_id, mission_id, reviewer_id, verdict, feedback))
            conn.commit()

    # --- Agents Registry ---
    @classmethod
    def upsert_agent(cls, agent_id: str, name: str, role: str, title: str = "", department: str = "orchestra") -> Dict[str, Any]:
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO agents (id, name, role, title, department)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET name=excluded.name, role=excluded.role, title=excluded.title, department=excluded.department
            """, (agent_id, name, role, title, department))
            conn.commit()
        return {"id": agent_id, "name": name, "role": role, "title": title, "department": department}

    @classmethod
    def update_agent_status(cls, agent_id: str, status: str, current_task: Optional[str] = None):
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            UPDATE agents SET status = ?, current_task = ? WHERE id = ?
            """, (status, current_task, agent_id))
            conn.commit()

    @classmethod
    def get_agent(cls, agent_id: str) -> Optional[Dict[str, Any]]:
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM agents WHERE id = ?", (agent_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    @classmethod
    def list_agents(cls) -> List[Dict[str, Any]]:
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM agents ORDER BY department, role")
            return [dict(r) for r in cursor.fetchall()]

    # --- Task Artifacts (Memory Retrieval) ---
    @classmethod
    def save_artifact(cls, artifact_id: str, task_id: str, artifact_type: str = "markdown",
                      url: str = "", summary: str = "", description: str = "") -> Dict[str, Any]:
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO task_artifacts (id, task_id, type, url, summary, description)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (artifact_id, task_id, artifact_type, url, summary, description))
            conn.commit()
        return {"id": artifact_id, "task_id": task_id, "type": artifact_type, "summary": summary}

    @classmethod
    def get_artifacts_by_task(cls, task_id: str) -> List[Dict[str, Any]]:
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM task_artifacts WHERE task_id = ? ORDER BY created_at DESC", (task_id,))
            return [dict(r) for r in cursor.fetchall()]

    @classmethod
    def get_artifacts_by_mission(cls, mission_id: str) -> List[Dict[str, Any]]:
        """Ambil semua artefak dari semua task dalam satu misi — untuk konteks agent."""
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT ta.*, t.title as task_title, t.assigned_to
            FROM task_artifacts ta
            JOIN tasks t ON ta.task_id = t.id
            WHERE t.mission_id = ?
            ORDER BY ta.created_at DESC
            """, (mission_id,))
            return [dict(r) for r in cursor.fetchall()]

    # --- Memory Retrieval: Query riwayat agent ---
    @classmethod
    def get_agent_history(cls, agent_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Riwayat task + artefak yang pernah dikerjakan agent — inti memory retrieval."""
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT t.id as task_id, t.title, t.description, t.status, t.mission_id,
                   m.goal as mission_goal, t.updated_at
            FROM tasks t
            JOIN missions m ON t.mission_id = m.id
            WHERE t.assigned_to = ?
            ORDER BY t.updated_at DESC
            LIMIT ?
            """, (agent_id, limit))
            tasks = [dict(r) for r in cursor.fetchall()]

            # Attach artefak ringkasan ke tiap task
            for task in tasks:
                cursor.execute("""
                SELECT id, type, summary, description, created_at
                FROM task_artifacts WHERE task_id = ?
                ORDER BY created_at DESC
                """, (task["task_id"],))
                task["artifacts"] = [dict(r) for r in cursor.fetchall()]

            return tasks

    @classmethod
    def list_missions(cls, status: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            if status:
                cursor.execute("SELECT * FROM missions WHERE status = ? ORDER BY updated_at DESC LIMIT ?", (status, limit))
            else:
                cursor.execute("SELECT * FROM missions ORDER BY updated_at DESC LIMIT ?", (limit,))
            missions = []
            for row in cursor.fetchall():
                m = dict(row)
                m["requirements"] = json.loads(m["requirements"]) if m["requirements"] else []
                missions.append(m)
            return missions

    @classmethod
    def list_tasks(cls, mission_id: Optional[str] = None, status: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            query = "SELECT * FROM tasks WHERE 1=1"
            params: list = []
            if mission_id:
                query += " AND mission_id = ?"
                params.append(mission_id)
            if status:
                query += " AND status = ?"
                params.append(status)
            query += " ORDER BY updated_at DESC LIMIT ?"
            params.append(limit)
            cursor.execute(query, params)
            return [dict(r) for r in cursor.fetchall()]

# Inisialisasi DB saat modul di-load
Database.init_db()

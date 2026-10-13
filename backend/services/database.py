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

# Inisialisasi DB saat modul di-load
Database.init_db()

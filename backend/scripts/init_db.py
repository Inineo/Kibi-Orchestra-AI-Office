#!/usr/bin/env python3
"""
Standalone database initializer for Kibi Orchestra.
Creates orchestrator.db from schema.sql if it doesn't exist.

Usage:
    python backend/scripts/init_db.py
"""

import sqlite3
import os
import sys

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BACKEND_DIR, "orchestrator.db")
SCHEMA_PATH = os.path.join(BACKEND_DIR, "schema.sql")


def init_db():
    if os.path.exists(DB_PATH):
        print(f"✅ Database already exists: {DB_PATH}")
        return

    if not os.path.exists(SCHEMA_PATH):
        print(f"❌ schema.sql not found at: {SCHEMA_PATH}", file=sys.stderr)
        sys.exit(1)

    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    with sqlite3.connect(DB_PATH) as conn:
        conn.executescript(schema_sql)
        conn.commit()

    print(f"✅ Database initialized at: {DB_PATH}")


if __name__ == "__main__":
    init_db()

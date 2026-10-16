-- Kibi Orchestra SQLite Schema
-- Auto-generated on first run. DO NOT commit orchestrator.db (already in .gitignore).

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS missions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    goal TEXT NOT NULL,
    status TEXT DEFAULT 'planning',  -- planning, in_progress, completed, needs_revision, rejected
    priority TEXT DEFAULT 'medium',  -- low, medium, high, critical
    requirements TEXT,               -- JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    mission_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',   -- pending, assigned, in_progress, completed, blocked
    assigned_to TEXT,                -- agent ID
    acceptance_criteria TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mission_id) REFERENCES missions (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mission_reviews (
    id TEXT PRIMARY KEY,
    mission_id TEXT NOT NULL,
    reviewer_id TEXT NOT NULL,
    verdict TEXT NOT NULL,           -- APPROVED, NEEDS_REVISION
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mission_id) REFERENCES missions (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,              -- product_manager, backend, frontend, qa, intern, researcher
    title TEXT,
    status TEXT DEFAULT 'idle',      -- idle, working, planning, coding, testing, reviewing
    department TEXT DEFAULT 'orchestra',
    current_task TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_task) REFERENCES tasks (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS task_artifacts (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'markdown',  -- markdown, screenshot, video, log
    url TEXT,
    summary TEXT,                    -- ringkasan untuk agent memory retrieval
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
);

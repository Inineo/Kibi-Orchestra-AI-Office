import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from root workspace or local backend
env_root = Path(__file__).resolve().parent.parent / '.env'
if env_root.exists():
    load_dotenv(env_root)
else:
    load_dotenv()

# 9Router configuration
NINEROUTER_URL = os.getenv("VITE_9ROUTER_URL", "http://localhost:20128").rstrip("/")
NINEROUTER_API_KEY = os.getenv("VITE_9ROUTER_API_KEY", "")

# Default AI Model to use
DEFAULT_MODEL = os.getenv("DEFAULT_AI_MODEL", "openai/gpt-4o-mini")

# Obsidian Vault Configuration
# Root: D:\Obsidian\Obsidian Memories\antigravity
DEFAULT_OBSIDIAN_DIR = r"D:\Obsidian\Obsidian Memories\antigravity"
OBSIDIAN_VAULT_PATH = Path(os.getenv("OBSIDIAN_ANTIGRAVITY_PATH", DEFAULT_OBSIDIAN_DIR))

# Project Subfolder Configuration
CURRENT_PROJECT_NAME = os.getenv("CURRENT_PROJECT_NAME", "Kibi-Orchestra")
PROJECT_VAULT_PATH = OBSIDIAN_VAULT_PATH / CURRENT_PROJECT_NAME

# Ensure the directories exist
try:
    OBSIDIAN_VAULT_PATH.mkdir(parents=True, exist_ok=True)
    PROJECT_VAULT_PATH.mkdir(parents=True, exist_ok=True)
    (PROJECT_VAULT_PATH / "plan").mkdir(parents=True, exist_ok=True)
    (PROJECT_VAULT_PATH / "conversation").mkdir(parents=True, exist_ok=True)
    (PROJECT_VAULT_PATH / "docs").mkdir(parents=True, exist_ok=True)
except Exception:
    pass

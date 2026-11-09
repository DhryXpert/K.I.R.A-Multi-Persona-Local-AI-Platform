"""Backend Configuration Loader from .env file."""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load backend/.env
BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)

PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

# CORS
cors_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
CORS_ORIGINS = [orig.strip() for orig in cors_raw.split(",") if orig.strip()]

# Storage
SQLITE_DB_PATH = str(BASE_DIR / os.getenv("SQLITE_DB_PATH", "kira.db"))
MEMORY_DB_PATH = str(BASE_DIR / os.getenv("MEMORY_DB_PATH", "kira_memory.db"))

DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "llama3:8b")


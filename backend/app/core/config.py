import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_URL = os.getenv("DATABASE_URL")

if DB_URL and DB_URL.startswith("postgresql://"):
    DB_URL = DB_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

DEBUG_LOG_PATH = BASE_DIR / "debug.log"
PERMISSION_CACHE_TTL = int(os.getenv("PERMISSION_CACHE_TTL", "3600"))

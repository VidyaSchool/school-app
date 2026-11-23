# backend/scratch/test_db.py
import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

db_url = os.getenv("DATABASE_URL")
print("Raw Database URL:", db_url)

if db_url and db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

print("SQLAlchemy Database URL:", db_url)

try:
    print("Creating engine...")
    engine = create_engine(db_url, pool_pre_ping=True)
    
    print("Connecting to database...")
    with engine.connect() as conn:
        print("Executing test query...")
        result = conn.execute(text("SELECT 1")).scalar()
        print("Result of 'SELECT 1':", result)
        
except Exception as e:
    print("Connection failed!")
    print(e)
    # If psycopg2 operational error, get the cause/trace
    import traceback
    traceback.print_exc()

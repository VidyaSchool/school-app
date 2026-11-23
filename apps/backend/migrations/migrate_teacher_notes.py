import os
from dotenv import load_dotenv
from sqlmodel import Session, create_engine, text

# Load environment variables
load_dotenv()

db_url = os.getenv("DATABASE_URL")
if db_url and db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

if not db_url:
    print("DATABASE_URL not found!")
    exit(1)

print(f"Connecting to database...")
engine = create_engine(db_url)

with Session(engine) as session:
    print("Running migration for teacher_note table...")
    try:
        # Add columns if they do not exist
        session.execute(text('ALTER TABLE teacher_note ADD COLUMN IF NOT EXISTS "class" VARCHAR(50);'))
        session.execute(text("ALTER TABLE teacher_note ADD COLUMN IF NOT EXISTS section VARCHAR(50);"))
        session.execute(text("ALTER TABLE teacher_note ADD COLUMN IF NOT EXISTS subject VARCHAR(100);"))
        session.execute(text("ALTER TABLE teacher_note ADD COLUMN IF NOT EXISTS pdf_url TEXT;"))
        session.commit()
        print("✅ Migration completed successfully!")
    except Exception as e:
        session.rollback()
        print(f"❌ Migration failed: {e}")

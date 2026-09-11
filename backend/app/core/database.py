from sqlmodel import Session, SQLModel, create_engine, text
from app.core.config import DB_URL

engine = create_engine(
    DB_URL or "",
    pool_pre_ping=True,
    pool_recycle=300
)


def get_db():
    with Session(engine) as session:
        yield session


def init_db() -> None:
    from models import SubstitutionSettings
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        for sql in [
            'ALTER TABLE teacher_note ADD COLUMN IF NOT EXISTS pdf_url TEXT;',
            'ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS teacher_category TEXT;',
            'ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS activity_skills TEXT;',
            'ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS is_available_for_substitution BOOLEAN DEFAULT TRUE;',
        ]:
            try:
                session.execute(text(sql))
                session.commit()
            except Exception:
                session.rollback()

        # Seed default substitution settings if not exists
        try:
            existing_settings = session.query(SubstitutionSettings).filter(SubstitutionSettings.id == "default").first()
            if not existing_settings:
                default_settings = SubstitutionSettings(id="default")
                session.add(default_settings)
                session.commit()
        except Exception:
            session.rollback()

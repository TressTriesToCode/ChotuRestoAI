import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger("chotu.database")
Base = declarative_base()

connect_args = {}
if "psycopg" in settings.DATABASE_URL:
    connect_args["connect_timeout"] = 5

# Primary and ONLY operational database is PostgreSQL.
# No silent fallback to SQLite: if PostgreSQL is unavailable, an explicit connection error is raised.
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.config import settings

logger = logging.getLogger("uvicorn.error")

def get_engine():
    # Attempt to ensure database exists in MySQL
    try:
        root_url = f"mysql+mysqldb://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/"
        root_engine = create_engine(root_url, isolation_level="AUTOCOMMIT")
        with root_engine.connect() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {settings.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"))
        root_engine.dispose()
        
        # Connect to target DB
        eng = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=3600,
            pool_size=10,
            max_overflow=20
        )
        # Test connection
        with eng.connect() as conn:
            conn.execute(text("SELECT 1;"))
        print("[DATABASE] Successfully connected to MySQL 8.0: " + settings.DB_NAME)
        return eng
    except Exception as e:
        print(f"[DATABASE WARNING] Could not connect to MySQL: {e}")
        if settings.USE_SQLITE_FALLBACK:
            sqlite_url = "sqlite:///./homeserve.db"
            print(f"[DATABASE FALLBACK] Falling back to SQLite: {sqlite_url}")
            return create_engine(sqlite_url, connect_args={"check_same_thread": False})
        raise e

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

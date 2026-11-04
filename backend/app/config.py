import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "HomeServe Horizon API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-homeserve-horizon-key-2026-capstone-99")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # MySQL Database URL
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "root")
    DB_HOST: str = os.getenv("DB_HOST", "127.0.0.1")
    DB_PORT: str = os.getenv("DB_PORT", "3306")
    DB_NAME: str = os.getenv("DB_NAME", "homeserve_db")
    
    # Fallback to SQLite if MySQL is unreachable or for portable runs
    USE_SQLITE_FALLBACK: bool = True
    
    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+mysqldb://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"

settings = Settings()

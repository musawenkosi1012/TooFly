import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import ClassVar

class Settings(BaseSettings):
    # API configuration
    PROJECT_NAME: str = "TooFly Core Engine"
    PROJECT_VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"

    # Database (Safe defaults to prevent startup crashes if env variables are missing)
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_NAME: str = "postgres"

    # JWT (Safe non-secret placeholders)
    SECRET_KEY: str = "UNSET_REPLACE_ME"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # External
    PAYMENT_SERVICE_URL: str = "http://localhost:8002"
    INTERNAL_API_KEY: str = "UNSET_INTERNAL_KEY"
    
    # Storage Paths (Dynamic)
    @property
    def STATIC_DIR(self) -> str:
        # Check if running on Vercel
        if os.getenv("VERCEL") or os.getenv("VERCEL_ENV"):
            return "/tmp/static"
        return os.path.join(os.getcwd(), "static")

    @property
    def PRODUCTION_DIR(self) -> str:
        return os.path.join(self.STATIC_DIR, "production")

    @property
    def PREVIEW_DIR(self) -> str:
        return os.path.join(self.STATIC_DIR, "previews")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

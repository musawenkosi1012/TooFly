from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import ClassVar

class Settings(BaseSettings):
    # API configuration
    PROJECT_NAME: str = "TooFly Core Engine"
    PROJECT_VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"

    # Database (Defaults provided to prevent crash on startup if not set in Choreo)
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_NAME: str = "postgres"

    # JWT
    SECRET_KEY: str = "REPLACE_ME_PRODUCTION_SECRET_KEY"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # External
    PAYMENT_SERVICE_URL: str = "http://payment-service:9000"
    INTERNAL_API_KEY: str = "internal_api_key_placeholder"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

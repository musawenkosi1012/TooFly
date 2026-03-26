from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Paynow
    PAYNOW_INTEGRATION_ID: str
    PAYNOW_INTEGRATION_KEY: str
    PAYNOW_RETURN_URL: str
    PAYNOW_RESULT_URL: str

    # Core Service
    CORE_SERVICE_URL: str
    INTERNAL_API_KEY: str

    PROJECT_NAME: str = "TooFly Payment Service"
    PROJECT_VERSION: str = "1.0.0"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Paynow (Safe placeholder defaults)
    PAYNOW_INTEGRATION_ID: str = ""
    PAYNOW_INTEGRATION_KEY: str = ""
    PAYNOW_RETURN_URL: str = "http://localhost:3000/success"
    PAYNOW_RESULT_URL: str = ""

    # Core Service (Safe placeholder defaults)
    CORE_SERVICE_URL: str = "http://localhost:8000"
    INTERNAL_API_KEY: str = "UNSET_INTERNAL_KEY"

    PROJECT_NAME: str = "TooFly Payment Service"
    PROJECT_VERSION: str = "1.0.0"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

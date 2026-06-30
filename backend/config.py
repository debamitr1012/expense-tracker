from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./expensetracker.db"

    jwt_key: str = "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARS_LONG_123!"
    jwt_issuer: str = "ExpenseTrackerApi"
    jwt_audience: str = "ExpenseTrackerClient"
    jwt_expiry_minutes: int = 1440

    cors_allowed_origin: str = "http://localhost:5173"


settings = Settings()

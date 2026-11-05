"""
Application configuration management using Pydantic Settings.
Reads environment variables from .env file or host environment.
"""

from pydantic import ValidationError, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FRONTEND_URL: str = "http://localhost:5173"
    GEMINI_API_KEY: str = ""
    ENVIRONMENT: str = "development"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def validate_database_url(cls, value: str) -> str:
        if not isinstance(value, str) or not value.strip():
            raise ValueError("DATABASE_URL must be explicitly configured.")
        return value.strip()

    @field_validator("JWT_SECRET_KEY", mode="before")
    @classmethod
    def validate_jwt_secret(cls, value: str) -> str:
        if not isinstance(value, str):
            raise ValueError("JWT_SECRET_KEY must be configured with a strong random secret.")

        secret = value.strip()
        placeholder_prefixes = ("replace_with_", "change_this_", "your_")
        if (
            len(secret) < 32
            or secret.casefold().startswith(placeholder_prefixes)
            or secret.casefold() in {"secret", "changeme"}
        ):
            raise ValueError("JWT_SECRET_KEY must be a non-placeholder secret of at least 32 characters.")
        return secret

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


try:
    settings = Settings()
except ValidationError as exc:
    jwt_secret_invalid = any(
        "JWT_SECRET_KEY" in error.get("loc", ())
        for error in exc.errors(include_input=False)
    )
    if jwt_secret_invalid:
        raise RuntimeError(
            "FastAPI startup blocked: JWT_SECRET_KEY must be explicitly configured with "
            "a non-placeholder secret of at least 32 characters."
        ) from None
    raise RuntimeError(
        "FastAPI startup blocked: configuration is invalid. Check environment variable "
        "names and formats without logging their values."
    ) from None

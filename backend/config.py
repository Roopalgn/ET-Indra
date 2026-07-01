"""
INDRA Backend — Configuration
Reads from environment variables / .env file.
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = ""  # e.g. postgresql+asyncpg://user:pass@host/db

    # CORS — comma-separated list of allowed origins
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:4173"

    # Data mode: "live" attempts AISstream; "synthetic" skips it entirely
    DATA_MODE: str = "synthetic"

    # AISstream
    AISSTREAM_API_KEY: str = ""

    # EIA
    EIA_API_KEY: str = ""

    # Claude
    ANTHROPIC_API_KEY: str = ""

    # Environment label shown in API responses
    ENVIRONMENT: str = "development"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v: str) -> str:
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()

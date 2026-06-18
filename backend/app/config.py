"""Application configuration loaded from environment variables.

No credentials are hard-coded; every value can be overridden via the
environment (see .env.example and docker-compose.yml).
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Full SQLAlchemy database URL, e.g.
    # postgresql+psycopg://user:password@host:5432/dbname
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/inventory"

    # Comma-separated list of origins allowed by CORS, or "*" for all.
    cors_origins: str = "*"

    app_name: str = "Inventory & Order Management API"

    # Products at or below this stock level are flagged "low stock" on the dashboard.
    low_stock_threshold: int = 10

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

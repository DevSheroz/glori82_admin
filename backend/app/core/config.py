from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str

    model_config = {"env_file": ".env"}

    @property
    def async_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgresql://") and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url


settings = Settings()

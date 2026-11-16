from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://prodexa:prodexa@localhost:5432/prodexa"
    redis_url: str = "redis://localhost:6379/0"
    github_client_id: str = ""
    github_client_secret: str = ""
    github_webhook_secret: str = ""
    session_secret: str = "change-me"
    embedder: str = "hashing"  # "hashing" (lexical, no download) or "minilm" (needs requirements-ml.txt)
    model_dir: str = "models"
    frontend_url: str = "http://localhost:5173"
    github_api_url: str = "https://api.github.com"


settings = Settings()

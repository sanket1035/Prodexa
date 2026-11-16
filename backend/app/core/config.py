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
    environment: str = "development"  # "production" turns on strict startup checks
    cookie_secure: bool = False  # forced on in production
    rate_limit_per_minute: int = 30  # per user (or IP) on expensive endpoints
    celery_eager: bool = False  # run tasks inline (tests only)
    job_max_retries: int = 5
    workspace_dir: str = "workspace"  # where repository history clones are kept
    history_depth: int = 500
    git_base_url: str = "https://github.com"
    model_dir: str = "models"
    frontend_url: str = "http://localhost:5173"
    github_api_url: str = "https://api.github.com"


settings = Settings()

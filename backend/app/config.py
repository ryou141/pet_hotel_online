from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://pawhotel:pawhotel_secret@localhost:5432/pawhotel"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    FIRST_ADMIN_EMAIL: str = "admin@pawhotel.ru"
    FIRST_ADMIN_PASSWORD: str = "admin123"
    SMTP_HOST: str = ""
    SMTP_PORT: str = "587"
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""

    class Config:
        env_file = ".env"


settings = Settings()

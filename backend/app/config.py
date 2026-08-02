# config.py
# Handles all environment variable loading for the app.
# Using pydantic-settings here because it gives us type validation
# on env vars for free — caught a bug early where JWT_EXPIRY_HOURS
# was being read as string instead of int.

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str

    # JWT Auth
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expiry_hours: int = 24

    # AWS
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket_name: str = ""

    # App
    environment: str = "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Using lru_cache so we don't re-read the .env file on every request.
# Settings object is created once and reused throughout the app lifecycle.
@lru_cache()
def get_settings() -> Settings:
    return Settings()
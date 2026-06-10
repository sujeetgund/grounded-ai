from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    # Databases
    DATABASE_URL: str
    REDIS_URL: str
    
    # CORS
    ALLOWED_ORIGINS: List[str]
    
    # AWS S3
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION_NAME: str
    AWS_S3_BUCKET_NAME: str
    
    # API Keys
    HF_TOKEN: str
    GROQ_API_KEY: str

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()

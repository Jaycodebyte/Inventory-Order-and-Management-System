from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Inventory & Order Management System"
    API_V1_STR: str = "/api"
    
    # Database Settings
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "inventory_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: str = "5432"
    
    DATABASE_URL: str = ""

    # Secret Key for potential token signing/auth extension
    SECRET_KEY: str = "your-super-secret-key-change-it-in-production"
    
    # CORS Origins (JSON array in env)
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
    }

    def get_db_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        
        postgres_host = self.POSTGRES_HOST
        if postgres_host and postgres_host != "localhost":
            return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            
        return "sqlite:///./inventory_db.sqlite"

settings = Settings()

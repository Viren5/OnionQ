import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables or .env file."""

    # Model settings
    YOLO_MODEL_PATH: str = "models/onion_best.pt"
    YOLO_CONFIDENCE_THRESHOLD: float = 0.25
    YOLO_IMAGE_SIZE: int = 640
    YOLO_DEVICE: str = "cpu"

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8001

    # Security & limits
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3001"
    MAX_UPLOAD_SIZE_MB: int = 15

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list of strings."""
        if not self.CORS_ORIGINS or self.CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def max_upload_size_bytes(self) -> int:
        """Convert MAX_UPLOAD_SIZE_MB to bytes."""
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def resolved_model_path(self) -> Path:
        """Resolve model path relative to project root or as absolute path."""
        path = Path(self.YOLO_MODEL_PATH)
        if not path.is_absolute():
            # If relative, check if path exists relative to current working dir or service root
            return path.resolve()
        return path


settings = Settings()

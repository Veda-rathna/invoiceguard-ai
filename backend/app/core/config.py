import os
from typing import List, Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "InvoiceGuard AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # AWS Bedrock Configuration
    AWS_REGION: str = "us-east-1"
    BEDROCK_MODEL_ID: str = "qwen.qwen3-vl-235b-a22b"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_SESSION_TOKEN: Optional[str] = None
    
    # Offline Demo Mode
    DEMO_MODE: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./invoiceguard.db"
    
    # Uploads
    UPLOAD_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../uploads"))
    MAX_UPLOAD_SIZE_MB: int = 15
    ALLOWED_EXTENSIONS: List[str] = [".png", ".jpg", ".jpeg", ".pdf", ".tiff", ".webp"]
    
    # Default Policy Engine Thresholds (Currency values in ₹/$)
    AUTO_APPROVAL_LIMIT: float = 50000.0
    PO_REQUIRED_ABOVE: float = 10000.0
    MAXIMUM_PO_VARIANCE_PERCENT: float = 5.0
    NEW_VENDOR_REQUIRES_REVIEW: bool = True
    DUPLICATE_SIMILARITY_THRESHOLD: float = 90.0
    MINIMUM_EXTRACTION_CONFIDENCE: float = 75.0
    RECEIPT_REQUIRED_ABOVE: float = 2000.0
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000", "*"]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

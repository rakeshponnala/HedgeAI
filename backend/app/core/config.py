import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application configuration settings."""

    # API Keys
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")

    # AI Model Configuration
    AI_MODEL_NAME: str = os.getenv("AI_MODEL_NAME", "claude-sonnet-4-5-20250929")
    AI_MAX_TOKENS: int = int(os.getenv("AI_MAX_TOKENS", "400"))
    AI_TEMPERATURE: float = float(os.getenv("AI_TEMPERATURE", "0.2"))

    # API Configuration
    API_TITLE: str = "HedgeAI API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "AI-powered contrarian stock risk analysis"

    # CORS Configuration
    CORS_ORIGINS: list = ["*"]  # Restrict in production

    # News Configuration
    NEWS_MAX_RESULTS: int = int(os.getenv("NEWS_MAX_RESULTS", "3"))


settings = Settings()

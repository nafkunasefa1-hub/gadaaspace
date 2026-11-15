"""
RAD-ARES: Centralized Configuration & Multi-Key Secret Manager
Loads all environment variables from .env via python-dotenv with strict validation.
Zero hardcoded secrets in application logic.
"""

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Deterministically locate and load the root .env file
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE_PATH = ROOT_DIR / ".env"
load_dotenv(dotenv_path=ENV_FILE_PATH, override=False)


class Settings(BaseSettings):
    """
    Production configuration schema for RAD-ARES Microservice & AI Orchestrator.
    Automatically binds environment variables and manages the 5-key Gemini rotation pool.
    """

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE_PATH),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- Server & Deployment Configuration ---
    PROJECT_NAME: str = "GadaSpace (Team Horizon-X): Multi-Detector Radiation Analysis, Data Fusion, 3D Shielding & Prediction System"
    TEAM_NAME: str = "Horizon-X"
    VERSION: str = "4.0.0"
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=True)
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8000)
    API_PREFIX: str = Field(default="/api/v1")
    BACKEND_URL: str = Field(default="http://localhost:8000")
    CORS_ORIGINS: str = Field(
        default='["http://localhost:3000","http://localhost:8501","http://127.0.0.1:8501"]'
    )

    # --- Google AI Studio (Gemini) Multi-Key High-Availability Pool ---
    GEMINI_API_KEY: str = Field(default="")
    GEMINI_API_KEY_1: str = Field(default="")
    GEMINI_API_KEY_2: str = Field(default="")
    GEMINI_API_KEY_3: str = Field(default="")
    GEMINI_API_KEY_4: str = Field(default="")
    GEMINI_API_KEY_5: str = Field(default="")
    GEMINI_MODEL: str = Field(default="gemini-2.5-flash")

    # --- NASA-STD-3001 & Empirical Radiation Baselines ---
    NASA_PEL_CAREER_MSV: float = Field(default=250.0)
    NASA_LEGACY_CAREER_MSV: float = Field(default=600.0)
    ARS_PRODROMAL_THRESHOLD_MSV: float = Field(default=500.0)
    LUNAR_SURFACE_ANNUAL_DOSE_MSV: float = Field(default=400.0)
    MARTIAN_SURFACE_ANNUAL_DOSE_MSV: float = Field(default=270.0)

    def get_cors_origins_list(self) -> List[str]:
        """Safely parses the CORS_ORIGINS environment variable into a Python list."""
        raw = self.CORS_ORIGINS.strip()
        if not raw:
            return ["*"]
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return [str(item) for item in parsed]
        except json.JSONDecodeError:
            pass
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    def get_api_key_pool(self) -> List[str]:
        """
        Aggregates and deduplicates all configured Gemini API keys into a failover pool.
        Allows seamless round-robin rotation and automatic rate-limit recovery.
        """
        candidates = [
            os.getenv("GEMINI_API_KEY", self.GEMINI_API_KEY),
            os.getenv("GEMINI_API_KEY_1", self.GEMINI_API_KEY_1),
            os.getenv("GEMINI_API_KEY_2", self.GEMINI_API_KEY_2),
            os.getenv("GEMINI_API_KEY_3", self.GEMINI_API_KEY_3),
            os.getenv("GEMINI_API_KEY_4", self.GEMINI_API_KEY_4),
            os.getenv("GEMINI_API_KEY_5", self.GEMINI_API_KEY_5),
        ]
        valid_keys: List[str] = []
        placeholder_tokens = {
            "",
            "your_gemini_api_key_here",
            "your_primary_gemini_api_key_here",
            "your_gemini_api_key_1_here",
            "your_gemini_api_key_2_here",
            "your_gemini_api_key_3_here",
            "your_gemini_api_key_4_here",
            "your_gemini_api_key_5_here",
        }
        for key in candidates:
            cleaned = (key or "").strip()
            if cleaned and cleaned not in placeholder_tokens and cleaned not in valid_keys:
                valid_keys.append(cleaned)
        return valid_keys


@lru_cache()
def get_settings() -> Settings:
    """Returns a cached singleton instance of application settings."""
    return Settings()


settings = get_settings()

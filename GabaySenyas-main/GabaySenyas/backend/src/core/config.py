"""Environment-backed settings. Never hardcode secrets.

Rating thresholds here are only *defaults*; the live values are stored in the
`system_settings` table and are editable by an admin. They are prototype
defaults, not validated standards.
"""
import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


def _bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes"}


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./gabaysenyas.db")
    jwt_secret: str = os.getenv("JWT_SECRET", "change-me")
    model_path: str = os.getenv("MODEL_PATH", "../ml/models/current")
    store_landmarks: bool = _bool("STORE_LANDMARKS", False)
    rating_correct_min: float = float(os.getenv("RATING_CORRECT_MIN", "80"))
    rating_partial_min: float = float(os.getenv("RATING_PARTIAL_MIN", "50"))
    confidence_min: float = float(os.getenv("CONFIDENCE_MIN", "0.7"))
    max_sequence_frames: int = 240  # ~8 s at 30 fps


settings = Settings()

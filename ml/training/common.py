"""Shared paths and helpers for the ml/ scripts.

Imports the backend's preprocessing so training and inference use one implementation.
"""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ML_DIR = ROOT / "ml"
DATA_DIR = ML_DIR / "data"
LANDMARKS_DIR = DATA_DIR / "landmarks"   # <LABEL>/<sample_id>.json  (the training input)
REPORTS_DIR = DATA_DIR / "reports"
MODELS_DIR = ML_DIR / "models"

sys.path.insert(0, str(ROOT / "backend"))
from src.modules.recognition import preprocessing as pp  # noqa: E402

HAND_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
    "hand_landmarker/float16/1/hand_landmarker.task"
)
HAND_MODEL_PATH = MODELS_DIR / "mediapipe" / "hand_landmarker.task"


def ensure_hand_model() -> Path:
    """Download MediaPipe's hand landmarker model once (same model the browser uses)."""
    if not HAND_MODEL_PATH.is_file():
        HAND_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        print(f"Downloading hand landmarker model -> {HAND_MODEL_PATH}")
        urllib.request.urlretrieve(HAND_MODEL_URL, HAND_MODEL_PATH)
    return HAND_MODEL_PATH


def create_hand_landmarker(mode: str = "IMAGE", num_hands: int = 2, min_conf: float = 0.5):
    from mediapipe.tasks import python as mp_tasks
    from mediapipe.tasks.python import vision

    options = vision.HandLandmarkerOptions(
        base_options=mp_tasks.BaseOptions(model_asset_buffer=ensure_hand_model().read_bytes()),
        running_mode=getattr(vision.RunningMode, mode),
        num_hands=num_hands,
        min_hand_detection_confidence=min_conf,
        min_hand_presence_confidence=min_conf,
        min_tracking_confidence=min_conf,
    )
    return vision.HandLandmarker.create_from_options(options)


def mp_image(rgb):
    import mediapipe as mp

    return mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)


def hands_from_result(result) -> list[dict]:
    """MediaPipe result -> the 'hands' list of the project's sequence format."""
    hands = []
    for lms, handed in zip(result.hand_landmarks, result.handedness):
        hands.append({
            "handedness": handed[0].category_name.lower(),
            "score": round(float(handed[0].score), 4),
            "landmarks": [
                {"x": round(p.x, 5), "y": round(p.y, 5), "z": round(p.z, 5)} for p in lms
            ],
        })
    return hands


def save_sample(label: str, sample_id: str, seq: dict, root: Path = LANDMARKS_DIR) -> Path:
    path = root / label / f"{sample_id}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(seq, separators=(",", ":")), encoding="utf-8")
    return path

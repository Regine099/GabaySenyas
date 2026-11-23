"""DEV ONLY: live recognition for the frontend camera test page.

The API contract (docs/API_CONTRACTS.md §8) keeps recognition private; in the
real flow only the attempt service calls it. Until attempts exist, this route
lets the frontend try the trained model live. It is mounted only when
DEV_RECOGNITION=true and must stay off in any deployed environment.
Nothing is stored: the sequence is predicted on and discarded.
"""
from __future__ import annotations

from functools import lru_cache

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from src.core.config import settings

from . import preprocessing as pp
from .recognition_service import ModelUnavailable, RecognitionModel

router = APIRouter(prefix="/api/v1/dev", tags=["dev"])


class Point(BaseModel):
    x: float = Field(ge=-1, le=2)
    y: float = Field(ge=-1, le=2)
    z: float = Field(ge=-2, le=2)


class Hand(BaseModel):
    handedness: str = Field(max_length=10)
    landmarks: list[Point] = Field(min_length=21, max_length=21)


class Frame(BaseModel):
    t_ms: float
    hands: list[Hand] = Field(max_length=2)


class FrameSize(BaseModel):
    width: float = Field(gt=0)
    height: float = Field(gt=0)


class Sequence(BaseModel):
    frame_size: FrameSize | None = None
    frames: list[Frame] = Field(min_length=1, max_length=settings.max_sequence_frames)


def _error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error": {"code": code, "message": message}})


@lru_cache(maxsize=1)
def get_model() -> RecognitionModel:
    return RecognitionModel(settings.model_path)


@router.post("/recognize")
def recognize(seq: Sequence):
    try:
        model = get_model()
    except ModelUnavailable as e:
        get_model.cache_clear()  # retry on the next request, e.g. after training finishes
        return _error(503, "MODEL_UNAVAILABLE", str(e))
    try:
        preds = model.predict(seq.model_dump(), top_k=3)
    except pp.NoHandsDetected:
        return _error(422, "NO_HANDS_DETECTED", "Keep your hand inside the camera frame.")
    return {
        "data": {
            "model_version": model.version,
            "confidence_min": settings.confidence_min,
            "predictions": [{"label": p.label, "confidence": p.confidence} for p in preds],
        }
    }

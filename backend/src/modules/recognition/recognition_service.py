"""Sequence-model inference.

Loads an exported model folder (model.onnx + meta.json, produced by
ml/training/train.py) and predicts the sign for a landmark sequence.
Only onnxruntime is needed here; torch stays in ml/.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from . import preprocessing as pp


class ModelUnavailable(RuntimeError):
    """The model files are missing or incompatible (maps to MODEL_UNAVAILABLE / 503)."""


@dataclass(frozen=True)
class Prediction:
    label: str
    confidence: float


class RecognitionModel:
    def __init__(self, model_dir: str | Path):
        model_dir = Path(model_dir)
        meta_path, onnx_path = model_dir / "meta.json", model_dir / "model.onnx"
        if not meta_path.is_file() or not onnx_path.is_file():
            raise ModelUnavailable(f"no model.onnx/meta.json in {model_dir}")
        self.meta = json.loads(meta_path.read_text(encoding="utf-8"))
        if self.meta.get("preprocessing_version") != pp.PREPROCESSING_VERSION:
            raise ModelUnavailable(
                f"model uses preprocessing v{self.meta.get('preprocessing_version')}, "
                f"code is v{pp.PREPROCESSING_VERSION}; re-train the model"
            )
        import onnxruntime as ort

        self.session = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"])
        self.input_name = self.session.get_inputs()[0].name
        self.classes: list[str] = self.meta["classes"]
        self.version: str = self.meta["version"]
        self.seq_len: int = int(self.meta["input"]["T"])

    def predict(self, seq: dict, top_k: int = 3) -> list[Prediction]:
        """Top-k predictions, most likely first. Raises pp.NoHandsDetected."""
        x = pp.preprocess_for_model(seq, self.seq_len)[None]
        probs = self.session.run(None, {self.input_name: x})[0][0]
        order = np.argsort(probs)[::-1][:top_k]
        return [Prediction(self.classes[i], float(probs[i])) for i in order]

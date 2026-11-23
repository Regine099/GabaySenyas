from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.core.config import settings
from src.modules.recognition.dev_routes import router
from tests.test_preprocessing import make_hand, to_seq

app = FastAPI()
app.include_router(router)
client = TestClient(app)

has_model = (Path(settings.model_path) / "model.onnx").is_file()


@pytest.mark.skipif(not has_model, reason="no trained model at MODEL_PATH")
def test_recognize_returns_top3():
    seq = to_seq([make_hand(i) for i in range(30)], {"width": 640, "height": 480})
    r = client.post("/api/v1/dev/recognize", json=seq)
    assert r.status_code == 200
    data = r.json()["data"]
    assert len(data["predictions"]) == 3
    assert 0 <= data["predictions"][0]["confidence"] <= 1


@pytest.mark.skipif(not has_model, reason="no trained model at MODEL_PATH")
def test_no_hands():
    r = client.post("/api/v1/dev/recognize", json=to_seq([None] * 10))
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "NO_HANDS_DETECTED"


def test_rejects_bad_landmarks():
    seq = {"frames": [{"t_ms": 0, "hands": [{"handedness": "right", "landmarks": [{"x": 0, "y": 0, "z": 0}]}]}]}
    assert client.post("/api/v1/dev/recognize", json=seq).status_code == 422

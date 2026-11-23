"""GabaySenyas backend entry point.

Implementation should follow the domain boundaries documented in docs/.
"""
from fastapi import FastAPI

from src.core.config import settings

app = FastAPI(title="GabaySenyas API", version="0.1.0")

if settings.dev_recognition:
    from src.modules.recognition.dev_routes import router as dev_recognition_router

    app.include_router(dev_recognition_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "gabaysenyas-backend"}

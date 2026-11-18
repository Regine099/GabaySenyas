"""GabaySenyas backend entry point.

Implementation should follow the domain boundaries documented in docs/.
"""
from fastapi import FastAPI

app = FastAPI(title="GabaySenyas API", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "gabaysenyas-backend"}

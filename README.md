# GabaySenyas

**GabaySenyas: A Computer Vision and Sequence-Based Machine Learning System for Filipino Sign Language Recognition, Performance Analytics, and Adaptive Learning**

GabaySenyas is a SOFE311 prototype: a web app that teaches Filipino Sign Language (FSL) and checks a learner's signing in real time with a webcam. The learner watches a lesson, performs the sign, and the system recognizes it, scores it against a validated reference, and gives tips to fix mistakes. Lessons adapt to performance and progress is tracked over time.

## Repository Layout

- `frontend/` — React UI (learner + admin) and in-browser webcam/landmark capture
- `backend/` — FastAPI API: auth, lessons, recognition, scoring, feedback, adaptive rules, progress, analytics
- `ml/` — data-collection notes, training code, and exported sequence models
- `docs/` — project documentation and specifications
- `seed/` — lessons, signs, and feedback tips for import/initialization

## Scope

See `docs/SCOPE.md` (the scope authority). In short: desktop/laptop web app, FSL only, specific lesson signs only (no sentences), hand and arm movement only (no facial expressions), does not replace certified FSL teachers.

## How It Works

```text
I.   Learn the sign         watch a demo video/image
II.  Capture the attempt    webcam in the browser
III. Detect hand landmarks  video → sequence of coordinates
IV.  Recognize the sign     sequence model predicts the sign
V.   Score the attempt      compare with validated reference → correct / partially correct / incorrect
VI.  Give feedback          tip on hand position, motion direction, or speed
VII. Track progress         scores and attempts saved; analytics for administrators
```

## Architecture

```text
frontend/ (React + webcam + landmark extraction)
        ↓ landmark sequence (no video)
backend/ (FastAPI REST API)
        ↓
recognition → scoring → feedback → progress/adaptive
        ↓
SQLite + SQLAlchemy  (+ trained model files from ml/)
```

Raw video never leaves the browser. The frontend must not contain business rules that belong to the backend.

## Run (local)

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env         # then fill in values (macOS/Linux: cp)
uvicorn main:app --reload
```

Health check: `http://127.0.0.1:8000/health`

Frontend: see `frontend/README.md` (one-time Vite setup).

ML (recording, training, live demo):

```powershell
powershell -ExecutionPolicy Bypass -File ml\setup.ps1   # once
ml\.venv\Scripts\activate
python ml/training/webcam.py record --label A --signer S01
```

See `ml/README.md` for the full recording and training workflow.

## Read the Documentation

Start with `docs/README.md` for the reading order.

## Contributing

See `docs/DEVELOPMENT_RULES.md` (branches, pull requests, commit messages, privacy, secrets).

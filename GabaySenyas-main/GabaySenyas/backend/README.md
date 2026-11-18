# GabaySenyas Backend

The server side of GabaySenyas.

## Responsibilities

- Authentication and authorization (learner, admin)
- Lesson and sign catalog, FSL review gate
- Validation of incoming landmark sequences
- Sign recognition (sequence model inference)
- Scoring against validated reference sequences, and rating
- Feedback tips
- Adaptive rules (sign status, lesson unlock, recommendations)
- Attempt history and progress
- Analytics for administrators
- `/admin/*` APIs (implemented inside the owning modules)

## Stack

- Python, FastAPI, SQLAlchemy, SQLite (prototype), NumPy
- Sequence model trained in `ml/` and loaded from `MODEL_PATH`

## Domain Modules

```text
src/modules/
├── auth/         login, register, tokens
├── users/        profiles, roles, accounts, settings
├── lessons/      lesson catalog, difficulty order
├── signs/        sign catalog, media, review status, reference sequences
├── recognition/  preprocessing + model inference (no routes)
├── scoring/      alignment, score, rating (no routes)
├── feedback/     deviations → tips (no routes)
├── adaptive/     sign status, unlock, recommendations (no routes)
├── progress/     attempt orchestration, history, progress views
└── analytics/    admin aggregates
```

Follow `docs/TECHNICAL_ARCHITECTURE.md`, `docs/SYSTEM_MAP.md`, and `docs/API_CONTRACTS.md` before implementing a module.

## Layout

```text
backend/
├── main.py
├── requirements.txt
├── .env.example
├── tests/
└── src/
    ├── core/        config.py, database.py, security.py
    └── modules/     (domain modules above)
```

Run: `uvicorn main:app --reload` from inside `backend/`.
Tests: `pytest` from inside `backend/`.

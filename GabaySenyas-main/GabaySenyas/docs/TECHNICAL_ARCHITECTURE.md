# GabaySenyas — Technical Architecture

> Items marked **(suggested)** or **(prototype default)** are proposals that the team should confirm or benchmark. The proposal fixes the *approach* (webcam → landmarks → sequence model → reference scoring → feedback), not the specific libraries.

## 1. Architecture Decision

| Layer | Technology / Responsibility |
|---|---|
| Frontend | React + TypeScript + Vite + React Router + Tailwind CSS (`frontend/`) |
| Webcam + landmarks (in browser) | `getUserMedia` + a hand-tracking library, e.g. MediaPipe Hand Landmarker plus Pose Landmarker for arm/shoulder keypoints **(suggested)** |
| Backend | Python + FastAPI (`backend/`) |
| Database | SQLite (prototype), relational schema so it can move to PostgreSQL |
| ORM | SQLAlchemy |
| Recognition model | Sequence classifier (LSTM / GRU / 1D-CNN / Transformer encoder — benchmark and choose) trained in `ml/`, served by the backend |
| Scoring | Sequence alignment (Dynamic Time Warping) against validated reference sequences |
| API | REST under `/api/v1` |

## 2. Architecture Flow

```text
Browser
  ├── Webcam stream (never leaves the browser)
  └── Landmark extraction → landmark sequence (JSON)
        ↓  POST /api/v1/signs/{id}/attempts
FastAPI
  ├── recognition  → predicted sign + confidence
  ├── scoring      → similarity score + per-dimension deviations
  ├── feedback     → tips
  ├── progress     → save attempt, update sign status
  └── adaptive     → next recommendation
        ↓
SQLite  (+ model files from ml/models/)
```

### Why landmarks are extracted in the browser

- **Privacy:** raw video is never uploaded or stored.
- **Latency/bandwidth:** only ~a few KB of coordinates per attempt.
- **Real-time overlay:** the learner sees landmarks drawn on their own video immediately.

## 3. Repository Layout

```text
GabaySenyas/
├── frontend/          (UI + in-browser capture/landmark extraction)
├── backend/
│   ├── main.py        (FastAPI entry: `uvicorn main:app --reload`)
│   ├── requirements.txt
│   ├── .env.example
│   ├── tests/
│   └── src/
│       ├── core/      config.py, database.py, security.py
│       └── modules/
│           auth/ users/ lessons/ signs/ recognition/ scoring/
│           feedback/ adaptive/ progress/ analytics/
├── ml/                (data collection notes, training code, exported models)
├── seed/              (lessons, signs, feedback tips)
└── docs/
```

Each module may contain `<module>_router.py`, `<module>_service.py`, `<module>_schema.py`, `<module>_model.py`. Not every module needs every file. There is **no generic `admin` module**: admin endpoints live under `/api/v1/admin/*`, are implemented in the module that owns the data, and use the `admin` role guard.

## 4. Request Processing Rule

```text
HTTP Request → Router → Schema Validation → Service → DB / Model → Response Schema → HTTP Response
```

Routers stay thin. Recognition, scoring, rating, feedback selection, and progress/adaptive rules belong in services.

## 5. Landmark Sequence Format

Captured by the frontend, validated by the backend.

```json
{
  "fps": 30,
  "frames": [
    {
      "t_ms": 0,
      "hands": [
        { "handedness": "right", "landmarks": [ {"x":0.51,"y":0.62,"z":-0.03}, "... 21 points ..." ] }
      ],
      "pose": [ {"x":0.50,"y":0.40,"z":-0.10,"visibility":0.98}, "... selected upper-body points ..." ]
    }
  ]
}
```

- 21 landmarks per hand (wrist, knuckles, fingertips), 0–2 hands per frame.
- `pose` carries the upper-body keypoints needed for **arm** tracking (shoulders, elbows, wrists) **(suggested)**.
- Frames with no detected hand are sent with an empty `hands` list.
- Limits: max 8 seconds / 240 frames per attempt (prototype default).

### Preprocessing (shared by training, reference recording, and inference)

One implementation, used everywhere, so training and inference never drift apart.

1. Trim leading/trailing frames with no hands.
2. Normalize: translate to the shoulder midpoint, scale by shoulder width (so camera distance and learner body size matter less).
3. Handedness: keep left/right slots; optionally mirror to support left-handed signers (**decision needed**: confirm with FSL teachers whether handedness mirroring is valid for the in-scope signs).
4. Interpolate short gaps; resample to a fixed length `T` (default 32 frames) for the classifier. The scorer keeps the un-resampled, time-aligned sequence so speed can be measured.
5. Feature vector per frame: both hands (2 × 21 × 3) + selected pose points (prototype default).

## 6. Recognition (`recognition` module)

- Input: preprocessed fixed-length sequence.
- Output: `predicted_sign_id`, `confidence`, and top-k alternatives.
- Closed set: the model only knows the signs in the lesson library. Low confidence on every class means "not recognized" — it must **not** be presented as a confident wrong sign.
- Models are versioned (`recognition_models`). The version used is stored on each attempt.
- The trained model file lives in `ml/models/` and is loaded at startup (path from `core/config.py`).

## 7. Scoring (`scoring` module)

Compare the learner's sequence with the **validated reference sequence(s)** of the **target** sign (not the predicted sign).

1. Align with DTW over the feature vectors.
2. Convert alignment distance to a 0–100 similarity score (monotonic mapping, calibrated; prototype default `score = 100 · exp(−distance / τ)`).
3. If several validated references exist (different signers), use the best-matching one.
4. Apply the rating rule from `USER_WORKFLOWS.md` §3.

| Rating | Prototype default |
|---|---|
| `correct` | score ≥ 80 and recognized sign = target |
| `partially_correct` | score ≥ 50 |
| `incorrect` | otherwise, or a different sign recognized with confidence ≥ 0.7 |

Thresholds are stored in `system_settings` and are **not validated standards**. They must be calibrated against FSL teacher ratings (see `VALIDATION_AND_RISKS.md`).

## 8. Feedback (`feedback` module)

The scorer returns per-dimension deviations after alignment:

| Dimension | What is measured | Example tip |
|---|---|---|
| `hand_position` | Mean offset of hand/wrist relative to the shoulder frame (up/down/left/right/nearer/farther) | "Raise your hand higher." |
| `motion_direction` | Direction of the wrist/hand path vs. reference (cosine similarity of movement vectors) | "Move your hand toward your left, not straight down." |
| `speed` | Duration of the active signing segment, learner ÷ reference (default: > 1.3 too slow, < 0.7 too fast) | "Slow down the movement." |

The service picks the 1–2 dimensions with the largest normalized deviation and maps each (dimension + direction) to a tip in the **reviewed tip catalog** (`feedback_tips`). Hand-shape (finger-pose) feedback is a possible extension; the proposal lists hand position, motion direction, and speed.

## 9. Adaptive Learning (`adaptive` module)

Rule-based and explainable (prototype). Inputs: `learner_sign_progress`, lesson difficulty, recent ratings. Outputs: sign status, lesson unlock, and a recommendation (retry / replay demo / next sign / next lesson / review weakest sign). Rules and defaults are in `USER_WORKFLOWS.md` §5. A learned (ML) adaptive policy is **not** part of the prototype.

## 10. Core Data Model

### users
`id, name, email, password_hash, role, is_active, created_at`
Roles: `learner`, `admin`. Registration always creates `learner`. The first admin is seeded. `is_active = false` blocks login.

### lessons
`id, title, description, difficulty_level, order_index, review_status, created_at`

### signs
`id, lesson_id, gloss, meaning_en, description, demo_media_url, difficulty, order_index, review_status, created_at`
`review_status`: `draft` | `in_review` | `approved` | `rejected`. Only `approved` signs are shown to learners.

### sign_reviews
`id, sign_id, reviewer_name, reviewer_credential, status, notes, reviewed_at, recorded_by`
Records the FSL teacher/professional approval.

### reference_sequences
`id, sign_id, version, signer_label, sequence_path_or_json, num_frames, fps, is_active, validated_by_review_id, created_at`

### recognition_models
`id, version, architecture, classes_json, metrics_json, file_path, is_active, trained_at`

### attempts
```text
id, learner_id, sign_id, num_frames, duration_ms,
predicted_sign_id, confidence, similarity_score, rating,
model_version, reference_sequence_id, created_at
```
`rating`: `correct` | `partially_correct` | `incorrect`.
The landmark sequence is stored only if `STORE_LANDMARKS=true` (useful for improving the model; needs learner consent — see Privacy). Default: off.

### attempt_feedback
`id, attempt_id, dimension, direction, deviation, tip_id`

### feedback_tips
`id, dimension, direction, message, review_status`

### learner_sign_progress
`id, learner_id, sign_id, status, attempts_count, correct_count, best_score, recent_avg, last_attempt_at, updated_at`
Unique on (learner_id, sign_id). `status`: `not_started` | `in_progress` | `needs_practice` | `mastered`.

### system_settings
`key, value_json, updated_by, updated_at`
Keys: `rating_thresholds` (`correct_min`, `partial_min`), `confidence_min`, `speed_ratio_bounds`, `lesson_unlock_percent`.

### audit_logs
`id, actor_id, action, entity_type, entity_id, metadata_json, created_at`
Log: login, account create/deactivate, content create/edit, review recorded, reference activated, settings change.

## 11. API Organization and Module Ownership

All endpoints use `/api/v1`. Contracts are in `API_CONTRACTS.md`.

| Route group | Implemented in module |
|---|---|
| `/auth/*` | `auth` |
| `/me` | `users` |
| `/lessons/*` | `lessons` |
| `/signs/*` (view) | `signs` |
| `/signs/{id}/attempts` | `progress` (orchestrates `recognition` → `scoring` → `feedback` → `adaptive`) |
| `/progress/*`, `/recommendations/me` | `progress`, `adaptive` |
| `/admin/analytics/*` | `analytics` |
| `/admin/lessons/*`, `/admin/signs/*`, `/admin/reference-sequences/*`, `/admin/sign-reviews/*`, `/admin/feedback-tips/*` | owning module |
| `/admin/users/*`, `/admin/settings` | `users` |

`recognition`, `scoring`, `feedback` and `adaptive` have **no public routes**. They are called by the attempt service.

## 12. Authentication and Permissions

| Capability | Learner | Admin |
|---|:---:|:---:|
| Own profile | ✓ | ✓ |
| View approved lessons/signs | ✓ | ✓ (incl. drafts) |
| Submit attempts | ✓ | Preview |
| View own progress | ✓ | ✓ |
| View other learners' data | — | ✓ (analytics/drill-down) |
| Manage lessons, signs, references, tips, reviews | — | ✓ |
| Manage accounts and settings | — | ✓ |

A learner must never read another learner's data by changing an ID. Prefer `/me` endpoints.

## 13. Privacy and Data Handling

- **No raw video leaves the browser.** Only landmark coordinates are sent.
- Landmarks can still be personal data. Do not store them by default; if kept for model improvement, ask for explicit consent and record it.
- Collecting training/reference data from signers requires informed consent. Consider the Philippine Data Privacy Act of 2012 (RA 10173) and confirm requirements with the adviser/school.
- Never log passwords, tokens, or keys.

## 14. Performance Targets (to verify)

| Item | Target (prototype) |
|---|---|
| Live landmark overlay | ≥ 15 FPS on a typical laptop |
| Attempt submit → result | ≤ 2 s |
| Payload per attempt | < 500 KB |

## 15. Implementation Priorities

1. Auth (register/login) and roles.
2. Lessons and signs (seeded, review-gated).
3. Webcam capture + landmark overlay in the frontend (no backend needed).
4. Preprocessing module shared by `ml/` and `backend/`.
5. Reference sequences + scoring (DTW) for 3–5 signs.
6. Recognition model on the same small sign set.
7. Attempt endpoint: recognize → score → rate → save.
8. Feedback tips.
9. Progress + adaptive rules.
10. Analytics module (admin).
11. Content expansion and FSL teacher review.

First demonstrable slice: **Watch → Sign → Landmarks → Score → Rating + Tip → Saved attempt.**

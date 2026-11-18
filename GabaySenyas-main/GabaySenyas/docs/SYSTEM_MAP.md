# GabaySenyas — System Map

Connects the product concept to the repository architecture.

## 1. Feature → Module Map

| Feature | Backend module | Main frontend area | Main data |
|---|---|---|---|
| Authentication | `auth`, `users` | Login / Register | users |
| Lesson library (by difficulty) | `lessons` | Lesson Library | lessons |
| Demonstration + sign details | `signs` | Lesson / Sign page | signs, sign_reviews |
| Webcam capture + landmarks | — (browser) | Practice screen (`WebcamCapture`, `LandmarkOverlay`) | landmark sequence (transient) |
| Sign recognition | `recognition` | (result) | recognition_models, attempts |
| Scoring vs. reference | `scoring` | Attempt result (`ScoreBadge`) | reference_sequences, attempts |
| Feedback tips | `feedback` | Attempt result (`FeedbackTip`) | feedback_tips, attempt_feedback |
| Adaptive lessons | `adaptive` | Dashboard / Recommendations | learner_sign_progress |
| Progress tracking | `progress` | Progress page | attempts, learner_sign_progress |
| Admin analytics | `analytics` | Admin Analytics | aggregates over attempts |
| Content & FSL review | `lessons`, `signs` | Admin Content / Sign Validation | sign_reviews, reference_sequences |
| Settings (thresholds) | `users` (`/admin/settings`) | Admin Settings | system_settings |
| Account management | `users` | Admin Accounts | users, audit_logs |

## 2. Runtime Flow

```text
React (frontend/)
  ├── Dashboard / Lessons
  ├── Practice screen
  │     webcam → landmark extraction (in browser)
  │            ↓ landmark sequence
  │      POST /signs/{id}/attempts
  │                ↓
  │        FastAPI Router → progress service
  │                ↓
  │   recognition → scoring → feedback → save attempt → adaptive
  │                ↓
  └── Result: rating + score + tips + recommendation
                   ↓
               SQLite + model files
                   ↓
           Admin analytics (aggregates)
```

## 3. Module Boundaries

### `auth`
Login, registration, token handling.

### `users`
Profiles, roles, account activation, system settings, audit-logged admin actions.

### `lessons`
Lesson catalog, difficulty ordering, unlock state (reads `adaptive`).

### `signs`
Sign catalog, demonstration media, FSL review status, reference sequences.

### `recognition`
Loads the active sequence model; predicts the sign and confidence from a preprocessed sequence. No routes.

### `scoring`
Aligns learner vs. reference, produces similarity score, per-dimension deviations, and rating. No routes.

### `feedback`
Maps deviations to tips from the reviewed tip catalog. No routes.

### `adaptive`
Sign status, lesson unlocking, and recommendations (rule-based). No routes.

### `progress`
Attempt submission orchestration, attempt history, learner progress views.

### `analytics`
Aggregated learner-performance views for administrators.

## 4. Shared Code Rule

Landmark **preprocessing** is the one piece of logic used by `ml/` (training), `signs` (reference recording), and `recognition`/`scoring` (inference). Keep it in a single importable package (e.g. `backend/src/modules/recognition/preprocessing.py`) and import it from `ml/` — never copy it.

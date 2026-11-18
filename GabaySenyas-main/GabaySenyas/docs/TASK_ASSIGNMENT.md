# GabaySenyas — Build Plan and Task Assignment

> Role names are by **area**, not person. Put the team's real names next to each area. Adjust the split to your team size.

## Shared MVP Goal

Build one complete, demonstrable loop for a small set of FSL signs:

**Learn → Capture → Detect Landmarks → Recognize → Score → Feedback → Track Progress → Adapt**

## Area A — Frontend

### Owns
- React app shell, auth screens, learner and admin layouts
- Lesson Library, Lesson/Sign page with demonstration media
- **Practice screen:** webcam capture, landmark extraction, landmark overlay, record/stop/retry
- Attempt result screen (rating, score, tips, recommendation)
- Progress page
- Admin screens: analytics, content management, sign validation (reviews), settings, accounts

### Needs from Backend
- Auth, lesson/sign, attempt, progress, recommendation, analytics, admin contracts (`API_CONTRACTS.md`)

### Needs from ML/CV
- Landmark sequence format and preprocessing rules
- Capture guidance (frames per second, recording length, framing)

## Area B — Backend

### Owns
- FastAPI structure, auth, roles, audit log
- SQLite/SQLAlchemy models
- Lessons, signs, review gate, reference sequence management
- Attempt orchestration (`progress`), progress queries
- Adaptive rules (sign status, unlock, recommendations)
- Analytics module
- Settings

### Needs from ML/CV
- Recognition and scoring services (importable functions) with a clear input/output

## Area C — ML / Computer Vision

### Owns
- Landmark library choice and capture settings (hands + arm/pose)
- Shared **preprocessing** package
- Data collection protocol and tooling (`ml/`)
- Sequence model: baseline → compare architectures → export
- Scoring (DTW + score mapping + deviation measurements)
- Feedback deviation logic (position, direction, speed)
- Evaluation: held-out-signer metrics, robustness tests

### Needs from Content/QA
- Approved sign list, consented recordings, validated references

### Critical rule
Training and inference must use the **same preprocessing code**.

## Area D — Content, Validation and QA

### Owns
- Sign list and lesson structure (with FSL teachers/professionals)
- Demonstration media, descriptions, difficulty labels
- Reference recordings (with validated signers) and consent logs
- Feedback tip catalog wording and approval
- FSL teacher/professional review process and records
- QA: end-to-end tests, rating-agreement study, usability test

## Phases

### Phase 1 — Foundation
- Frontend: app shell, auth screens, navigation.
- Backend: database, auth, roles, lessons/signs (seeded).
- ML/CV: landmark library proof-of-concept (hands + arm), live overlay.
- Content: confirm 3–5 starter signs with FSL teachers; start recordings.

### Phase 2 — Core Loop
- Frontend: practice screen sends a landmark sequence.
- ML/CV: preprocessing, reference scoring (DTW) for starter signs.
- Backend: attempt endpoint with scoring and rating; save attempts.
- Content: validated references; first tip catalog.

### Phase 3 — Recognition and Feedback
- ML/CV: sequence model on starter signs; deviation-based feedback.
- Backend: integrate recognition + feedback in the attempt flow.
- Frontend: result screen with tips.
- QA: synthetic-perturbation tests for tips.

### Phase 4 — Learning Experience
- Backend: progress + adaptive rules; recommendations.
- Frontend: dashboard, progress page, lesson locking.
- Content: expand lessons/signs.

### Phase 5 — Analytics and Validation
- Backend + Frontend: admin analytics and content/review screens.
- QA: rating-agreement study with FSL teachers/professionals, usability test, robustness tests.

### Phase 6 — Demo Hardening
Run the complete journey on a laptop with a built-in webcam:

```text
Register → Lesson → Watch demo → Perform sign → Rating + tip → Retry → Progress → Admin analytics
```

## Folder Ownership

| Area | Owner |
|---|---|
| `frontend/` | Frontend |
| `backend/src/core`, `auth`, `users`, `lessons`, `signs`, `progress`, `adaptive`, `analytics` | Backend |
| `backend/src/modules/recognition`, `scoring`, `feedback` | ML/CV (with Backend for integration) |
| `ml/` | ML/CV |
| `seed/` and content QA | Content/QA |
| `backend/tests/` | Everyone for their module; Content/QA owns end-to-end flows |
| `docs/` | Whoever changes behavior updates the matching doc |

## Early Test Rule

In Phases 1–2, add a stub for `POST /signs/{id}/attempts` and a test proving that unapproved signs and locked lessons are rejected. This is not left for the end.

## Team Integration Rule

If a developer changes an API, data field, landmark format, rating rule, or workflow state, update the matching document before merging.

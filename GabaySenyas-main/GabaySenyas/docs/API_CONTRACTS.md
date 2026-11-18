# GabaySenyas — API Contracts

Initial frontend/backend contract. Any breaking change must update this file **before** integration.

All routes are under `/api/v1`. JSON fields use `snake_case`.

## 1. Envelope

Success:

```json
{ "data": {} }
```

Error:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "The submitted sequence is invalid." } }
```

Common codes: `VALIDATION_ERROR` (400/422), `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `ACCOUNT_INACTIVE` (403), `LESSON_LOCKED` (409), `SIGN_NOT_APPROVED` (403), `NO_HANDS_DETECTED` (422), `SEQUENCE_TOO_SHORT` (422), `SEQUENCE_TOO_LONG` (422), `MODEL_UNAVAILABLE` (503).

## 2. Authentication

| Method | Route | Notes |
|---|---|---|
| POST | `/auth/register` | Creates a **learner** only. Body: `name`, `email`, `password`. Any `role` field is ignored. |
| POST | `/auth/login` | Body: `email`, `password`. |
| GET | `/me` | Current user. |

```json
{ "data": { "access_token": "...", "user": { "id": 1, "name": "Ana", "role": "learner" } } }
```

The frontend uses `user.role` to choose the layout (learner / admin). There is no role picker at login.

## 3. Lessons and Signs (learner)

| Method | Route |
|---|---|
| GET | `/lessons` |
| GET | `/lessons/{id}` |
| GET | `/signs/{id}` |

`GET /lessons` returns lessons ordered by difficulty, with lock state and progress:

```json
{
  "data": [
    { "id": 1, "title": "Greetings", "difficulty_level": 1, "unlocked": true,
      "signs_total": 5, "signs_mastered": 2 }
  ]
}
```

`GET /signs/{id}`:

```json
{
  "data": {
    "id": 12, "lesson_id": 1, "gloss": "MAGANDANG UMAGA", "meaning_en": "Good morning",
    "description": "Short written description of the sign.",
    "demo_media_url": "/media/signs/12.mp4",
    "status": "in_progress", "best_score": 72.4
  }
}
```

Only signs with `review_status = approved` are returned to learners. Other signs return `SIGN_NOT_APPROVED`/`NOT_FOUND`.

## 4. Attempts (core endpoint)

### `POST /signs/{sign_id}/attempts`

Request: the landmark sequence (see `TECHNICAL_ARCHITECTURE.md` §5). **No video is sent.**

```json
{
  "fps": 30,
  "frames": [
    { "t_ms": 0,
      "hands": [ { "handedness": "right", "landmarks": [ { "x": 0.51, "y": 0.62, "z": -0.03 } ] } ],
      "pose": [ { "x": 0.50, "y": 0.40, "z": -0.10, "visibility": 0.98 } ] }
  ]
}
```

Response:

```json
{
  "data": {
    "attempt_id": 301,
    "target_sign_id": 12,
    "recognized": { "sign_id": 12, "gloss": "MAGANDANG UMAGA", "confidence": 0.91 },
    "score": 84.2,
    "rating": "correct",
    "feedback": [
      { "dimension": "speed", "direction": "too_fast", "message": "Slow down the movement." }
    ],
    "progress": { "sign_status": "in_progress", "attempts_count": 3, "best_score": 84.2 },
    "recommendation": { "type": "retry", "message": "Try once more to reach mastery." }
  }
}
```

Rules:

- `rating` is one of `correct`, `partially_correct`, `incorrect`.
- `recognized` may be `null` when the model has low confidence for every sign.
- `feedback` contains 0–2 tips. Each message comes from the reviewed tip catalog.
- Rejected attempts (`NO_HANDS_DETECTED`, `SEQUENCE_TOO_SHORT`, `SEQUENCE_TOO_LONG`) are **not** saved or counted. The message tells the learner how to fix it (e.g., "Keep both hands inside the camera frame").
- The learner can only attempt signs in an unlocked lesson (`LESSON_LOCKED` otherwise).

### History

| Method | Route |
|---|---|
| GET | `/attempts?sign_id=12` (own history) |
| GET | `/attempts/{id}` (own attempt only) |

## 5. Progress and Recommendations (learner)

| Method | Route |
|---|---|
| GET | `/progress/me` |
| GET | `/progress/me/signs/{sign_id}` |
| GET | `/recommendations/me` |

`GET /progress/me`:

```json
{
  "data": {
    "lessons_completed": 1,
    "signs_mastered": 7,
    "signs_total": 20,
    "score_over_time": [ { "date": "2026-11-10", "avg_score": 61.0 }, { "date": "2026-11-12", "avg_score": 72.5 } ],
    "needs_practice": [ { "sign_id": 15, "gloss": "SALAMAT", "recent_avg": 44.0 } ]
  }
}
```

`GET /recommendations/me`:

```json
{ "data": { "type": "next_lesson", "lesson_id": 2, "message": "You mastered Greetings. Try Family next." } }
```

`type`: `retry_sign` | `replay_demo` | `review_sign` | `next_sign` | `next_lesson`.

## 6. Admin — Analytics (`admin` role)

| Method | Route |
|---|---|
| GET | `/admin/analytics/overview` |
| GET | `/admin/analytics/signs` |
| GET | `/admin/analytics/lessons` |
| GET | `/admin/analytics/learners` |
| GET | `/admin/analytics/learners/{id}` |

`GET /admin/analytics/overview`:

```json
{
  "data": {
    "active_learners_7d": 42,
    "attempts_7d": 910,
    "rating_distribution": { "correct": 0.46, "partially_correct": 0.33, "incorrect": 0.21 },
    "avg_score": 68.4,
    "hardest_signs": [ { "sign_id": 15, "gloss": "SALAMAT", "avg_score": 51.2, "top_feedback_dimension": "motion_direction" } ]
  }
}
```

All analytics endpoints accept optional `from` and `to` (ISO dates).

## 7. Admin — Content, Review, Settings (`admin` role)

| Method | Route |
|---|---|
| GET/POST | `/admin/lessons` |
| PUT | `/admin/lessons/{id}` |
| GET/POST | `/admin/signs` |
| PUT | `/admin/signs/{id}` |
| POST | `/admin/signs/{id}/sign-reviews` (record FSL teacher/professional approval) |
| POST | `/admin/signs/{id}/reference-sequences` (upload a recorded landmark sequence) |
| POST | `/admin/reference-sequences/{id}/activate` |
| GET/POST/PUT | `/admin/feedback-tips` |
| GET/PUT | `/admin/settings` |
| GET | `/admin/users` |
| POST | `/admin/users/{id}/activate` · `/deactivate` |

Record a review:

```json
{ "reviewer_name": "Teacher A", "reviewer_credential": "FSL teacher", "status": "approved", "notes": "Hand position verified." }
```

A sign becomes `approved` only through a recorded review with `status = approved`. All admin writes are audit-logged.

Settings body:

```json
{
  "rating_thresholds": { "correct_min": 80, "partial_min": 50 },
  "confidence_min": 0.7,
  "speed_ratio_bounds": { "too_fast_below": 0.7, "too_slow_above": 1.3 },
  "lesson_unlock_percent": 70
}
```

## 8. Not Public

`recognition`, `scoring`, `feedback` and `adaptive` have no routes. Only the attempt service calls them.

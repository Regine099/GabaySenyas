# GabaySenyas — Development Rules

## 1. Source of Truth

Before implementing a feature, check:

1. `SCOPE.md`
2. `CORE_CONCEPT.md`
3. `USER_WORKFLOWS.md`
4. `TECHNICAL_ARCHITECTURE.md`
5. `SYSTEM_MAP.md`
6. `API_CONTRACTS.md`

If a requested feature is not in scope, mark it as a future enhancement instead of silently adding it to the core path.

## 2. Domain-Based Architecture

Organize the backend by feature/domain, not by file type.

```text
backend/src/modules/<feature>/
```

Current domains: `auth`, `users`, `lessons`, `signs`, `recognition`, `scoring`, `feedback`, `adaptive`, `progress`, `analytics`.

Do not create generic `learning` or `admin` modules unless a concrete domain responsibility requires them.

## 3. Layer Responsibilities

```text
Request → Router → Schema → Service → Model / Integration → Response Schema
```

- **Router:** endpoint definition and authorization boundary.
- **Schema:** input/output validation.
- **Service:** business rules and orchestration.
- **Model:** persistence structure.

Routers must not contain large business rules.

## 4. Landmark and Preprocessing Rules

- There is **one** preprocessing implementation. `ml/` imports it; it is never copied.
- Any change to preprocessing (normalization, resampling, features) requires **re-training** the model and **re-recording or re-validating** references. Bump the model version and note it in the PR.
- Store the model version and reference-sequence id on every attempt so results stay explainable.
- Validate incoming sequences (size, frame count, numeric ranges). Reject malformed input.

## 5. Recognition, Scoring and Feedback Rules

- Recognition predicts *which* sign was performed. Scoring judges *how well* the **target** sign was performed. Do not mix them.
- Never show a confident answer for low-confidence recognition.
- Ratings come from the rule in `USER_WORKFLOWS.md` §3 and thresholds in `system_settings`. Do not hardcode thresholds in the frontend.
- Feedback tips come only from the **approved tip catalog**. Do not generate free-form tips with an LLM in the prototype.
- Describe results honestly: the system gives **practice feedback**, not certification. Do not present scores as official FSL assessment.

## 6. Content and Review Rules

- Learners see only `review_status = approved` signs.
- A reference sequence may be activated only after an approved review is recorded.
- Do not copy videos or images from other sources without permission.
- Signs that need facial expression or non-manual markers are out of scope.

## 7. Data Visibility

A learner may see only their own attempts, progress and recommendations. Admins may see aggregate analytics and individual drill-downs. A learner must never read another learner's data by changing an ID.

## 8. Frontend Rules

- Use React with reusable components.
- Keep API calls in `frontend/src/api/`.
- Role comes from the account (`/me`). No role selector at login.
- Landmark extraction runs in the browser. **Never upload video.**
- Do not put business rules (rating, thresholds, unlock rules) in the frontend.
- Handle: camera permission denied, no camera, no hands detected, slow device, loading, empty, success, and error states.
- Use clear, plain language. Keep tips short and kind.
- Desktop/laptop layout only (see delimitations).
- Accessibility: keyboard navigable, sufficient contrast, captions/text alternatives for demonstration media where possible.

## 9. API Conventions

- JSON fields use `snake_case`.
- Success: `{ "data": ... }`. Error: `{ "error": { "code", "message" } }`.
- Admin routes live under `/api/v1/admin/*` and use the `admin` guard. They are implemented inside the module that owns the data.

## 10. Data, Privacy and Secrets

- Never commit `.env`. Commit `.env.example` only.
- `JWT_SECRET` and any other secrets stay in environment variables, read through `core/config.py`.
- Never commit raw recordings or personal data. `ml/data/` is gitignored.
- Do not store landmarks from learners by default (`STORE_LANDMARKS=false`).
- Never log passwords, tokens, or keys.

## 11. Git and Delivery Rules

- `main` is protected. Work on a branch: `feat/<module>-<short-name>` or `fix/<short-name>`. Open a Pull Request and get one review before merging.
- Commit messages: `feat:`, `fix:`, `docs:`, `test:`, `chore:` followed by a short description.
- One focused feature or bug fix per commit where practical.
- Update documentation when an API, data field, landmark format, rating rule, or workflow changes.
- Update tests when behavior changes. Backend tests use `pytest` in `backend/tests/`.
- Do not merge a feature that contradicts `SCOPE.md`.
- Prefer simple, readable implementations over premature abstraction.

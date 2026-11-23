# GabaySenyas — User Workflows

Implementation-level journeys. They must stay consistent with `CORE_CONCEPT.md`.

## 1. Learner Entry

```text
Create Account / Log In → Learner Dashboard (recommended next lesson, recent progress)
```

- Registration always creates `role = learner`.
- The login screen has no role selector; the role comes from the account.
- First-time learners see a short **camera setup check** (permission, lighting, framing: "show both hands and upper body").

## 2. Learn → Practice Loop (core loop)

```text
Lesson Library → Open Lesson → Select Sign
   ↓
I.   Watch demonstration (video/image)
II.  Start webcam, perform the sign
III. Browser extracts landmarks → sequence
IV.  Backend recognizes the sign
V.   Backend scores vs. validated reference → rating
VI.  Feedback tip(s)
VII. Attempt saved → progress updated
   ↓
Retry  |  Next sign  |  Back to lesson
```

### Rules

- Only **landmark sequences** are sent to the backend, not video.
- The learner may retry as many times as they like; every attempt is saved.
- If no hand is detected for most of the recording, the attempt is rejected with a guidance message and is **not** counted as an attempt.
- The learner can replay the demonstration at any time during practice.

## 3. Recognition and Scoring

```text
Landmark Sequence (normalized, fixed length)
        ↓
Recognition model → predicted sign + confidence
        ↓
Scoring vs. reference sequence of the TARGET sign → similarity score (0–100)
        ↓
Rating: correct | partially_correct | incorrect
```

Rating rule (prototype defaults, editable by admin):

| Condition | Rating |
|---|---|
| Score ≥ `correct_min` (default 80) and recognized sign = target | `correct` |
| Score ≥ `partial_min` (default 50) | `partially_correct` |
| Otherwise, or a *different* sign is recognized with confidence ≥ `confidence_min` | `incorrect` |

These values are **not validated**. They must be calibrated against FSL teacher ratings.

## 4. Feedback Workflow

```text
Compare learner vs. reference per dimension
   ├── Hand position   (where the hand/arm is, hand shape offset)
   ├── Motion direction (path of the movement)
   └── Speed           (duration / velocity)
        ↓
Pick the dimension with the largest deviation (top 1–2)
        ↓
Map to a tip from the reviewed tip catalog
        ↓
Display tip(s) with the result
```

- Tips come from a **reviewed tip catalog** (`seed/feedback_tips/`), not free-form text, so teachers can approve them.
- A `correct` attempt may still show a minor tip if one dimension is noticeably off.

## 5. Adaptive Learning Workflow

```text
Attempt saved
   ↓
Update learner_sign_progress (recent average, best score, attempts)
   ↓
Adaptive rules
   ├── Sign mastered       → unlock next sign / next lesson
   ├── Sign needs practice → recommend retry + replay demo + show most common tip
   └── Lesson completed    → recommend next lesson by difficulty, or review weakest signs
```

Sign status:

| Status | Rule (prototype defaults) |
|---|---|
| `not_started` | No attempts |
| `in_progress` | At least one attempt, not yet mastered |
| `needs_practice` | Average of last 3 attempts < `partial_min`, with ≥ 3 attempts |
| `mastered` | At least 2 `correct` attempts, and average of last 3 attempts ≥ `correct_min` |

Lesson unlocking: a lesson unlocks when ≥ 70% of the previous lesson's signs are `mastered` (default; editable). Adaptation is **rule-based and explainable** in the prototype.

## 6. Progress Workflow (Learner)

```text
Progress page
   ├── Lessons completed / signs mastered
   ├── Score over time (per sign and overall)
   ├── Attempt history (rating, score, date)
   └── Signs that need practice
```

A learner can only see their own data.

## 7. Administrator Workflow

```text
Admin logs in
   ↓
Analytics Overview
   ├── Active learners, attempts per day
   ├── Average score per sign / lesson
   ├── Rating distribution (correct / partial / incorrect)
   ├── Hardest signs (lowest average score, most common feedback dimension)
   └── Learner performance list (drill-down)
   ↓
Content Management
   ├── Lessons and signs (create/edit, difficulty, order)
   ├── Reference sequences (upload/activate version)
   ├── Feedback tip catalog
   └── FSL reviewer approvals (record reviewer, status, notes)
   ↓
Settings (rating thresholds, confidence threshold, unlock percentage)
   ↓
Account management (activate/deactivate)
```

### Rules

- A sign can be shown to learners only when `review_status = approved` (FSL teacher/professional approval recorded).
- Every account, settings, and content change is audit-logged.
- Thresholds are labeled as prototype configuration, not validated standards.

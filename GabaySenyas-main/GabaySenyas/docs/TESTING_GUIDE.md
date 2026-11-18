# GabaySenyas — Testing Guide

## 1. Testing Goal

Prove that one complete loop works end to end, and that its numbers can be trusted:

**Watch → Sign → Landmarks → Recognize → Score → Rate → Feedback → Save → Adapt → Analytics**

## 2. Critical End-to-End Test

### Scenario: successful attempt

1. Register as a learner and log in.
2. Open an unlocked lesson and a sign. Watch the demo.
3. Turn on the webcam, see the landmark overlay, perform the sign correctly.
4. Result shows recognized sign, score, rating `correct`.
5. Attempt appears in history; sign status updates; progress page reflects it.
6. Admin analytics counts the attempt.

### Scenario: incorrect/partial attempt

1. Perform the sign with a clear error (hand too low, or too fast).
2. Rating is `partially_correct` or `incorrect`.
3. A matching tip is shown (e.g., "Raise your hand higher").
4. Retry with the fix → score improves.

## 3. Capture and Landmark Tests

- Camera permission denied → clear message, no crash.
- No camera present → clear message.
- Hands out of frame for most of the recording → `NO_HANDS_DETECTED`, attempt **not** saved.
- Very short recording → `SEQUENCE_TOO_SHORT`. Very long → `SEQUENCE_TOO_LONG`.
- Landmark overlay stays smooth (target ≥ 15 FPS) on a typical laptop.
- No video bytes are sent to the backend (inspect network tab).

## 4. Preprocessing Tests (unit)

- Same sequence produces the same output (deterministic).
- Translating or scaling the whole signer (camera distance) changes the output only slightly.
- Gaps are interpolated; leading/trailing empty frames are trimmed.
- Output has the fixed length `T` and feature size expected by the model.
- The same preprocessing is used by `ml/` and `backend/` (single import).

## 5. Recognition Tests

- Model loads at startup; `MODEL_UNAVAILABLE` (503) if the file is missing.
- Held-out-signer accuracy is reported (per sign and overall) with a confusion matrix.
- Random movement / no sign → low confidence, `recognized = null`.
- Similar-looking signs are checked specifically (confusion pairs).

## 6. Scoring and Rating Tests

- A reference sequence scored against itself → score near 100, rating `correct`.
- A sign scored against a **different** sign's reference → score low, rating `incorrect`.
- Small timing differences (a bit faster/slower) do not collapse the score (DTW tolerance).
- Rating thresholds read from `system_settings`; changing them changes the rating.
- If the model recognizes a different sign with confidence ≥ `confidence_min`, the rating is `incorrect` even when the score is moderate.

## 7. Feedback Tests

- Synthetic perturbations of a reference produce the expected tip:
  - shift hand down → `hand_position / too_low`
  - reverse or rotate the path → `motion_direction`
  - stretch duration ×1.5 → `speed / too_slow`; compress ×0.6 → `speed / too_fast`
- At most 2 tips per attempt. Tips come only from approved catalog entries.
- A perfect attempt shows no tip (or only a minor one).

## 8. Adaptive Learning Tests

- New learner: only the first lesson is unlocked.
- 3 poor attempts → sign `needs_practice`; recommendation = retry/replay demo.
- 2 `correct` attempts with a good recent average → `mastered`.
- ≥ `lesson_unlock_percent` of signs mastered → next lesson unlocks.
- Attempting a sign in a locked lesson → `LESSON_LOCKED`.

## 9. Content / Review Gate Tests

- A sign with `review_status != approved` is invisible to learners and cannot be attempted.
- Admin cannot activate a reference sequence without a recorded approved review.
- Changing a sign back to `in_review` hides it again.

## 10. Authorization Tests

### Learner
- Cannot call any `/admin/*` route (`FORBIDDEN`).
- Cannot read another learner's attempts or progress by changing an ID.
- Cannot register as admin (a `role` field in the body is ignored).

### Admin
- Can view analytics, manage content, record reviews, change settings, deactivate accounts.
- Every one of those writes appears in `audit_logs`.

### Inactive accounts
- `is_active = false` cannot log in (`ACCOUNT_INACTIVE`).

## 11. Analytics Tests

- Seed known attempts; verify totals, averages, and rating distribution exactly.
- "Hardest signs" ranks by lowest average score.
- Date range filters work.
- Learner drill-down matches that learner's own Progress page.

## 12. Privacy Tests

- Server never receives or stores video.
- Landmarks are not persisted when `STORE_LANDMARKS=false` (default).
- No passwords, tokens, or keys in logs.

## 13. Model Quality and Validation (research-grade checks)

These produce the numbers reported in the paper/defense.

- **Recognition:** accuracy, per-class precision/recall/F1, confusion matrix, on signers **not** in training.
- **Rating agreement:** have FSL teachers/professionals rate a sample of attempts (correct / partial / incorrect). Report agreement (e.g., Cohen's kappa) between the system and the teachers.
- **Robustness:** repeat tests with different lighting, backgrounds, distances, camera heights, skin tones, and handedness.
- **Latency:** attempt submit → result time.
- **Usability:** learners can understand and act on tips (short task-based test + survey).
- Report limitations honestly (small vocabulary, few signers, no facial markers).

## 14. Regression Checklist

- [ ] Register / login / role redirect
- [ ] Lessons list shows lock state correctly
- [ ] Webcam permission flow
- [ ] Landmark overlay renders
- [ ] Attempt: correct / partial / incorrect paths
- [ ] Rejected attempts not saved
- [ ] Tips match the deviation
- [ ] Sign status and lesson unlock rules
- [ ] Progress page and recommendations
- [ ] Admin analytics values
- [ ] Review gate (unapproved sign hidden)
- [ ] Settings change affects rating
- [ ] Authorization checks
- [ ] Audit logs written

## 15. Definition of MVP Test Completion

The MVP is test-complete when:

- The critical end-to-end scenarios pass on a laptop with a built-in webcam.
- Preprocessing, scoring, rating, feedback, and adaptive rules have unit tests.
- Recognition metrics on held-out signers are recorded.
- At least one round of FSL teacher/professional rating comparison is recorded.
- Authorization and privacy tests pass.

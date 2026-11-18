# GabaySenyas — Content Seeding Guide

Seed content lives in `seed/`. Nothing is shown to learners until FSL teachers/professionals approve it.

## 1. Folder Layout

```text
seed/
├── lessons/         lessons.json
├── signs/           signs.json (+ demo media notes)
└── feedback_tips/   feedback_tips.json
ml/data/             reference and training recordings (NOT committed; see ml/README.md)
```

## 2. Choosing Signs

- Pick signs with **isolated, well-defined** hand/arm movement. Signs that depend heavily on facial expression or non-manual markers are **out of scope** (the system does not assess them).
- Start with a small set (e.g., **3–5 signs**) to prove the full loop, then grow lesson by lesson.
- Confirm the sign list, glosses, and regional variants with FSL teachers/professionals **before** recording data.
- Include signs that need **movement** (not only still hand shapes) so the sequence model is justified.
- Include some signs that look alike so recognition and feedback are tested on hard cases.

## 3. Lesson Record Template

```json
{
  "title": "Greetings",
  "description": "Basic greeting signs.",
  "difficulty_level": 1,
  "order_index": 1,
  "review_status": "draft"
}
```

- `difficulty_level`: 1 (beginner) – 3 (advanced) for the prototype.
- Order lessons so easier, more distinct signs come first.

## 4. Sign Record Template

```json
{
  "lesson": "Greetings",
  "gloss": "MAGANDANG UMAGA",
  "meaning_en": "Good morning",
  "description": "Plain-language description of handshape, location, movement.",
  "demo_media": "signs/magandang_umaga.mp4",
  "difficulty": 1,
  "order_index": 1,
  "review_status": "draft"
}
```

- Demonstration media must show the sign from the front, hands and upper body visible, neutral background, slow and normal speed if possible.
- Use media you own or have permission to use. Do not copy videos from other sources without permission.

## 5. Reference Sequence Requirements

A reference sequence is the **validated** recording the learner is scored against.

- Recorded with the **same capture pipeline** as the app (same landmark library, same preprocessing).
- Signed by an FSL teacher/professional or a signer they have validated.
- Recommended: 3 or more references per sign from different signers (improves tolerance for body size/style).
- Each reference gets a recorded review (`sign_reviews`) before `is_active = true`.
- Record version, signer label, fps, and date. Do not store identifying information in the sequence file.

## 6. Training Data Requirements (for recognition)

- Multiple signers, varied lighting, backgrounds, camera heights, and distances.
- Many repetitions per sign, plus "no sign / random movement" samples (a rejection class or confidence threshold).
- Split by **signer** (train/validation/test), not by random sample, to avoid inflated accuracy.
- Informed consent for every contributor; keep a consent log outside the repo.
- Never commit raw recordings. Only commit small, consented, anonymized sample sequences for tests.

## 7. Feedback Tip Catalog

Tips are short, positive, and actionable. Each tip is keyed by `dimension` + `direction`.

```json
[
  { "dimension": "hand_position", "direction": "too_low", "message": "Raise your hand higher." },
  { "dimension": "hand_position", "direction": "too_high", "message": "Lower your hand a little." },
  { "dimension": "motion_direction", "direction": "wrong_direction", "message": "Check the direction of the movement in the demo." },
  { "dimension": "speed", "direction": "too_fast", "message": "Slow down the movement." },
  { "dimension": "speed", "direction": "too_slow", "message": "Try the movement a bit faster, like in the demo." }
]
```

Rules:

- Plain language, no jargon, under ~12 words where possible.
- Do not criticize the learner personally.
- FSL teachers/professionals review every tip (`review_status = approved`).
- Tips refer only to what the system measures (position, direction, speed).

## 8. Content QA Checklist

- [ ] Sign gloss and meaning confirmed by an FSL teacher/professional
- [ ] Demonstration media clear and permission-cleared
- [ ] Sign is hand/arm based (no reliance on facial expression)
- [ ] At least one validated, active reference sequence
- [ ] Reference recorded with the app's pipeline
- [ ] Recognition model trained and tested on this sign (signer-independent split)
- [ ] Tips exist for the dimensions most likely to differ
- [ ] `review_status = approved` recorded in `sign_reviews`
- [ ] Lesson difficulty and order make sense to a beginner

## 9. Sign Status Checks for Content

When seeding, confirm these states can be reached in the demo:

| Status | How to reach it in a demo |
|---|---|
| `not_started` | New learner |
| `in_progress` | 1–2 attempts |
| `needs_practice` | 3 poor attempts |
| `mastered` | 2 `correct` attempts and a good recent average |

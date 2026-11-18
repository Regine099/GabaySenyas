# GabaySenyas Frontend

UI plus **in-browser webcam capture and landmark extraction**.

## Responsibilities

- Learner screens and admin screens
- Layouts and navigation
- Reusable UI components
- Webcam capture and hand/arm landmark extraction in the browser
- Landmark overlay on the live video
- API calls through `src/api/`
- Display of ratings, scores, tips, recommendations, progress, and analytics

## Must Not Contain

- Database queries or SQLAlchemy models
- Rating thresholds or scoring/recognition logic
- Adaptive/unlock rules
- Secrets
- Any upload of raw video (only landmark coordinates are sent)

Those responsibilities belong to `backend/`.

## Learner UI

- Login and Register
- Dashboard (recommended next step, recent progress)
- Lesson Library (by difficulty, lock state)
- Lesson / Sign page (demonstration video or image)
- Practice (webcam, landmark overlay, record / retry)
- Attempt Result (rating, score, tips, recommendation)
- Progress (score over time, attempt history, signs needing practice)

## Admin UI

- Analytics Overview
- Learner Performance
- Content Management (lessons, signs, reference sequences, tip catalog)
- Sign Validation (record FSL teacher/professional reviews)
- Settings (thresholds)
- Account Management

## Structure

```text
frontend/src/
├── api/          client, auth, lessons, attempts, progress, admin calls
├── components/   WebcamCapture, LandmarkOverlay, ScoreBadge, FeedbackTip,
│                 LessonCard, DifficultyTag, ProgressBar, tokens/
├── hooks/        useWebcam, useLandmarker, useRecorder
├── layout/       LearnerLayout, AdminLayout
├── pages/        learner/, admin/, Login, Register
├── App.tsx
└── main.tsx
```

## One-time setup

The config files (`package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`) are empty placeholders. Generate them once:

1. Delete the empty `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, and `src/App.tsx`.
2. From inside `frontend/`, run `npm create vite@latest . -- --template react-ts`.
3. Run `npm install`, then add React Router and Tailwind CSS.
4. Add a hand-tracking library, e.g. `npm install @mediapipe/tasks-vision` (hand + pose landmarkers) — confirm the choice with the team.
5. Keep the `src/` folders above. Run with `npm run dev`.

Notes: camera access (`getUserMedia`) needs `https` or `localhost`. Test on a normal laptop webcam early.

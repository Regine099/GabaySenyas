# GabaySenyas frontend

React + TypeScript + Tailwind CSS, built with Vite. The browser captures webcam video locally and sends only hand landmarks to the backend for recognition; raw video is never uploaded.

## Run locally

1. Install Node.js 20 or newer.
2. From this folder, install dependencies and start Vite:
   ```sh
   npm install
   npm run dev
   ```
3. In `backend/.env`, set `DEV_RECOGNITION=true` for local testing only, then start the backend from `backend/`:
   ```sh
   uvicorn main:app --reload
   ```
   Vite proxies `/api` requests to `http://127.0.0.1:8000`.
4. Ensure `MODEL_PATH` points to a directory containing `model.onnx` and `meta.json`. The dev recognition endpoint is unavailable until a compatible backend model is present.

Camera access requires `localhost` or HTTPS. The dev recognition endpoint must remain disabled in deployed environments.

## Current functionality

- Alphabet lesson and practice UI with reference images.
- Webcam permission states and live hand-landmark overlay.
- Backend recognition preview using `POST /api/v1/dev/recognize`.
- Completion progress saved in browser `localStorage` until backend progress endpoints are implemented.

Recognition is a development preview only. The production `/signs/{id}/attempts` endpoint, server-side rating, feedback, and saved progress are not implemented yet; do not treat preview predictions as an assessment.

## Still needed

- Trained and validated backend model files at `MODEL_PATH` (`model.onnx` and `meta.json`).
- Verified lesson content and FSL review for letters A–Z.
- Production attempt/progress APIs, authentication, and a deployed backend.
- Configure a same-origin API proxy or backend CORS/base URL before deploying the frontend. The Vite development proxy is not included in production builds.

See `src/App.tsx` for page state, `src/components/` for the UI, `src/lib/usePractice.ts` for webcam capture, and `src/api/` for backend requests.

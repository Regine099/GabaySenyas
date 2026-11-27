import { useCallback, useEffect, useRef, useState } from 'react';
import { DrawingUtils, FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { ApiError } from '../api/client';
import { recognizeDev, type Frame, type RecognizeResult } from '../api/recognition';

export type CameraState = 'off' | 'requesting' | 'on' | 'denied' | 'error';
export type TrackerState = 'loading' | 'ready' | 'error';
export type RecognitionState = 'waiting' | 'loading' | 'ready' | 'error';

export interface Live {
  hand: boolean;
  handCount: number;
  fps: number;
  predictions: RecognizeResult['predictions'];
  modelVersion: string | null;
}

const WASM_URL = `${import.meta.env.BASE_URL}mediapipe`;
const HAND_MODEL_URL = `${import.meta.env.BASE_URL}models/hand_landmarker.task`;
const WINDOW_MS = 1500;
const MIN_FRAME_GAP_MS = 30;
const PREDICT_EVERY_MS = 200;
const MIN_HAND_FRAMES = 5;

let landmarkerPromise: Promise<HandLandmarker> | null = null;
function getLandmarker() {
  landmarkerPromise ??= FilesetResolver.forVisionTasks(WASM_URL).then(async (vision) => {
    const create = (delegate: 'GPU' | 'CPU') =>
      HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate },
        runningMode: 'VIDEO',
        numHands: 2,
      });
    try {
      return await create('GPU');
    } catch {
      return create('CPU');
    }
  });
  landmarkerPromise.catch(() => (landmarkerPromise = null));
  return landmarkerPromise;
}

function toFrame(result: HandLandmarkerResult, timestampMs: number): Frame {
  return {
    t_ms: Math.round(timestampMs),
    hands: result.landmarks.map((landmarks, index) => ({
      handedness: (result.handedness[index]?.[0]?.categoryName ?? 'unknown').toLowerCase(),
      landmarks: landmarks.map((point) => ({
        x: Number(point.x.toFixed(5)),
        y: Number(point.y.toFixed(5)),
        z: Number(point.z.toFixed(5)),
      })),
    })),
  };
}

export function usePractice(letter: string) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const bufferRef = useRef<Frame[]>([]);
  const fpsTimesRef = useRef<number[]>([]);
  const aspectRef = useRef(4 / 3);
  const inFlightRef = useRef(false);
  const lastSentRef = useRef(0);
  const lastUiRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const [camera, setCamera] = useState<CameraState>('off');
  const [tracker, setTracker] = useState<TrackerState>('loading');
  const [trackerError, setTrackerError] = useState('');
  const [recognition, setRecognition] = useState<RecognitionState>('waiting');
  const [recognitionError, setRecognitionError] = useState('');
  const [live, setLive] = useState<Live>({
    hand: false,
    handCount: 0,
    fps: 0,
    predictions: [],
    modelVersion: null,
  });

  useEffect(() => {
    bufferRef.current = [];
    setLive({ hand: false, handCount: 0, fps: 0, predictions: [], modelVersion: null });
    setRecognition('waiting');
    setRecognitionError('');
  }, [letter]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const enable = useCallback(async () => {
    setCamera('requesting');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access requires HTTPS or localhost.');
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      setCamera('on');
    } catch (error) {
      const denied =
        error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError');
      setCamera(denied ? 'denied' : 'error');
    }
  }, []);

  useEffect(() => {
    if (camera !== 'on') return;
    let cancelled = false;
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    if (!videoElement || !canvasElement || !streamRef.current) return;

    videoElement.srcObject = streamRef.current;
    setTracker('loading');
    setTrackerError('');
    setRecognition('waiting');
    setRecognitionError('');

    async function start(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
      try {
        await video.play();
        const landmarker = await getLandmarker();
        if (cancelled) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not initialize the camera overlay.');
        const drawing = new DrawingUtils(ctx);
        let lastVideoTime = -1;
        let lastTimestamp = -1;
        setTracker('ready');

        const sendRecognition = async (frames: Frame[]) => {
          if (inFlightRef.current) return;
          inFlightRef.current = true;
          lastSentRef.current = performance.now();
          setRecognition('loading');
          const controller = new AbortController();
          abortRef.current = controller;
          try {
            const result = await recognizeDev(
              { frame_size: { width: aspectRef.current, height: 1 }, frames },
              controller.signal,
            );
            if (cancelled) return;
            setLive((current) => ({
              ...current,
              predictions: result.predictions,
              modelVersion: result.model_version,
            }));
            setRecognition('ready');
            setRecognitionError('');
          } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return;
            if (cancelled) return;
            if (error instanceof ApiError && error.code === 'NO_HANDS_DETECTED') {
              setLive((current) => ({ ...current, predictions: [], modelVersion: null }));
              setRecognition('waiting');
              setRecognitionError('');
            } else {
              setRecognition('error');
              setRecognitionError(error instanceof Error ? error.message : String(error));
            }
          } finally {
            inFlightRef.current = false;
            if (abortRef.current === controller) abortRef.current = null;
          }
        };

        const loop = () => {
          if (cancelled) return;
          rafRef.current = requestAnimationFrame(loop);
          if (video.readyState < 2 || video.currentTime === lastVideoTime) return;
          lastVideoTime = video.currentTime;
          if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          const timestampMs = Math.max(performance.now(), lastTimestamp + 1);
          lastTimestamp = timestampMs;
          const result = landmarker.detectForVideo(video, timestampMs);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          for (const hand of result.landmarks) {
            drawing.drawConnectors(hand, HandLandmarker.HAND_CONNECTIONS, { color: '#f8b62d', lineWidth: 3 });
            drawing.drawLandmarks(hand, { color: '#ffffff', fillColor: '#0f9ba0', radius: 3 });
          }
          aspectRef.current = video.videoWidth / video.videoHeight;

          fpsTimesRef.current.push(timestampMs);
          while (fpsTimesRef.current.length && timestampMs - fpsTimesRef.current[0] > 1000) {
            fpsTimesRef.current.shift();
          }

          const frames = bufferRef.current;
          if (!frames.length || timestampMs - frames[frames.length - 1].t_ms >= MIN_FRAME_GAP_MS) {
            frames.push(toFrame(result, timestampMs));
            while (frames.length && timestampMs - frames[0].t_ms > WINDOW_MS) frames.shift();
          }

          if (timestampMs - lastUiRef.current > 100) {
            lastUiRef.current = timestampMs;
            const hasHand = result.landmarks.length > 0;
            setLive((current) => ({
              ...current,
              hand: hasHand,
              handCount: result.landmarks.length,
              fps: fpsTimesRef.current.length,
              ...(!hasHand ? { predictions: [], modelVersion: null } : {}),
            }));
          }

          const handFrames = frames.filter((frame) => frame.hands.length > 0).length;
          if (
            handFrames >= MIN_HAND_FRAMES &&
            !inFlightRef.current &&
            timestampMs - lastSentRef.current >= PREDICT_EVERY_MS
          ) {
            void sendRecognition([...frames]);
          }
        };
        loop();
      } catch (error) {
        if (cancelled) return;
        setTracker('error');
        setTrackerError(error instanceof Error ? error.message : String(error));
      }
    }

    void start(videoElement, canvasElement);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      abortRef.current?.abort();
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [camera]);

  return { videoRef, canvasRef, camera, tracker, trackerError, recognition, recognitionError, live, enable, stop };
}

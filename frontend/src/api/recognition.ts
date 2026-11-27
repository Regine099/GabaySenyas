import { apiPost } from './client';

export type Point = { x: number; y: number; z: number };
export type Hand = { handedness: string; landmarks: Point[] };
export type Frame = { t_ms: number; hands: Hand[] };
export type LandmarkSequence = { frame_size: { width: number; height: number }; frames: Frame[] };
export type Prediction = { label: string; confidence: number };
export type RecognizeResult = { model_version: string; confidence_min: number; predictions: Prediction[] };

export function recognizeDev(sequence: LandmarkSequence, signal?: AbortSignal) {
  return apiPost<RecognizeResult>('/dev/recognize', sequence, signal);
}

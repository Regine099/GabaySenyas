// Webcam + landmark overlay + record/retry; submits the landmark sequence.
// Score over time, attempt history, signs needing practice.
//
// For now: live camera test against the trained model via the DEV-only
// /api/v1/dev/recognize route. Only landmarks are sent, never video.
import type { HandLandmarkerResult } from '@mediapipe/tasks-vision'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../../api/client'
import { recognizeDev, type Frame, type RecognizeResult } from '../../api/recognition'
import CameraView from '../../components/CameraView'

const WINDOW_MS = 1500 // ~45 frames at 30 fps, same as the Python demo
const MIN_FRAME_GAP_MS = 30 // the camera gives ~30 fps; skip repeated detections of the same frame
const PREDICT_EVERY_MS = 200
const MIN_HAND_FRAMES = 5

function toFrame(result: HandLandmarkerResult, ts: number): Frame {
  return {
    t_ms: Math.round(ts),
    hands: result.landmarks.map((lms, i) => ({
      handedness: (result.handedness[i]?.[0]?.categoryName ?? 'unknown').toLowerCase(),
      landmarks: lms.map((p) => ({ x: +p.x.toFixed(5), y: +p.y.toFixed(5), z: +p.z.toFixed(5) })),
    })),
  }
}

export default function CameraTest() {
  const [fps, setFps] = useState(0)
  const [handCount, setHandCount] = useState(0)
  const [result, setResult] = useState<RecognizeResult | null>(null)
  const [error, setError] = useState('')

  const fpsTimes = useRef<number[]>([])
  const buffer = useRef<Frame[]>([])
  const aspect = useRef(4 / 3)
  const inFlight = useRef(false)
  const lastSent = useRef(0)
  const abort = useRef<AbortController | null>(null)

  useEffect(() => () => abort.current?.abort(), [])

  const predict = useCallback(async () => {
    const frames = buffer.current
    if (frames.filter((f) => f.hands.length).length < MIN_HAND_FRAMES) {
      setResult(null)
      return
    }
    inFlight.current = true
    abort.current = new AbortController()
    try {
      const r = await recognizeDev(
        { frame_size: { width: aspect.current, height: 1 }, frames: [...frames] },
        abort.current.signal,
      )
      setResult(r)
      setError('')
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      if (e instanceof ApiError && e.code === 'NO_HANDS_DETECTED') setResult(null)
      else setError(e instanceof Error ? e.message : String(e))
    } finally {
      inFlight.current = false
    }
  }, [])

  const onFrame = useCallback(
    (res: HandLandmarkerResult, ts: number, frameAspect: number) => {
      aspect.current = frameAspect
      fpsTimes.current.push(ts)
      while (fpsTimes.current.length && ts - fpsTimes.current[0] > 1000) fpsTimes.current.shift()

      const buf = buffer.current
      if (!buf.length || ts - buf[buf.length - 1].t_ms >= MIN_FRAME_GAP_MS) {
        buf.push(toFrame(res, ts))
        while (buf.length && ts - buf[0].t_ms > WINDOW_MS) buf.shift()
      }

      setFps(fpsTimes.current.length)
      setHandCount(res.landmarks.length)

      if (!inFlight.current && ts - lastSent.current >= PREDICT_EVERY_MS) {
        lastSent.current = ts
        void predict()
      }
    },
    [predict],
  )

  const top = result?.predictions[0]
  const sure = !!top && !!result && top.confidence >= result.confidence_min

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <CameraView onFrame={onFrame} />
      <div className="space-y-4 text-sm">
        <h1 className="text-xl font-semibold">Live sign recognition</h1>

        <div className="rounded-xl border border-slate-200 p-4 text-center">
          {top ? (
            <>
              <div className={`text-6xl font-bold ${sure ? 'text-green-600' : 'text-slate-400'}`}>{top.label}</div>
              <div className="mt-1 text-slate-600">
                {sure ? `${Math.round(top.confidence * 100)}% confident` : 'Not sure yet — hold the sign steady'}
              </div>
            </>
          ) : (
            <div className="py-6 text-slate-500">{handCount ? 'Reading your hand…' : 'Show your hand to the camera'}</div>
          )}
        </div>

        {result && result.predictions.length > 1 && (
          <div>
            <h2 className="font-medium">Top guesses</h2>
            <ul className="mt-1 space-y-1">
              {result.predictions.map((p) => (
                <li key={p.label} className="flex items-center gap-2">
                  <span className="w-6 font-mono">{p.label}</span>
                  <span className="h-2 flex-1 rounded bg-slate-100">
                    <span className="block h-2 rounded bg-slate-500" style={{ width: `${p.confidence * 100}%` }} />
                  </span>
                  <span className="w-10 text-right tabular-nums">{Math.round(p.confidence * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <p className="rounded bg-red-50 p-2 text-red-700">{error}</p>}

        <p className="text-slate-500">
          FPS {fps} · hands {handCount}
          {result && ` · model ${result.model_version}`}
        </p>
        <p className="text-xs text-slate-400">Practice feedback only, not an official FSL assessment.</p>
      </div>
    </div>
  )
}

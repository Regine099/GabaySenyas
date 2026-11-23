// Score over time, attempt history, signs needing practice.
import type { HandLandmarkerResult } from '@mediapipe/tasks-vision'
import { useCallback, useRef, useState } from 'react'
import CameraView from '../../components/CameraView'

export default function CameraTest() {
  const [info, setInfo] = useState({ hands: [] as string[], fps: 0 })
  const frames = useRef<number[]>([])

  const onFrame = useCallback((result: HandLandmarkerResult, ts: number) => {
    frames.current.push(ts)
    while (frames.current.length && ts - frames.current[0] > 1000) frames.current.shift()
    const hands = result.handedness.map((h) => `${h[0].categoryName} (${h[0].score.toFixed(2)})`)
    setInfo({ hands, fps: frames.current.length })
  }, [])

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <CameraView onFrame={onFrame} />
      <div className="space-y-2 text-sm">
        <h1 className="text-xl font-semibold">Hand tracking check</h1>
        <p>FPS: {info.fps}</p>
        <p>Hands detected: {info.hands.length}</p>
        <ul className="list-disc pl-5">
          {info.hands.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
        <p className="text-slate-500">Each hand gives 21 landmarks (x, y, z).</p>
      </div>
    </div>
  )
}

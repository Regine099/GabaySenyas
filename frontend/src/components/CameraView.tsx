// Requests camera permission, shows live video, handles denied / no-camera states.
import type { HandLandmarkerResult } from '@mediapipe/tasks-vision'
import { useEffect, useRef, useState } from 'react'
import { getHandLandmarker } from '../lib/landmarker'
import { drawLandmarks } from './LandmarkOverlay'

type Props = {
  /** Called once per processed video frame with the raw MediaPipe result and the frame's width/height ratio. */
  onFrame?: (result: HandLandmarkerResult, timestampMs: number, aspect: number) => void
  className?: string
}

type Status = 'loading' | 'running' | 'error'

export default function CameraView({ onFrame, className = '' }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onFrameRef = useRef(onFrame)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    onFrameRef.current = onFrame
  }, [onFrame])

  useEffect(() => {
    let stream: MediaStream | null = null
    let raf = 0
    let cancelled = false
    let lastTs = -1

    async function start() {
      try {
        // Track the stream the moment it exists, so cleanup can always stop it, even if the hand
        // tracker fails to load or the user leaves the page while we are still starting up.
        const mediaPromise = navigator.mediaDevices
          .getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false })
          .then((m) => {
            stream = m
            if (cancelled) m.getTracks().forEach((t) => t.stop())
            return m
          })
        const [landmarker] = await Promise.all([getHandLandmarker(), mediaPromise])
        if (cancelled || !stream) return
        const video = videoRef.current!
        const canvas = canvasRef.current!
        video.srcObject = stream
        await video.play()
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')!
        setStatus('running')

        const loop = () => {
          if (cancelled) return
          if (video.readyState >= 2) {
            // detectForVideo requires strictly increasing timestamps.
            const ts = Math.max(performance.now(), lastTs + 1)
            lastTs = ts
            const result = landmarker.detectForVideo(video, ts)
            drawLandmarks(ctx, result.landmarks)
            onFrameRef.current?.(result, ts, video.videoWidth / video.videoHeight)
          }
          raf = requestAnimationFrame(loop)
        }
        loop()
      } catch (e) {
        if (cancelled) return
        setStatus('error')
        setError(e instanceof Error ? e.message : String(e))
      }
    }
    start()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [])

  return (
    <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black ${className}`}>
      {/* Mirrored like a selfie so it feels natural; landmarks are computed on the unmirrored frame. */}
      <video ref={videoRef} className="absolute inset-0 h-full w-full -scale-x-100 object-cover" playsInline muted />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
      {status !== 'running' && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-white">
          {status === 'loading' ? 'Starting camera and hand tracker…' : `Camera error: ${error}`}
        </div>
      )}
    </div>
  )
}

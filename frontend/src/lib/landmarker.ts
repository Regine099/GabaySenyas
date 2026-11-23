import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

const BASE = import.meta.env.BASE_URL

let instance: Promise<HandLandmarker> | null = null

/**
 * Shared HandLandmarker (21 landmarks per hand, up to 2 hands).
 * Wasm runtime and model are served from /public so the app works offline
 * and the runtime version always matches the npm package.
 */
export function getHandLandmarker(): Promise<HandLandmarker> {
  if (!instance) {
    instance = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(`${BASE}mediapipe`)
      const create = (delegate: 'GPU' | 'CPU') =>
        HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: `${BASE}models/hand_landmarker.task`, delegate },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })
      try {
        return await create('GPU')
      } catch {
        return await create('CPU')
      }
    })()
    instance.catch(() => {
      instance = null
    })
  }
  return instance
}

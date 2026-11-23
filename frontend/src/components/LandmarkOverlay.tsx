// Draws hand landmarks (the 21-point skeleton) onto the canvas that sits over the live video.
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

// Hand skeleton styling: one colour per finger, palm in neutral white.
const FINGERS: { color: string; bones: [number, number][] }[] = [
  { color: '#f472b6', bones: [[0, 1], [1, 2], [2, 3], [3, 4]] }, // thumb
  { color: '#facc15', bones: [[5, 6], [6, 7], [7, 8]] }, // index
  { color: '#4ade80', bones: [[9, 10], [10, 11], [11, 12]] }, // middle
  { color: '#38bdf8', bones: [[13, 14], [14, 15], [15, 16]] }, // ring
  { color: '#a78bfa', bones: [[17, 18], [18, 19], [19, 20]] }, // pinky
]
const PALM: [number, number][] = [[0, 5], [5, 9], [9, 13], [13, 17], [0, 17]]
const TIPS = new Set([4, 8, 12, 16, 20])

/** Clears the canvas and draws every detected hand. Call once per video frame. */
export function drawLandmarks(ctx: CanvasRenderingContext2D, hands: NormalizedLandmark[][]) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  for (const hand of hands) drawHand(ctx, hand)
}

/** Draws one hand's skeleton. Landmark x/y are normalized (0–1) and scaled to the canvas size. */
export function drawHand(ctx: CanvasRenderingContext2D, hand: NormalizedLandmark[]) {
  const { width: w, height: h } = ctx.canvas
  const pt = (i: number) => [hand[i].x * w, hand[i].y * h] as const
  const line = (bones: [number, number][], color: string, width: number) => {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    for (const [a, b] of bones) {
      ctx.moveTo(...pt(a))
      ctx.lineTo(...pt(b))
    }
    ctx.stroke()
  }

  // Dark halo first so the skeleton stays readable on any background.
  const allBones = [...PALM, ...FINGERS.flatMap((f) => f.bones)]
  line(allBones, 'rgba(0,0,0,0.45)', 8)
  line(PALM, 'rgba(255,255,255,0.85)', 4)
  for (const f of FINGERS) line(f.bones, f.color, 4)

  // Joints: white-rimmed dots, fingertips larger and filled with the finger colour.
  const tipColor = new Map(FINGERS.map((f) => [f.bones[f.bones.length - 1][1], f.color]))
  for (let i = 0; i < hand.length; i++) {
    const [x, y] = pt(i)
    const tip = TIPS.has(i)
    ctx.beginPath()
    ctx.arc(x, y, tip ? 7 : 4.5, 0, Math.PI * 2)
    ctx.fillStyle = tip ? tipColor.get(i)! : '#ffffff'
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = tip ? '#ffffff' : 'rgba(0,0,0,0.6)'
    ctx.stroke()
  }
}

// Draws hand landmarks (the 21-point skeleton) onto the canvas that sits over the live video.
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

// Hand skeleton styling: neon glow look — cyan bones, glowing white joints, magenta fingertips.
const BONE = '#22d3ee'
const BONE_CORE = '#e0faff'
const TIP = '#f0abfc'
const TIP_GLOW = '#d946ef'

const BONES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [5, 6], [6, 7], [7, 8], // index
  [9, 10], [10, 11], [11, 12], // middle
  [13, 14], [14, 15], [15, 16], // ring
  [17, 18], [18, 19], [19, 20], // pinky
  [0, 5], [5, 9], [9, 13], [13, 17], [0, 17], // palm
]
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

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Bones: a wide blurred glow pass, then a thin bright core on top.
  const bones = (color: string, width: number, blur: number) => {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.shadowColor = BONE
    ctx.shadowBlur = blur
    ctx.beginPath()
    for (const [a, b] of BONES) {
      ctx.moveTo(...pt(a))
      ctx.lineTo(...pt(b))
    }
    ctx.stroke()
  }
  bones(BONE, 5, 18)
  bones(BONE_CORE, 1.5, 6)

  // Joints: small glowing dots; fingertips larger with a magenta glow.
  for (let i = 0; i < hand.length; i++) {
    const [x, y] = pt(i)
    const tip = TIPS.has(i)
    ctx.beginPath()
    ctx.arc(x, y, tip ? 6 : 3, 0, Math.PI * 2)
    ctx.fillStyle = tip ? TIP : BONE_CORE
    ctx.shadowColor = tip ? TIP_GLOW : BONE
    ctx.shadowBlur = tip ? 20 : 10
    ctx.fill()
  }

  ctx.restore()
}

/**
 * Shared analog movement input for the third-person controller.
 *
 * This is the integration point for an on-screen / touch joystick (owned by the
 * HUD agent). The HUD imports `setJoyInput` and calls it whenever its joystick
 * moves; the engine's ThirdPersonPlayer reads `getJoyInput()` every frame and
 * blends it with keyboard input.
 *
 * Convention (screen-style, matches a thumbstick):
 *   x: -1 (left)  .. +1 (right)
 *   y: -1 (down/back) .. +1 (up/forward)
 *
 * Two equivalent ways to feed input — pick whichever is convenient:
 *   1. import { setJoyInput } from '@/game3d/engine'  // then setJoyInput(x, y)
 *   2. window.dispatchEvent(new CustomEvent('ll-joy', { detail: { x, y } }))
 *
 * Both routes update the same module-level vector, so no React state churn.
 */
export interface JoyVector {
  x: number
  y: number
}

const joy: JoyVector = { x: 0, y: 0 }

function clamp1(n: number): number {
  if (Number.isNaN(n)) return 0
  return n < -1 ? -1 : n > 1 ? 1 : n
}

/** Set the current analog stick value. Components/HUD call this. */
export function setJoyInput(x: number, y: number): void {
  joy.x = clamp1(x)
  joy.y = clamp1(y)
}

/** Read the live joystick vector (do not mutate the returned object). */
export function getJoyInput(): Readonly<JoyVector> {
  return joy
}

/** Reset to neutral (e.g. on touch-end or when input is frozen). */
export function clearJoyInput(): void {
  joy.x = 0
  joy.y = 0
}

let listening = false

/**
 * Begin listening for `ll-joy` CustomEvents on window. Idempotent and safe to
 * call from multiple components; returns a disposer that the *last* caller can
 * use, though most consumers can ignore it. The controller wires this up on
 * mount so the event route works out of the box.
 */
export function startJoyEventBridge(): () => void {
  if (typeof window === 'undefined') return () => {}
  if (listening) return () => {}
  listening = true
  const onJoy = (e: Event) => {
    const detail = (e as CustomEvent<Partial<JoyVector>>).detail
    if (!detail) return
    setJoyInput(detail.x ?? 0, detail.y ?? 0)
  }
  window.addEventListener('ll-joy', onJoy as EventListener)
  return () => {
    window.removeEventListener('ll-joy', onJoy as EventListener)
    listening = false
  }
}

import { useEffect, useRef } from 'react'

/**
 * Touch-friendly fire control. Using POINTER events (not `onClick`) is what lets
 * you shoot while the other thumb is on the joystick: a tap-driven click is a
 * single discrete gesture the browser can suppress while another touch is held,
 * whereas pointerdown fires immediately on its own pointer. Holding the button
 * auto-repeats (the weapon's own cooldown gates the actual shots), so you can
 * move and keep firing at the same time.
 */
const FIRE_REPEAT_MS = 80

function emitFire() {
  window.dispatchEvent(new Event('ll-fire'))
}

export function useHoldFire() {
  const timer = useRef<number | null>(null)

  const stop = () => {
    if (timer.current !== null) {
      window.clearInterval(timer.current)
      timer.current = null
    }
  }

  useEffect(() => stop, [])

  const onPointerDown = (e: React.PointerEvent) => {
    // Keep the gesture as our own pointer; don't let it become a scroll/zoom.
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* capture is best-effort */
    }
    emitFire()
    stop()
    timer.current = window.setInterval(emitFire, FIRE_REPEAT_MS)
  }

  return {
    onPointerDown,
    onPointerUp: stop,
    onPointerCancel: stop,
    onPointerLeave: stop,
    style: { touchAction: 'none' as const },
  }
}

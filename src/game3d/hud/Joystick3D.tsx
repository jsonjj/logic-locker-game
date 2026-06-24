import { useEffect, useRef, useState } from 'react'
import * as engine from '../engine'

export interface Joystick3DProps {
  /** Optional extra subscriber; receives the normalized vector each update. */
  onChange?: (x: number, y: number) => void
}

/**
 * INTEGRATION CHANNEL (Agent 1 ⇄ Agent 5)
 * ---------------------------------------
 * Movement input is published on BOTH channels every update, so the engine can
 * consume whichever it wires up first:
 *
 *   1. Guaranteed: a window CustomEvent
 *        window.dispatchEvent(new CustomEvent('ll-joy', { detail: { x, y } }))
 *      where x,y ∈ [-1, 1] in ENGINE convention (see game3d/engine/input.ts):
 *      x = right is +, y = up/forward is + (so "push up" => y > 0 => forward).
 *      The raw screen delta (down is +) is negated before publishing.
 *
 *   2. Optional fast path: if the engine barrel exports a `setJoyInput(x, y)`
 *      function, it is called directly. Detected safely at runtime so this file
 *      compiles even before Agent 1 adds the export.
 */
function publish(x: number, y: number) {
  const setter = (engine as Record<string, unknown>).setJoyInput
  if (typeof setter === 'function') {
    try {
      ;(setter as (x: number, y: number) => void)(x, y)
    } catch {
      /* engine not ready — the event channel still delivers */
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ll-joy', { detail: { x, y } }))
  }
}

/**
 * On-screen thumb-stick for touch / coarse-pointer devices. Always safe to
 * render; CSS hides it on precise-pointer desktops. Reports a normalized vector
 * in [-1, 1] on both axes via the shared 'll-joy' channel (and `onChange`).
 */
export default function Joystick3D({ onChange }: Joystick3DProps) {
  const baseRef = useRef<HTMLDivElement>(null)
  const active = useRef(false)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const [engaged, setEngaged] = useState(false)

  // If we unmount while the stick is held (e.g. the player dies), make sure we
  // don't leave a non-zero vector latched in the shared input.
  useEffect(() => () => publish(0, 0), [])

  function handle(clientX: number, clientY: number) {
    const base = baseRef.current
    if (!base) return
    const r = base.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const max = r.width / 2 - 12
    let dx = clientX - cx
    let dy = clientY - cy
    const len = Math.hypot(dx, dy)
    if (len > max && len > 0) {
      dx = (dx / len) * max
      dy = (dy / len) * max
    }
    setKnob({ x: dx, y: dy })
    const nx = max > 0 ? dx / max : 0
    // Screen Y grows downward; the engine wants up/forward = +. Negate so
    // pushing the stick up walks forward (matching the W key).
    const ny = max > 0 ? -dy / max : 0
    publish(nx, ny)
    onChange?.(nx, ny)
  }

  function start(e: React.PointerEvent) {
    active.current = true
    setEngaged(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    handle(e.clientX, e.clientY)
  }

  function move(e: React.PointerEvent) {
    if (active.current) handle(e.clientX, e.clientY)
  }

  function end() {
    active.current = false
    setEngaged(false)
    setKnob({ x: 0, y: 0 })
    publish(0, 0)
    onChange?.(0, 0)
  }

  return (
    <div
      ref={baseRef}
      className={`hud-joy${engaged ? ' is-engaged' : ''}`}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      role="application"
      aria-label="Movement joystick"
    >
      <span className="hud-joy-ring" aria-hidden />
      <span
        className="hud-joy-knob"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
        aria-hidden
      />
    </div>
  )
}

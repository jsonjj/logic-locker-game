import { useRef, useState } from 'react'

/**
 * An on-screen thumb-stick for touch devices (also works with a mouse). Reports
 * a normalized vector in the range [-1, 1] on both axes.
 *
 * Visual polish only here — fortress-themed ring with directional ticks and an
 * active glow. The public contract (`onChange`) is unchanged.
 */
export default function Joystick({
  onChange,
}: {
  onChange: (v: { x: number; y: number }) => void
}) {
  const baseRef = useRef<HTMLDivElement>(null)
  const active = useRef(false)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const [engaged, setEngaged] = useState(false)

  function handle(clientX: number, clientY: number) {
    const base = baseRef.current
    if (!base) return
    const r = base.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const max = r.width / 2
    let dx = clientX - cx
    let dy = clientY - cy
    const len = Math.hypot(dx, dy)
    if (len > max) {
      dx = (dx / len) * max
      dy = (dy / len) * max
    }
    setKnob({ x: dx, y: dy })
    onChange({ x: dx / max, y: dy / max })
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
    onChange({ x: 0, y: 0 })
  }

  return (
    <div
      className={`joystick ${engaged ? 'engaged' : ''}`}
      ref={baseRef}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      role="application"
      aria-label="Movement joystick"
    >
      <span className="joystick-ring" aria-hidden />
      <span className="joystick-tick up" aria-hidden />
      <span className="joystick-tick down" aria-hidden />
      <span className="joystick-tick left" aria-hidden />
      <span className="joystick-tick right" aria-hidden />
      <div
        className="joystick-knob"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      />
    </div>
  )
}

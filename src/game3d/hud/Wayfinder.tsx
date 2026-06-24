import { useEffect, useRef } from 'react'
import { useGameState } from '../state/GameStateContext'

/**
 * A top-center wayfinding readout: a compass arrow that points toward the
 * current objective plus the live distance to it. The camera bearing is fixed
 * (screen-up = world -z, screen-right = world +x), so the on-screen arrow angle
 * is simply atan2(dx, -dz). Driven from refs in a rAF loop — no React churn.
 */
export default function Wayfinder() {
  const gs = useGameState()
  const gameRef = useRef(gs)
  gameRef.current = gs

  const rootRef = useRef<HTMLDivElement>(null)
  const arrowRef = useRef<HTMLDivElement>(null)
  const distRef = useRef<HTMLSpanElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    let lastLabel = ''
    const tick = () => {
      const g = gameRef.current
      const target = g.objective?.target ?? null
      const root = rootRef.current
      if (root) {
        if (!target) {
          if (root.style.display !== 'none') root.style.display = 'none'
        } else {
          if (root.style.display !== 'flex') root.style.display = 'flex'
          const p = g.playerPos.current
          const dx = target.x - p.x
          const dz = target.z - p.z
          const dist = Math.hypot(dx, dz)
          if (distRef.current) distRef.current.textContent = `${Math.max(0, Math.round(dist))} m`
          if (arrowRef.current) {
            const angle = Math.atan2(dx, -dz) // 0 = straight ahead (away from camera)
            arrowRef.current.style.transform = `rotate(${angle}rad)`
          }
          const label = g.objective?.text ?? ''
          if (labelRef.current && label !== lastLabel) {
            labelRef.current.textContent = label
            lastLabel = label
          }
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div ref={rootRef} className="hud-wayfinder" style={{ display: 'none' }} aria-hidden="true">
      <div className="hud-wayfinder-compass">
        <div ref={arrowRef} className="hud-wayfinder-arrow" />
      </div>
      <div className="hud-wayfinder-info">
        <span ref={labelRef} className="hud-wayfinder-label" />
        <span ref={distRef} className="hud-wayfinder-dist">0 m</span>
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'
import type { Vec2 } from '../lockdown/contracts'
import { project } from './projection'

export interface IsoEntityProps {
  /** World-space position (x, y in 0..100). */
  pos: Vec2
  /** Lift the entity off the floor (jumps / tall props). Shadow stays grounded. */
  elevation?: number
  children: ReactNode
  /** Render a soft ground shadow under the entity (default true). */
  shadow?: boolean
}

/**
 * Positions a child at a world point using the iso `project()` transform,
 * assigns a painter's-algorithm z-index from the projected depth, and drops a
 * soft ground shadow. Movement stays in world coordinates — this only handles
 * the render-time placement.
 */
export default function IsoEntity({ pos, elevation = 0, children, shadow = true }: IsoEntityProps) {
  const point = project(pos, { elevation })
  // The shadow always sits on the ground footprint, even mid-jump.
  const ground = elevation ? project(pos) : point

  // Airborne entities cast a smaller, fainter shadow.
  const lift = Math.max(0, elevation)
  const shadowScale = 1 / (1 + lift * 0.015)
  const shadowOpacity = 1 / (1 + lift * 0.02)

  return (
    <>
      {shadow && (
        <div
          className="iso-shadow"
          style={{
            left: `${ground.left}%`,
            top: `${ground.top}%`,
            zIndex: point.z - 1,
            transform: `translate(-50%, -50%) scaleY(0.5) scale(${shadowScale})`,
            opacity: shadowOpacity,
          }}
          aria-hidden
        />
      )}
      <div
        className="iso-entity"
        style={{ left: `${point.left}%`, top: `${point.top}%`, zIndex: point.z }}
      >
        {children}
      </div>
    </>
  )
}

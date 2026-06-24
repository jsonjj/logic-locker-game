import type { CSSProperties, ReactNode } from 'react'
import '../../styles/iso.css'

export interface IsoStageProps {
  children?: ReactNode
  /** Fortress room flavor — tints accents and framing. */
  variant?: 'corridor' | 'cell' | 'vault'
  /** Pursuer proximity glow, 0 (safe) .. 1 (caught up). */
  danger?: number
}

/**
 * A presentational 2.5D fortress stage. Renders a dimetric floor with an iso
 * grid, framing walls, an ambient vignette, and a pursuer danger glow, plus a
 * children layer where iso entities are placed.
 *
 * It layers on top of the existing `.game-stage` so it inherits the current
 * sizing/aspect conventions and slots straight into the game layout.
 */
export default function IsoStage({ children, variant = 'corridor', danger = 0 }: IsoStageProps) {
  const clampedDanger = danger < 0 ? 0 : danger > 1 ? 1 : danger

  return (
    <div
      className={`game-stage iso-stage variant-${variant}`}
      style={{ '--iso-danger': clampedDanger } as CSSProperties}
    >
      {/* Depth framing */}
      <div className="iso-walls">
        <div className="iso-wall-back" />
        <div className="iso-wall-side left" />
        <div className="iso-wall-side right" />
      </div>

      {/* Dimetric floor plane + scored grid */}
      <div className="iso-floor">
        <div className="iso-floor-grid" />
        <div className="iso-floor-edge" />
      </div>

      {/* Entities live here, sorted by their projected z-index */}
      <div className="iso-layer">{children}</div>

      {/* Atmosphere */}
      <div className="iso-vignette" />
      <div className="iso-danger" />
    </div>
  )
}

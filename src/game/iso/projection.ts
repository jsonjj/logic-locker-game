import type { IsoPoint, IsoProject, Vec2 } from '../lockdown/contracts'

/**
 * Lightweight 2.5D isometric projection for "Logic Locker: Lockdown".
 *
 * Movement logic stays top-down in world space (x, y in 0..100). This module is
 * a pure, render-time visual transform that fakes depth with a dimetric (45°
 * rotate + vertical squash) projection — no WebGL, no 3D transforms, just cheap
 * arithmetic so it stays buttery on low-end school laptops/tablets.
 *
 * The output is expressed as percentages of the stage so it scales cleanly with
 * the existing `.game-stage` sizing conventions.
 */

/** Horizontal center of the projected diamond, in stage-%. */
const ORIGIN_LEFT = 50
/** Vertical anchor of the projected diamond, in stage-%. */
const ORIGIN_TOP = 50
/** Half-width of the projected play diamond, in stage-%. */
const SPREAD_X = 22
/** Vertical squash — smaller than SPREAD_X is what sells the dimetric tilt. */
const SPREAD_Y = 12.5
/** How far one unit of `elevation` lifts an entity up the screen, in stage-%. */
const ELEVATION_SCALE = 0.32

/** Ratio (height / width) of the foreshortened floor plane. */
export const ISO_SQUASH = SPREAD_Y / SPREAD_X

/**
 * Project a top-down world point to iso screen space (stage percentages).
 *
 * `opts.elevation` raises the entity toward the top of the screen (for jumps or
 * tall objects) WITHOUT changing its painter-depth, so a jumping hero still
 * sorts against the floor by where its feet actually are.
 */
export const project: IsoProject = (world: Vec2, opts?: { elevation?: number }): IsoPoint => {
  const elevation = opts?.elevation ?? 0

  // Normalize world 0..100 to -1..1 around the field center.
  const nx = (world.x - 50) / 50
  const ny = (world.y - 50) / 50

  // Rotate 45° into the diamond, then squash vertically for the dimetric look.
  const isoX = nx - ny
  const isoY = nx + ny

  const left = ORIGIN_LEFT + isoX * SPREAD_X
  const top = ORIGIN_TOP + isoY * SPREAD_Y - elevation * ELEVATION_SCALE

  // Painter's-algorithm depth from the GROUND footprint (front = larger x + y).
  // Elevation is intentionally excluded so airborne entities keep their footing.
  const z = Math.round((world.x + world.y) * 10)

  return { left, top, z }
}

/**
 * CSS transform that turns a plain square element into a matching iso floor
 * tile / plane. Pairs with `project` so a decorative grid lines up with placed
 * entities. Pure 2D (rotate + scaleY) — safe and fast everywhere.
 */
export function tileTransform(scale = 1): string {
  return `rotate(45deg) scaleY(${(ISO_SQUASH * scale).toFixed(4)})`
}

/** Convenience: project straight to an inline-style-ready object. */
export function projectStyle(
  world: Vec2,
  opts?: { elevation?: number },
): { left: string; top: string; zIndex: number } {
  const p = project(world, opts)
  return { left: `${p.left}%`, top: `${p.top}%`, zIndex: p.z }
}

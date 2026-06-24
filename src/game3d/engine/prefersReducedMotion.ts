/**
 * Tiny, dependency-free accessor for the user's reduced-motion preference.
 *
 * Read this every frame inside useFrame loops — it is a cheap boolean lookup
 * (the MediaQueryList is created once and cached) so animation code can snap
 * instead of interpolating when the user prefers reduced motion.
 */
let mql: MediaQueryList | null = null

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  if (!mql) mql = window.matchMedia('(prefers-reduced-motion: reduce)')
  return mql.matches
}

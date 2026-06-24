import { useCallback, useEffect, useRef, useState } from 'react'

export type Facing = 'up' | 'down' | 'left' | 'right'

export interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

interface Options {
  start?: { x: number; y: number }
  /** Movement speed in percent-of-stage-width per second. */
  speed?: number
  /** When true, input is ignored (e.g. a question modal is open). */
  frozen?: boolean
  bounds?: Bounds
  /** Roughly the stage width / height, used to keep vertical speed feeling even. */
  aspect?: number
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v
}

const HELD: Record<string, boolean> = {}

/**
 * A small top-down movement controller. Positions are expressed in percentages
 * (0–100) of the stage so the world scales cleanly across screen sizes. Reads
 * WASD / arrow keys and an optional on-screen joystick vector.
 */
export function useTopDownPlayer({
  start = { x: 50, y: 82 },
  speed = 32,
  frozen = false,
  bounds = { minX: 6, maxX: 94, minY: 16, maxY: 90 },
  aspect = 1.55,
}: Options) {
  const posRef = useRef({ ...start })
  const [pos, setPos] = useState({ ...start })
  const [facing, setFacing] = useState<Facing>('down')
  const [moving, setMoving] = useState(false)

  const joy = useRef({ x: 0, y: 0 })
  const frozenRef = useRef(frozen)
  frozenRef.current = frozen

  // Latest values kept in refs so the rAF loop can avoid redundant setState.
  const facingRef = useRef<Facing>('down')
  const movingRef = useRef(false)

  const setJoy = useCallback((v: { x: number; y: number }) => {
    joy.current = v
  }, [])

  useEffect(() => {
    function isMoveKey(k: string) {
      return (
        k === 'arrowup' ||
        k === 'arrowdown' ||
        k === 'arrowleft' ||
        k === 'arrowright' ||
        k === 'w' ||
        k === 'a' ||
        k === 's' ||
        k === 'd'
      )
    }
    function down(e: KeyboardEvent) {
      const k = e.key.toLowerCase()
      if (k.startsWith('arrow')) e.preventDefault()
      if (isMoveKey(k)) HELD[k] = true
    }
    function up(e: KeyboardEvent) {
      HELD[e.key.toLowerCase()] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      let dx = 0
      let dy = 0
      if (!frozenRef.current) {
        if (HELD['arrowleft'] || HELD['a']) dx -= 1
        if (HELD['arrowright'] || HELD['d']) dx += 1
        if (HELD['arrowup'] || HELD['w']) dy -= 1
        if (HELD['arrowdown'] || HELD['s']) dy += 1
        dx += joy.current.x
        dy += joy.current.y
      }

      const len = Math.hypot(dx, dy)
      if (len > 0.08) {
        const nx = dx / Math.max(1, len)
        const ny = dy / Math.max(1, len)
        const p = posRef.current
        p.x = clamp(p.x + nx * speed * dt, bounds.minX, bounds.maxX)
        p.y = clamp(p.y + ny * speed * aspect * dt, bounds.minY, bounds.maxY)
        setPos({ x: p.x, y: p.y })

        const nextFacing: Facing =
          Math.abs(nx) > Math.abs(ny) ? (nx < 0 ? 'left' : 'right') : ny < 0 ? 'up' : 'down'
        if (nextFacing !== facingRef.current) {
          facingRef.current = nextFacing
          setFacing(nextFacing)
        }
        if (!movingRef.current) {
          movingRef.current = true
          setMoving(true)
        }
      } else if (movingRef.current) {
        movingRef.current = false
        setMoving(false)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [speed, aspect, bounds.minX, bounds.maxX, bounds.minY, bounds.maxY])

  /** Teleport the player (e.g. to resume near the active station). */
  const setPosition = useCallback((x: number, y: number) => {
    posRef.current = { x, y }
    setPos({ x, y })
  }, [])

  return { pos, facing, moving, setJoy, setPosition }
}

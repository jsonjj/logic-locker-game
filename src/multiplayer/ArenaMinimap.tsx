import { useEffect, useRef, type RefObject } from 'react'
import { useGameState } from '../game3d/state/GameStateContext'
import { ARENA_HALF } from './arena'
import type { LiveEnemy } from './SharedEnemies'
import type { NetPlayer } from './types'

interface ArenaMinimapProps {
  playersRef: RefObject<Record<string, NetPlayer>>
  enemiesViewRef: RefObject<Map<string, LiveEnemy> | null>
  ids: string[]
  colors: Record<string, string>
  selfUid: string
}

const SIZE = 150

/**
 * Top-down radar drawn on a 2D canvas: red dots for shared enemies, each
 * player's color dot for friends (yourself ringed in white). Reads everything
 * from refs in a rAF loop, so it never triggers React re-renders.
 */
export default function ArenaMinimap({
  playersRef,
  enemiesViewRef,
  ids,
  colors,
  selfUid,
}: ArenaMinimapProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const gs = useGameState()

  useEffect(() => {
    let raf = 0
    const toPx = (x: number, z: number): [number, number] => [
      ((x / ARENA_HALF) * 0.5 + 0.5) * SIZE,
      ((-z / ARENA_HALF) * 0.5 + 0.5) * SIZE, // -z is "up" (matches the camera)
    ]

    const draw = () => {
      const c = canvas.current
      const ctx = c?.getContext('2d')
      if (c && ctx) {
        ctx.clearRect(0, 0, SIZE, SIZE)
        ctx.fillStyle = 'rgba(12,16,22,0.72)'
        ctx.fillRect(0, 0, SIZE, SIZE)
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'
        ctx.strokeRect(0.5, 0.5, SIZE - 1, SIZE - 1)

        // Enemies.
        const enemies = enemiesViewRef.current
        if (enemies) {
          ctx.fillStyle = '#ff5d6c'
          for (const e of enemies.values()) {
            const [px, py] = toPx(e.x, e.z)
            ctx.beginPath()
            ctx.arc(px, py, 2.2, 0, Math.PI * 2)
            ctx.fill()
          }
        }

        // Players.
        const players = playersRef.current ?? {}
        for (const uid of ids) {
          let x: number
          let z: number
          let alive = true
          if (uid === selfUid) {
            x = gs.playerPos.current.x
            z = gs.playerPos.current.z
          } else {
            const p = players[uid]
            if (!p || typeof p.x !== 'number' || typeof p.z !== 'number') continue
            x = p.x
            z = p.z
            alive = p.alive !== false
          }
          const [px, py] = toPx(x, z)
          ctx.globalAlpha = alive ? 1 : 0.35
          ctx.fillStyle = colors[uid] ?? '#fff'
          ctx.beginPath()
          ctx.arc(px, py, uid === selfUid ? 4.2 : 3.6, 0, Math.PI * 2)
          ctx.fill()
          if (uid === selfUid) {
            ctx.lineWidth = 1.6
            ctx.strokeStyle = '#fff'
            ctx.stroke()
          }
          ctx.globalAlpha = 1
        }
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [ids, colors, selfUid, gs, playersRef, enemiesViewRef])

  return (
    <div className="mp-minimap">
      <canvas ref={canvas} width={SIZE} height={SIZE} />
      <div className="mp-minimap-legend">
        <span><i style={{ background: '#ff5d6c' }} /> Foe</span>
        <span><i style={{ background: '#fff' }} /> You</span>
      </div>
    </div>
  )
}

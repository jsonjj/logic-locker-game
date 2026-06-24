import type { ReactNode } from 'react'
import { Floor, Wall, Door } from '../engine'
import { RoomDressing } from './decor'
import { paletteFor } from './palette'
import { toTuple, type RoomDef } from '../contracts'

export interface RoomShellProps {
  def: RoomDef
  /** Whether the exit door is open (puzzle solved). */
  exitOpen: boolean
  /** Player walked through the open exit. */
  onExit?: () => void
  /** Point wayfinding at the exit door. */
  highlightExit?: boolean
  /** Puzzle devices / set dressing placed inside the room. */
  children?: ReactNode
}

/**
 * [Agent 2 owns this file] A single, fully-enclosed sector room built from
 * engine primitives + themed decor. Four solid walls box the player in; the only
 * way forward is the exit door on the far (-z) wall, which the integrator opens
 * once the puzzle is solved. The +z wall shows the (now sealed) entrance the
 * player arrived through so the space reads as a real room.
 */
export default function RoomShell({ def, exitOpen, onExit, highlightExit, children }: RoomShellProps) {
  const [w, d] = def.size
  const p = paletteFor(def.theme)
  const wallH = 4

  return (
    <group>
      <Floor size={[w, d]} theme={def.theme} color={p.floor} />

      {/* enclosure */}
      <Wall position={[0, wallH / 2, -d / 2]} size={[w, wallH, 0.5]} color={p.wall} />
      <Wall position={[0, wallH / 2, d / 2]} size={[w, wallH, 0.5]} color={p.wall} />
      <Wall position={[-w / 2, wallH / 2, 0]} size={[0.5, wallH, d]} color={p.wall} />
      <Wall position={[w / 2, wallH / 2, 0]} size={[0.5, wallH, d]} color={p.wall} />

      {/* hanging light fixtures so the room reads bright and lived-in (no solid
          roof — keeps the overhead camera's view clear) */}
      {[-d / 4, d / 4].map((z) => (
        <group key={z} position={[0, wallH - 0.3, z]}>
          <mesh>
            <boxGeometry args={[w * 0.5, 0.2, 1.1]} />
            <meshStandardMaterial color="#fdf6e3" emissive="#fff3d6" emissiveIntensity={1.3} />
          </mesh>
          <pointLight position={[0, -0.5, 0]} intensity={7} distance={22} decay={2} color="#ffe9c2" />
        </group>
      ))}

      {/* baseboard accent trim along each wall (cheap polish, no colliders) */}
      <mesh position={[0, 0.15, -d / 2 + 0.3]} receiveShadow>
        <boxGeometry args={[w, 0.3, 0.12]} />
        <meshStandardMaterial color={p.accent} emissive={p.glow} emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, 0.15, d / 2 - 0.3]} receiveShadow>
        <boxGeometry args={[w, 0.3, 0.12]} />
        <meshStandardMaterial color={p.accent} emissive={p.glow} emissiveIntensity={0.15} />
      </mesh>

      {/* sealed entrance the player arrived through (closed -> blocks) */}
      <Door position={[0, 1.5, d / 2 - 0.3]} rotationY={0} open={false} label="Sealed" />

      {/* themed set dressing (kept clear of the central puzzle anchor) */}
      <RoomDressing def={def} />

      {/* exit / objective door on the far wall */}
      <Door
        position={toTuple(def.exitDoor.position)}
        rotationY={def.exitDoor.rotationY}
        open={exitOpen}
        label={def.exitDoor.label}
        highlight={highlightExit}
        onEnter={onExit}
      />

      {children}
    </group>
  )
}

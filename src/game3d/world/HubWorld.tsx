import { Floor, Wall, Door } from '../engine'
import { hubDef } from './rooms'
import { paletteFor } from './palette'
import { toTuple, type SectorId } from '../contracts'

export interface HubWorldProps {
  /** Which sector doors are unlocked (walkable). */
  unlocked: Set<SectorId>
  /** Which sector the wayfinding should currently point to. */
  objectiveSectorId?: SectorId | null
  onEnterSector: (sectorId: SectorId) => void
}

const WALL_H = 6

/** A small stack of cubes above a door encoding its sector number (1..7). */
function DoorNumber({
  count,
  position,
  rotationY,
  color,
}: {
  count: number
  position: [number, number, number]
  rotationY: number
  color: string
}) {
  const pips = Array.from({ length: count }, (_, i) => i)
  const span = (count - 1) * 0.34
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {pips.map((i) => (
        <mesh key={i} position={[i * 0.34 - span / 2, 0, 0.18]}>
          <boxGeometry args={[0.22, 0.22, 0.1]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
        </mesh>
      ))}
    </group>
  )
}

/** A glowing ceiling light panel that also casts a little real light. */
function CeilingLight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[5, 0.25, 1.4]} />
        <meshStandardMaterial color="#fdf6e3" emissive="#fff3d6" emissiveIntensity={1.4} />
      </mesh>
      <pointLight position={[0, -0.6, 0]} intensity={9} distance={26} decay={2} color="#ffe9c2" />
    </group>
  )
}

/**
 * The prison's central hall — an ENCLOSED, lit interior (floor + perimeter walls
 * + ceiling + ceiling lights), ringed by one numbered cell-block door per sector.
 * Reads clearly as "inside the prison" rather than an empty dark void. Doors open
 * when their sector is unlocked and glow when they're the current objective.
 */
export default function HubWorld({ unlocked, objectiveSectorId, onEnterSector }: HubWorldProps) {
  const [w, d] = hubDef.size
  const p = paletteFor('yard')

  // Ceiling light grid positions.
  const lightCols = [-w / 4, w / 4]
  const lightRows = [-d / 3, 0, d / 3]

  // Support columns near the walls so the hall has interior structure (kept off
  // the central walking path and away from the doors).
  const columns: [number, number][] = [
    [-w / 4, -d / 4],
    [w / 4, -d / 4],
    [-w / 4, d / 4],
    [w / 4, d / 4],
  ]

  return (
    <group>
      <Floor size={[w, d]} theme="yard" color={p.floor} />

      {/* perimeter walls (continuous, solid) */}
      <Wall position={[0, WALL_H / 2, -d / 2]} size={[w, WALL_H, 0.8]} color={p.wall} />
      <Wall position={[0, WALL_H / 2, d / 2]} size={[w, WALL_H, 0.8]} color={p.wall} />
      <Wall position={[-w / 2, WALL_H / 2, 0]} size={[0.8, WALL_H, d]} color={p.wall} />
      <Wall position={[w / 2, WALL_H / 2, 0]} size={[0.8, WALL_H, d]} color={p.wall} />

      {/* ceiling beams across the hall — interior feel without occluding the
          overhead third-person camera (no solid roof) */}
      {[-w / 3, 0, w / 3].map((x) => (
        <mesh key={`beam-${x}`} position={[x, WALL_H - 0.1, 0]}>
          <boxGeometry args={[0.5, 0.5, d]} />
          <meshStandardMaterial color="#2b313b" />
        </mesh>
      ))}

      {/* ceiling light grid */}
      {lightRows.map((z) =>
        lightCols.map((x) => (
          <CeilingLight key={`${x}_${z}`} position={[x, WALL_H - 0.4, z]} />
        )),
      )}

      {/* interior support columns */}
      {columns.map(([x, z], i) => (
        <Wall key={`col-${i}`} position={[x, WALL_H / 2, z]} size={[1.2, WALL_H, 1.2]} color={p.accent} />
      ))}

      {/* central muster pad with a guiding glow ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.6, 3.1, 48]} />
        <meshStandardMaterial color={p.glow} emissive={p.glow} emissiveIntensity={0.7} />
      </mesh>

      {hubDef.doors.map((door, i) => {
        if (door.to === 'hub') return null
        const sectorId = door.to
        const open = unlocked.has(sectorId)
        const isObjective = objectiveSectorId === sectorId
        const pos = toTuple(door.position)
        const rotY = door.rotationY ?? 0
        const pipColor = isObjective ? '#f5a524' : open ? p.glow : '#5a6473'
        return (
          <group key={sectorId}>
            <Door
              position={pos}
              rotationY={rotY}
              open={open}
              label={door.label}
              highlight={isObjective}
              onEnter={() => onEnterSector(sectorId)}
            />
            <DoorNumber count={i + 1} position={[pos[0], 4.2, pos[2]]} rotationY={rotY} color={pipColor} />
          </group>
        )
      })}
    </group>
  )
}

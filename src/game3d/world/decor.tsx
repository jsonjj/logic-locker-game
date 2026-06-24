import { useMemo } from 'react'
import { Wall, Prop } from '../engine'
import { InstancedBoxes, type BoxInstance } from './Instanced'
import { paletteFor, type ThemePalette } from './palette'
import type { RoomDef } from '../contracts'

/**
 * [Agent 2] Low-poly, physics-aware set dressing for the hub and each room
 * theme. Structural obstacles (towers, generators, shelves, consoles, bunks)
 * use the engine `Wall`/`Prop` colliders so the player can't clip through them;
 * fine repeating detail (bars, drawers, screens, pipes, wire, lights) is drawn
 * with a single `InstancedBoxes` family per visual type for cheap rendering.
 */

interface ThemeDressingProps {
  w: number
  d: number
  p: ThemePalette
}

// ---------------------------------------------------------------------------
// Hub yard
// ---------------------------------------------------------------------------

function GuardTower({ x, z, p }: { x: number; z: number; p: ThemePalette }) {
  return (
    <group>
      {/* support column (collider) */}
      <Wall position={[x, 4, z]} size={[2.6, 8, 2.6]} color="#2c333d" />
      {/* watch cabin (collider) */}
      <Wall position={[x, 8.8, z]} size={[4.4, 2.2, 4.4]} color={p.accent} />
      {/* pyramid roof */}
      <mesh position={[x, 10.6, z]} castShadow>
        <coneGeometry args={[3.4, 1.6, 4]} />
        <meshStandardMaterial color="#1c2128" roughness={0.9} />
      </mesh>
      {/* searchlight */}
      <mesh position={[x, 8.8, z]}>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshStandardMaterial color={p.glow} emissive={p.glow} emissiveIntensity={1.1} />
      </mesh>
    </group>
  )
}

export function YardDressing({ size }: { size: [number, number] }) {
  const p = paletteFor('yard')
  const [w, d] = size

  const { floods, lamps, wire } = useMemo(() => {
    const floods: BoxInstance[] = []
    const lamps: BoxInstance[] = []
    const wire: BoxInstance[] = []
    const inset = 2.5
    const xs = [-w / 2 + inset, w / 2 - inset]
    const zs = [-d / 2 + 12, 0, d / 2 - 12]
    for (const x of xs) {
      for (const z of zs) {
        floods.push({ position: [x, 3, z], scale: [0.3, 6, 0.3] })
        lamps.push({ position: [x, 6, z], scale: [0.9, 0.4, 0.6] })
      }
    }
    const top = 4.2
    for (let x = -w / 2 + 2; x <= w / 2 - 2 + 0.01; x += 4) {
      wire.push({ position: [x, top, -d / 2 + 0.4], scale: [3.6, 0.15, 0.15] })
      wire.push({ position: [x, top, d / 2 - 0.4], scale: [3.6, 0.15, 0.15] })
    }
    for (let z = -d / 2 + 2; z <= d / 2 - 2 + 0.01; z += 4) {
      wire.push({ position: [-w / 2 + 0.4, top, z], scale: [0.15, 0.15, 3.6] })
      wire.push({ position: [w / 2 - 0.4, top, z], scale: [0.15, 0.15, 3.6] })
    }
    return { floods, lamps, wire }
  }, [w, d])

  return (
    <group>
      <GuardTower x={-w / 2 + 4} z={-d / 2 + 4} p={p} />
      <GuardTower x={w / 2 - 4} z={-d / 2 + 4} p={p} />
      <GuardTower x={-w / 2 + 4} z={d / 2 - 4} p={p} />
      <GuardTower x={w / 2 - 4} z={d / 2 - 4} p={p} />

      <InstancedBoxes instances={floods} color="#3a4452" metalness={0.4} roughness={0.6} />
      <InstancedBoxes instances={lamps} color="#20242b" emissive={p.glow} emissiveIntensity={0.9} castShadow={false} />
      <InstancedBoxes instances={wire} color="#5a6473" castShadow={false} receiveShadow={false} />

      {/* central muster pad */}
      <Wall position={[0, 0.15, 0]} size={[10, 0.3, 10]} color="#313842" />
      <mesh position={[0, 0.33, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.6, 4.2, 28]} />
        <meshStandardMaterial color={p.glow} emissive={p.glow} emissiveIntensity={0.5} />
      </mesh>

      {/* supply crates */}
      <Prop position={[13, 0.5, 15]} />
      <Prop position={[14.2, 0.5, 15]} />
      <Prop position={[13.6, 1.5, 15]} />
      <Prop position={[-14, 0.5, 15]} />
      <Prop position={[-12.8, 0.5, 16]} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Cellblock / interrogation
// ---------------------------------------------------------------------------

function CellblockDressing({ w, d, p }: ThemeDressingProps) {
  const { bars, lights, bunks, dividers } = useMemo(() => {
    const bars: BoxInstance[] = []
    const lights: BoxInstance[] = []
    const bunks: { x: number; z: number }[] = []
    const dividers: { x: number; z: number }[] = []
    const frontX = w / 2 - 3
    const bunkX = w / 2 - 1.5
    const cellZs: number[] = []
    for (let z = -d / 2 + 3; z <= d / 2 - 5 + 0.01; z += 3.4) cellZs.push(z)
    for (const sx of [-1, 1]) {
      for (const z0 of cellZs) {
        bunks.push({ x: sx * bunkX, z: z0 })
        dividers.push({ x: sx * bunkX, z: z0 + 1.7 })
        for (let k = 0; k <= 6; k++) {
          const bz = z0 - 1.4 + (k * 2.8) / 6
          bars.push({ position: [sx * frontX, 1.5, bz], scale: [0.1, 3, 0.1] })
        }
        bars.push({ position: [sx * frontX, 0.2, z0], scale: [0.1, 0.1, 2.9] })
        bars.push({ position: [sx * frontX, 2.85, z0], scale: [0.1, 0.1, 2.9] })
      }
    }
    for (let z = -d / 2 + 4; z <= d / 2 - 4 + 0.01; z += 4) {
      lights.push({ position: [0, 3.8, z], scale: [0.6, 0.15, 1.8] })
    }
    return { bars, lights, bunks, dividers }
  }, [w, d])

  return (
    <group>
      <InstancedBoxes instances={bars} color={p.accent} metalness={0.6} roughness={0.4} />
      <InstancedBoxes
        instances={lights}
        color="#20242b"
        emissive={p.glow}
        emissiveIntensity={0.9}
        castShadow={false}
      />
      {bunks.map((b, i) => (
        <Wall key={`bunk-${i}`} position={[b.x, 0.5, b.z]} size={[2.4, 0.5, 1.8]} color={p.wall} />
      ))}
      {dividers.map((dv, i) => (
        <mesh key={`div-${i}`} position={[dv.x, 1.5, dv.z]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 3, 0.12]} />
          <meshStandardMaterial color={p.wall} roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Records vault
// ---------------------------------------------------------------------------

function VaultDressing({ w, d, p }: ThemeDressingProps) {
  const { drawers, shelves } = useMemo(() => {
    const drawers: BoxInstance[] = []
    const shelves: { x: number; z: number; len: number }[] = []
    const len = d - 8
    for (const sx of [-1, 1]) {
      for (const col of [0, 1]) {
        const x = sx * (w / 2 - 3 - col * 4)
        shelves.push({ x, z: 0, len })
        const faceX = x - sx * 0.65
        for (let row = 0; row < 4; row++) {
          for (let zz = -len / 2 + 1; zz <= len / 2 - 1 + 0.01; zz += 1.4) {
            drawers.push({ position: [faceX, 0.6 + row * 0.7, zz], scale: [0.08, 0.5, 1.1] })
          }
        }
      }
    }
    return { drawers, shelves }
  }, [w, d])

  return (
    <group>
      {shelves.map((s, i) => (
        <Wall key={`shelf-${i}`} position={[s.x, 1.6, s.z]} size={[1.2, 3.2, s.len]} color={p.wall} />
      ))}
      <InstancedBoxes
        instances={drawers}
        color={p.accent}
        emissive={p.glow}
        emissiveIntensity={0.25}
        metalness={0.5}
        roughness={0.5}
      />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Surveillance hub
// ---------------------------------------------------------------------------

function SurveillanceCameras({ w, d, glow }: { w: number; d: number; glow: string }) {
  const spots: { x: number; z: number }[] = [
    { x: -w / 2 + 1.5, z: -d / 2 + 1.5 },
    { x: w / 2 - 1.5, z: -d / 2 + 1.5 },
  ]
  return (
    <group>
      {spots.map((s, i) => (
        <group key={`cam-${i}`} position={[s.x, 3.6, s.z]} rotation={[0, i === 0 ? -0.7 : 0.7, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.5, 1]} />
            <meshStandardMaterial color="#222831" />
          </mesh>
          <mesh position={[0, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.3, 10]} />
            <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function SurveillanceDressing({ w, d, p }: ThemeDressingProps) {
  const screens = useMemo(() => {
    const arr: BoxInstance[] = []
    const x = -w / 2 + 0.7
    for (let row = 0; row < 3; row++) {
      for (let zz = -4.5; zz <= 4.5 + 0.01; zz += 1.6) {
        arr.push({ position: [x, 1.6 + row * 1.2, zz], scale: [0.08, 1, 1.4] })
      }
    }
    return arr
  }, [w])

  return (
    <group>
      {/* monitor wall backing */}
      <Wall position={[-w / 2 + 0.4, 2.2, 0]} size={[0.3, 4, 12]} color={p.wall} />
      <InstancedBoxes instances={screens} color="#0c1014" emissive={p.glow} emissiveIntensity={0.8} castShadow={false} />
      {/* operator console */}
      <Wall position={[-w / 2 + 2.6, 0.6, 0]} size={[1.4, 1.2, 6]} color={p.accent} />
      {/* server racks */}
      <Wall position={[w / 2 - 1.2, 1.5, 0]} size={[1.6, 3, 8]} color={p.wall} />
      <SurveillanceCameras w={w} d={d} glow={p.glow} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Power grid
// ---------------------------------------------------------------------------

function PowerDressing({ w, d, p }: ThemeDressingProps) {
  const { pipes, valves } = useMemo(() => {
    const pipes: BoxInstance[] = []
    const valves: BoxInstance[] = []
    const run = d - 2
    for (const sx of [-1, 1]) {
      // horizontal pipe runs along each side wall, high up
      pipes.push({ position: [sx * (w / 2 - 0.8), 3.3, 0], scale: [0.4, 0.4, run] })
      pipes.push({ position: [sx * (w / 2 - 1.4), 2.6, 0], scale: [0.3, 0.3, run] })
      // vertical risers
      for (const z of [-d / 2 + 3, d / 2 - 3]) {
        pipes.push({ position: [sx * (w / 2 - 0.8), 1.8, z], scale: [0.4, 3.4, 0.4] })
      }
      // valves
      for (let z = -d / 2 + 5; z <= d / 2 - 5 + 0.01; z += 4) {
        valves.push({ position: [sx * (w / 2 - 0.8), 3.3, z], scale: [0.6, 0.6, 0.6] })
      }
    }
    return { pipes, valves }
  }, [w, d])

  const generators: { x: number; z: number }[] = useMemo(
    () => [
      { x: -w / 2 + 2.5, z: -5 },
      { x: -w / 2 + 2.5, z: 5 },
      { x: w / 2 - 2.5, z: 0 },
    ],
    [w],
  )

  return (
    <group>
      {generators.map((g, i) => (
        <group key={`gen-${i}`}>
          <Wall position={[g.x, 1.25, g.z]} size={[3, 2.5, 3]} color={p.wall} />
          {/* hazard panel */}
          <mesh position={[g.x + (g.x < 0 ? 1.51 : -1.51), 1.4, g.z]} rotation={[0, g.x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
            <planeGeometry args={[2, 1.2]} />
            <meshStandardMaterial color={p.glow} emissive={p.glow} emissiveIntensity={0.7} />
          </mesh>
        </group>
      ))}
      <InstancedBoxes instances={pipes} color={p.accent} metalness={0.5} roughness={0.5} />
      <InstancedBoxes instances={valves} color="#1f2329" emissive={p.glow} emissiveIntensity={0.6} castShadow={false} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Control spire
// ---------------------------------------------------------------------------

function ControlDressing({ d, p }: ThemeDressingProps) {
  const screens = useMemo(() => {
    const arr: BoxInstance[] = []
    for (const side of [-1, 1]) {
      for (let row = 0; row < 2; row++) {
        for (let c = 0; c < 2; c++) {
          arr.push({ position: [side * (3 + c * 2.2), 2 + row * 1.4, -d / 2 + 0.6], scale: [1.8, 1.1, 0.08] })
        }
      }
    }
    return arr
  }, [d])

  return (
    <group>
      <InstancedBoxes instances={screens} color="#0c1014" emissive={p.glow} emissiveIntensity={0.7} castShadow={false} />
      {/* angled command consoles */}
      <Wall position={[-5.5, 0.6, -3]} size={[5, 1.2, 1.4]} rotationY={0.4} color={p.accent} />
      <Wall position={[5.5, 0.6, -3]} size={[5, 1.2, 1.4]} rotationY={-0.4} color={p.accent} />
      {/* command dais */}
      <Wall position={[0, 0.2, 4]} size={[4, 0.4, 4]} color={p.wall} />
      <mesh position={[0, 1.6, 4]}>
        <cylinderGeometry args={[0.4, 0.55, 2.6, 6]} />
        <meshStandardMaterial color={p.glow} emissive={p.glow} emissiveIntensity={0.5} transparent opacity={0.55} />
      </mesh>
      <Prop position={[-3.2, 0.5, 1.5]} />
      <Prop position={[3.2, 0.5, 1.5]} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export function RoomDressing({ def }: { def: RoomDef }) {
  const p = paletteFor(def.theme)
  const [w, d] = def.size
  switch (def.theme) {
    case 'cellblock':
      return <CellblockDressing w={w} d={d} p={p} />
    case 'vault':
      return <VaultDressing w={w} d={d} p={p} />
    case 'surveillance':
      return <SurveillanceDressing w={w} d={d} p={p} />
    case 'power':
      return <PowerDressing w={w} d={d} p={p} />
    case 'control':
      return <ControlDressing w={w} d={d} p={p} />
    default:
      return null
  }
}

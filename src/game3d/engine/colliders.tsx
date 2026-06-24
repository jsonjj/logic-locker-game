import { RigidBody, CuboidCollider } from '@react-three/rapier'
import type { ReactNode } from 'react'
import type { WallProps, FloorProps, PropProps, RoomTheme } from '../contracts'

/**
 * Static, low-poly physics primitives the prison world is built from (Agent 1).
 * Walls/floors are fixed cuboid bodies; Props render distinct themed meshes per
 * `kind` with an optional collider. Materials lean flat + grim-but-stylized.
 */

// Per-theme floor tint so each sector reads differently at a glance.
const FLOOR_THEME: Record<RoomTheme, string> = {
  yard: '#2b3340',
  cellblock: '#23262d',
  vault: '#1d2733',
  surveillance: '#1b2230',
  power: '#2a2320',
  control: '#1f2630',
  classroom: '#262b33',
}

export function Wall({ position, size, rotationY = 0, color = '#3a414d' }: WallProps) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.95} metalness={0.05} />
      </mesh>
    </RigidBody>
  )
}

export function Floor({ position = [0, -0.05, 0], size, color, theme }: FloorProps) {
  const [w, d] = size
  const tint = color ?? (theme ? FLOOR_THEME[theme] : '#1b2027')
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <mesh receiveShadow>
        <boxGeometry args={[w, 0.1, d]} />
        <meshStandardMaterial color={tint} roughness={1} metalness={0} />
      </mesh>
    </RigidBody>
  )
}

// --- Prop kinds ------------------------------------------------------------
// Each renderer returns { visual, collider:[halfExtents, centerY] } so Prop can
// wrap them uniformly. Keeping geometry counts tiny for school laptops.

interface PropShape {
  visual: ReactNode
  /** Half-extents [hx, hy, hz] of the blocking box. */
  half: [number, number, number]
  /** Vertical center of the collider box. */
  cy: number
}

const STEEL = '#5a6472'
const STEEL_DARK = '#3a424d'
const RUST = '#8a5a3c'
const FABRIC = '#33506b'
const WARN = '#e0a52b'

function bunk(): PropShape {
  return {
    half: [0.6, 0.7, 1.05],
    cy: 0.7,
    visual: (
      <group>
        {[0.45, 1.15].map((y) => (
          <mesh key={y} castShadow receiveShadow position={[0, y, 0]}>
            <boxGeometry args={[1.1, 0.12, 2]} />
            <meshStandardMaterial color={STEEL} roughness={0.7} metalness={0.3} />
          </mesh>
        ))}
        {[0.45, 1.15].map((y) => (
          <mesh key={`m${y}`} castShadow position={[0, y + 0.1, 0]}>
            <boxGeometry args={[1, 0.1, 1.9]} />
            <meshStandardMaterial color={FABRIC} roughness={1} />
          </mesh>
        ))}
        {[
          [-0.5, -0.9],
          [0.5, -0.9],
          [-0.5, 0.9],
          [0.5, 0.9],
        ].map(([x, z]) => (
          <mesh key={`${x}-${z}`} castShadow position={[x, 0.8, z]}>
            <boxGeometry args={[0.08, 1.6, 0.08]} />
            <meshStandardMaterial color={STEEL_DARK} metalness={0.4} roughness={0.6} />
          </mesh>
        ))}
      </group>
    ),
  }
}

function crate(): PropShape {
  return {
    half: [0.5, 0.5, 0.5],
    cy: 0.5,
    visual: (
      <group>
        <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={RUST} roughness={0.9} />
        </mesh>
        {[-0.5, 0.5].map((y) => (
          <mesh key={y} position={[0, 0.5 + y * 0.6, 0]}>
            <boxGeometry args={[1.02, 0.08, 1.02]} />
            <meshStandardMaterial color="#5b3a26" roughness={1} />
          </mesh>
        ))}
      </group>
    ),
  }
}

function locker(): PropShape {
  return {
    half: [0.6, 1, 0.3],
    cy: 1,
    visual: (
      <group>
        <mesh castShadow receiveShadow position={[0, 1, 0]}>
          <boxGeometry args={[1.2, 2, 0.6]} />
          <meshStandardMaterial color="#46586b" roughness={0.6} metalness={0.35} />
        </mesh>
        {[-0.3, 0.3].map((x) => (
          <mesh key={x} position={[x, 1, 0.31]}>
            <boxGeometry args={[0.5, 1.9, 0.04]} />
            <meshStandardMaterial color="#3a4a5b" roughness={0.5} metalness={0.4} />
          </mesh>
        ))}
        {[-0.3, 0.3].map((x) => (
          <mesh key={`v${x}`} position={[x, 1.3, 0.34]}>
            <boxGeometry args={[0.18, 0.02, 0.02]} />
            <meshStandardMaterial color="#1c242d" />
          </mesh>
        ))}
      </group>
    ),
  }
}

function table(): PropShape {
  return {
    half: [0.9, 0.45, 0.6],
    cy: 0.45,
    visual: (
      <group>
        <mesh castShadow receiveShadow position={[0, 0.82, 0]}>
          <boxGeometry args={[1.8, 0.1, 1.2]} />
          <meshStandardMaterial color="#6a7280" roughness={0.7} metalness={0.2} />
        </mesh>
        {[
          [-0.78, -0.5],
          [0.78, -0.5],
          [-0.78, 0.5],
          [0.78, 0.5],
        ].map(([x, z]) => (
          <mesh key={`${x}-${z}`} castShadow position={[x, 0.4, z]}>
            <boxGeometry args={[0.1, 0.8, 0.1]} />
            <meshStandardMaterial color={STEEL_DARK} metalness={0.4} roughness={0.5} />
          </mesh>
        ))}
      </group>
    ),
  }
}

function desk(): PropShape {
  return {
    half: [0.85, 0.45, 0.55],
    cy: 0.45,
    visual: (
      <group>
        <mesh castShadow receiveShadow position={[0, 0.78, 0]}>
          <boxGeometry args={[1.7, 0.08, 1]} />
          <meshStandardMaterial color="#7a5b3a" roughness={0.85} />
        </mesh>
        <mesh castShadow position={[-0.55, 0.38, 0]}>
          <boxGeometry args={[0.55, 0.76, 0.95]} />
          <meshStandardMaterial color="#5e4630" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0.7, 0.38, 0.42]}>
          <boxGeometry args={[0.08, 0.76, 0.08]} />
          <meshStandardMaterial color="#4a3724" />
        </mesh>
        <mesh castShadow position={[0.7, 0.38, -0.42]}>
          <boxGeometry args={[0.08, 0.76, 0.08]} />
          <meshStandardMaterial color="#4a3724" />
        </mesh>
      </group>
    ),
  }
}

function board(): PropShape {
  // Classroom / control board on a stand.
  return {
    half: [1.2, 0.9, 0.12],
    cy: 1.4,
    visual: (
      <group>
        <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
          <boxGeometry args={[2.4, 1.4, 0.12]} />
          <meshStandardMaterial color="#1d2a22" roughness={0.95} />
        </mesh>
        <mesh position={[0, 1.5, 0.07]}>
          <boxGeometry args={[2.2, 1.2, 0.02]} />
          <meshStandardMaterial color="#273a2e" roughness={1} />
        </mesh>
        <mesh castShadow position={[0, 0.4, 0]}>
          <boxGeometry args={[2.4, 0.12, 0.4]} />
          <meshStandardMaterial color="#3a424d" metalness={0.3} roughness={0.6} />
        </mesh>
        {[-1, 1].map((x) => (
          <mesh key={x} castShadow position={[x, 0.4, 0]}>
            <boxGeometry args={[0.1, 0.8, 0.1]} />
            <meshStandardMaterial color={STEEL_DARK} metalness={0.4} />
          </mesh>
        ))}
      </group>
    ),
  }
}

function barrel(): PropShape {
  return {
    half: [0.42, 0.6, 0.42],
    cy: 0.6,
    visual: (
      <group>
        <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 1.2, 12]} />
          <meshStandardMaterial color="#3f6b4a" roughness={0.7} metalness={0.2} />
        </mesh>
        {[0.25, 0.6, 0.95].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <cylinderGeometry args={[0.44, 0.44, 0.06, 12]} />
            <meshStandardMaterial color="#2c4a34" metalness={0.4} roughness={0.5} />
          </mesh>
        ))}
      </group>
    ),
  }
}

function pipe(): PropShape {
  // A vertical industrial pipe with a flange.
  return {
    half: [0.22, 1.6, 0.22],
    cy: 1.6,
    visual: (
      <group>
        <mesh castShadow receiveShadow position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 3.2, 10]} />
          <meshStandardMaterial color={STEEL} metalness={0.5} roughness={0.5} />
        </mesh>
        {[0.6, 1.6, 2.6].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.12, 10]} />
            <meshStandardMaterial color={STEEL_DARK} metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      </group>
    ),
  }
}

function camera(): PropShape {
  // Wall/ceiling surveillance camera — non-blocking by nature.
  return {
    half: [0.25, 0.2, 0.45],
    cy: 0,
    visual: (
      <group position={[0, 2.6, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.1, 0.5]} />
          <meshStandardMaterial color={STEEL_DARK} metalness={0.4} />
        </mesh>
        <mesh castShadow position={[0, -0.05, 0.35]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.32, 0.26, 0.5]} />
          <meshStandardMaterial color="#2b333d" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.12, 0.6]} rotation={[0.5, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.12, 10]} />
          <meshStandardMaterial color="#10141a" />
        </mesh>
        {/* Recording indicator. */}
        <mesh position={[0.12, 0.02, 0.5]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#ff3b30" emissive="#ff3b30" emissiveIntensity={1.4} />
        </mesh>
      </group>
    ),
  }
}

function light(): PropShape {
  // A caged ceiling lamp — emissive, non-blocking.
  return {
    half: [0.3, 0.2, 0.3],
    cy: 0,
    visual: (
      <group position={[0, 3.2, 0]}>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.06, 0.4, 0.06]} />
          <meshStandardMaterial color={STEEL_DARK} />
        </mesh>
        <mesh castShadow position={[0, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.4, 0.25, 10]} />
          <meshStandardMaterial color="#2b333d" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.05, 10]} />
          <meshStandardMaterial color={WARN} emissive={WARN} emissiveIntensity={1.1} />
        </mesh>
      </group>
    ),
  }
}

const PROP_KINDS: Record<string, () => PropShape> = {
  bunk,
  crate,
  locker,
  table,
  desk,
  board,
  barrel,
  pipe,
  camera,
  light,
}

function defaultShape(): PropShape {
  return {
    half: [0.5, 0.5, 0.5],
    cy: 0.5,
    visual: (
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#4a525f" roughness={0.9} />
      </mesh>
    ),
  }
}

export function Prop({ position, rotationY = 0, kind = 'crate', solid = true }: PropProps) {
  const make = PROP_KINDS[kind] ?? defaultShape
  const shape = make()

  if (!solid) {
    return (
      <group position={position} rotation={[0, rotationY, 0]}>
        {shape.visual}
      </group>
    )
  }

  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={[0, rotationY, 0]}>
      {shape.visual}
      <CuboidCollider args={shape.half} position={[0, shape.cy, 0]} />
    </RigidBody>
  )
}

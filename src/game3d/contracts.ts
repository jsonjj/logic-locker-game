/**
 * Shared contracts for "Logic Locker: Breakout" — the 3D, physics-driven,
 * third-person prison-escape rebuild.
 *
 * Every parallel workstream imports types from THIS file so modules stay
 * decoupled and can be built in parallel:
 *   - Agent 1  Engine + physics + third-person character/camera + colliders
 *   - Agent 2  Prison world: hub + per-sector rooms + minimap + transitions
 *   - Agent 3  Interactive 3D puzzle scenes (2-3 solution routes), per sector
 *   - Agent 4  Narrative / objectives / wayfinding content + review classroom
 *   - Agent 5  HUD + pause menu (logout) + leaderboard access + scoring/results
 *
 * RULE: treat this file as read-only. If you need a new shared type, leave a
 * `// PROPOSE:` comment describing it and the integrator will add it.
 *
 * Reuse, do NOT duplicate, the existing 2D-layer contracts where they already
 * fit: SectorId, Sector, LevelResult, StarRank, DialogueLine, etc. live in
 * `src/game/lockdown/contracts.ts` and are re-exported here for convenience.
 */

import type {
  SectorId,
  LevelResult,
  StarRank,
  DialogueLine,
} from '../game/lockdown/contracts'
import type { Lesson, ConceptPoint } from '../types'

export type { SectorId, LevelResult, StarRank, DialogueLine }

// ---------------------------------------------------------------------------
// Geometry (shared by all 3D systems)
// ---------------------------------------------------------------------------

/** World-space position in three.js units (y = up). */
export interface Vec3 {
  x: number
  y: number
  z: number
}

/** Tuple form many three.js / R3F props expect. */
export type Vec3Tuple = [number, number, number]

export function toTuple(v: Vec3): Vec3Tuple {
  return [v.x, v.y, v.z]
}

export function vec3(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z }
}

// ---------------------------------------------------------------------------
// Engine component contracts (Agent 1 implements; others render against these)
// ---------------------------------------------------------------------------

import type { ReactNode } from 'react'

/** Visual flavor used to theme rooms/props. */
export type RoomTheme = 'yard' | 'cellblock' | 'vault' | 'surveillance' | 'power' | 'control' | 'classroom'

export interface GameCanvasProps {
  children?: ReactNode
  /** 0 (calm) .. 1 (alarm) — drives fog/light tint for tension. */
  danger?: number
  /** Called once the canvas + physics world are live. */
  onReady?: () => void
}

export interface ThirdPersonPlayerProps {
  /** Spawn position in world units. */
  spawn: Vec3
  /** Freeze input (during dialogue / puzzle focus). */
  frozen?: boolean
  /** Reported continuously as the player moves (throttled to frames). */
  onMove?: (pos: Vec3, headingRad: number) => void
}

export interface WallProps {
  position: Vec3Tuple
  /** [width, height, depth] in world units. */
  size: Vec3Tuple
  rotationY?: number
  color?: string
}

export interface FloorProps {
  position?: Vec3Tuple
  /** [width, depth]. */
  size: [number, number]
  color?: string
  theme?: RoomTheme
}

export interface PropProps {
  position: Vec3Tuple
  rotationY?: number
  /** Kind of low-poly set dressing (bunk, crate, locker, table, camera, light). */
  kind?: string
  /** When true, registers a physics collider so the player can't walk through it. */
  solid?: boolean
}

export interface DoorProps {
  position: Vec3Tuple
  rotationY?: number
  /** When true the door is open (passable); when false it blocks with a collider. */
  open: boolean
  label?: string
  /** Highlight as the current objective (glow / marker). */
  highlight?: boolean
  /** Fired when the player walks into the door's trigger volume while open. */
  onEnter?: () => void
}

export interface WaypointProps {
  /** World point to guide the player toward, or null to hide. */
  target: Vec3 | null
  label?: string
}

// ---------------------------------------------------------------------------
// Shared game state (integrator-owned provider; everyone reads via useGameState)
// ---------------------------------------------------------------------------

export type ObjectiveKind = 'goto' | 'solve' | 'return' | 'escape' | 'review'

export interface ObjectiveState {
  kind: ObjectiveKind
  /** Short imperative shown in the HUD, e.g. "Reach the Records Vault". */
  text: string
  /** Optional world point the wayfinding arrow should point to. */
  target?: Vec3 | null
  /** The sector this objective concerns, if any. */
  sectorId?: SectorId
}

export interface GameStateValue {
  objective: ObjectiveState | null
  setObjective: (o: ObjectiveState | null) => void
  /** Live player position, updated every frame WITHOUT causing re-renders. */
  playerPos: { current: Vec3 }
  /** Live player heading (radians), ref to avoid re-renders. */
  playerHeading: { current: number }
  /** Whether a blocking overlay (puzzle/dialogue/menu) is open. */
  paused: boolean
  setPaused: (p: boolean) => void
  /** Alarm level 0..1 for ambient tension; HUD + canvas read this. */
  danger: number
  setDanger: (d: number) => void
}

// ---------------------------------------------------------------------------
// World / rooms (Agent 2)
// ---------------------------------------------------------------------------

/** A door cut into a room/hub wall that leads somewhere. */
export interface DoorAnchor {
  /** Where this door leads. For the hub, the sector room; for a room, 'hub'. */
  to: SectorId | 'hub'
  position: Vec3
  rotationY?: number
  label?: string
}

/** A single playable room (one sector). Built from engine primitives. */
export interface RoomDef {
  sectorId: SectorId
  name: string
  theme: RoomTheme
  /** Floor footprint [width, depth] centered on origin. */
  size: [number, number]
  /** Where the player spawns when entering this room. */
  spawn: Vec3
  /** Where the puzzle device cluster is anchored. */
  puzzleAnchor: Vec3
  /** The exit/objective door that opens once the puzzle is solved. */
  exitDoor: DoorAnchor
}

/** The open-world hub layout: a yard with a door per sector. */
export interface HubDef {
  size: [number, number]
  spawn: Vec3
  /** One door per sector, plus optional special doors (leaderboard kiosk, etc.). */
  doors: DoorAnchor[]
}

// ---------------------------------------------------------------------------
// Puzzle scenes (Agent 3)
// ---------------------------------------------------------------------------

/** A per-question debrief entry, used by the post-room review session. */
export interface PuzzleReviewItem {
  /** The question prompt as the player saw it. */
  prompt: string
  /** True if answered correctly on the first try (no wrong attempts). */
  correct: boolean
  /** Plain-language explanation of why the wrong answer fails. */
  explanation?: string
  /** Core things to remember for next time. */
  takeaways?: string[]
}

/** Outcome a puzzle scene reports back to the gameplay flow. */
export interface PuzzleResult {
  solved: boolean
  mistakes: number
  timeMs: number
  /** Which difficulty / branching route the player took, for flavor/score. */
  route?: string
  /** Per-question debrief for the review session. */
  review?: PuzzleReviewItem[]
}

/** Props every puzzle scene component receives. */
export interface PuzzleSceneProps {
  sectorId: SectorId
  lesson: Lesson
  /** The puzzle anchor in world space (for in-world devices). */
  anchor?: Vec3
  /** Fired when the player finishes (solved or bailed). */
  onComplete: (result: PuzzleResult) => void
  /** Optional incremental mistake signal (e.g. to nudge the alarm). */
  onMistake?: () => void
}

// ---------------------------------------------------------------------------
// Review classroom (Agent 4)
// ---------------------------------------------------------------------------

export interface ReviewTopic extends ConceptPoint {}

export interface ReviewDeck {
  sectorId: SectorId
  title: string
  topics: ReviewTopic[]
  /** Optional teacher lines (Akash) shown alongside the board. */
  teacherLines?: DialogueLine[]
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

export const R3D = {
  /** The open-world prison hub (new home for signed-in players). */
  world: '/world',
  /** A single sector room scene. */
  room: (sectorId: SectorId) => `/world/${sectorId}`,
  /** The 3D review classroom for a sector. */
  classroom: (sectorId: SectorId) => `/classroom/${sectorId}`,
  /** The final boss arena — a cumulative test across every sector. */
  boss: '/boss',
  /** The endgame corridor: survive the swarm, free Akash, escape. */
  finale: '/finale',
  leaderboard: '/leaderboard',
} as const

export const ROOM_ROUTE_PATTERN = '/world/:sectorId'
export const CLASSROOM_ROUTE_PATTERN = '/classroom/:sectorId'

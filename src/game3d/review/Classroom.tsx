import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import type { Group } from 'three'
import { GameCanvas, Floor, Wall, Prop } from '../engine'
import { getSector } from '../../data/sectors'
import type { ReviewDeck } from '../contracts'
import '../../styles/review3d.css'

export interface ClassroomProps {
  deck: ReviewDeck
  onExit: () => void
}

/**
 * [Agent 4] The 3D review classroom. After a block is cleared, the player
 * "sits in class" while Akash debriefs the sector's concepts at the chalkboard.
 * It is a fully self-contained, full-screen experience: it renders its own
 * GameCanvas from the engine barrel, a fixed student-eye camera, a warm
 * low-poly room, and a DOM panel that walks the deck one topic at a time.
 */
export default function Classroom({ deck, onExit }: ClassroomProps) {
  const reduceMotion = usePrefersReducedMotion()
  const [i, setI] = useState(0)

  const total = deck.topics.length
  const topic = deck.topics[i]
  const last = i >= total - 1
  const sector = getSector(deck.sectorId)
  const teacher = pickTeacherLine(deck, i)

  const next = () => setI((n) => Math.min(n + 1, total - 1))
  const back = () => setI((n) => Math.max(n - 1, 0))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setI((n) => Math.min(n + 1, total - 1))
      else if (e.key === 'ArrowLeft') setI((n) => Math.max(n - 1, 0))
      else if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [total, onExit])

  return (
    <div className="review3d-root">
      <GameCanvas danger={0}>
        <ClassroomScene reduceMotion={reduceMotion} />
      </GameCanvas>

      <div className="review3d-overlay">
        <div className="review3d-panel" role="dialog" aria-label="Sector review">
          <div className="review3d-head">
            <div>
              <div className="review3d-kicker">
                {sector ? `${sector.name} · Debrief` : 'Sector Debrief'}
              </div>
              <h2 className="review3d-title">{deck.title}</h2>
            </div>
            <span className="review3d-count">
              {i + 1} / {total}
            </span>
          </div>

          <div className="review3d-topic" aria-live="polite">
            {topic && (
              <>
                <h3 className="review3d-term">{topic.term}</h3>
                <p className="review3d-detail">{topic.detail}</p>
                {topic.example && (
                  <p className="review3d-example">
                    <b>e.g.</b> {topic.example}
                  </p>
                )}
              </>
            )}
          </div>

          {teacher && (
            <div className="review3d-teacher">
              <div className="review3d-avatar" aria-hidden="true">
                A
              </div>
              <p className="review3d-teacher-line">
                <strong>{teacher.name}:</strong> {teacher.text}
              </p>
            </div>
          )}

          <div className="review3d-dots" aria-hidden="true">
            {deck.topics.map((t, idx) => (
              <span
                key={t.term + idx}
                className={
                  'review3d-dot' +
                  (idx === i ? ' is-active' : idx < i ? ' is-done' : '')
                }
              />
            ))}
          </div>

          <div className="review3d-actions">
            <button
              type="button"
              className="review3d-btn review3d-btn-ghost"
              onClick={back}
              disabled={i === 0}
            >
              Back
            </button>
            <span className="review3d-spacer" />
            {last ? (
              <button
                type="button"
                className="review3d-btn review3d-btn-primary"
                onClick={onExit}
              >
                Back to the yard
              </button>
            ) : (
              <button
                type="button"
                className="review3d-btn review3d-btn-primary"
                onClick={next}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers (kept local so this stays a clean single-component module)
// ---------------------------------------------------------------------------

function pickTeacherLine(deck: ReviewDeck, index: number) {
  const lines = deck.teacherLines
  if (!lines || lines.length === 0) return undefined
  return lines[index % lines.length]
}

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduce(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return reduce
}

// ---------------------------------------------------------------------------
// 3D scene
// ---------------------------------------------------------------------------

const WOOD = '#6b4f33'
const WALL_WARM = '#c9b290'
const BOARD_GREEN = '#27402f'

function ClassroomScene({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <>
      {/* Seated student-eye camera, fixed and pointed at the board. */}
      <PerspectiveCamera makeDefault position={[0, 1.65, 6.6]} fov={52} rotation={[-0.04, 0, 0]} />

      {/* Warm classroom lighting layered over the engine's base lights. */}
      <ambientLight intensity={0.5} color="#ffe9c8" />
      <pointLight position={[0, 4.2, 1]} intensity={28} color="#ffdca0" distance={22} decay={2} />
      <pointLight position={[0, 3.6, -6]} intensity={14} color="#fff4d8" distance={16} decay={2} />

      {/* Room shell */}
      <Floor size={[16, 16]} theme="classroom" color={WOOD} />
      <Wall position={[0, 2.4, -7.8]} size={[16, 5, 0.4]} color={WALL_WARM} />
      <Wall position={[0, 2.4, 7.8]} size={[16, 5, 0.4]} color={WALL_WARM} />
      <Wall position={[-8, 2.4, 0]} size={[0.4, 5, 16]} color={WALL_WARM} />
      <Wall position={[8, 2.4, 0]} size={[0.4, 5, 16]} color={WALL_WARM} />

      <Chalkboard />

      {/* Two rows of student desks facing the board. */}
      {[-3, 0, 3].map((x) => (
        <Desk key={`r1-${x}`} position={[x, 0, 1.5]} />
      ))}
      {[-3, 0, 3].map((x) => (
        <Desk key={`r2-${x}`} position={[x, 0, 4]} />
      ))}

      {/* Akash at the board, plus the teacher's desk. */}
      <AkashFigure reduceMotion={reduceMotion} />
      <mesh position={[2.4, 0.75, -5.4]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.12, 1]} />
        <meshStandardMaterial color="#7a5a36" />
      </mesh>
      <mesh position={[2.4, 0.37, -5.4]}>
        <boxGeometry args={[1.8, 0.7, 0.8]} />
        <meshStandardMaterial color="#5e4528" />
      </mesh>

      {/* A little blocky set dressing via the engine Prop primitive. */}
      <Prop position={[-6.6, 0.5, -6.4]} kind="crate" solid={false} />
      <Prop position={[6.6, 0.5, 6.4]} kind="crate" solid={false} />
    </>
  )
}

function Chalkboard() {
  return (
    <group position={[-1, 2.2, -7.55]}>
      {/* Wooden frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[8.4, 3.2, 0.16]} />
        <meshStandardMaterial color="#3f2c18" />
      </mesh>
      {/* Board surface */}
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[7.9, 2.7, 0.06]} />
        <meshStandardMaterial color={BOARD_GREEN} roughness={0.95} />
      </mesh>
      {/* Faint chalk strokes for flavor */}
      <mesh position={[-2.2, 0.7, 0.16]}>
        <boxGeometry args={[2.6, 0.05, 0.02]} />
        <meshStandardMaterial color="#d9e8da" transparent opacity={0.65} />
      </mesh>
      <mesh position={[-1.6, 0.2, 0.16]}>
        <boxGeometry args={[3.6, 0.05, 0.02]} />
        <meshStandardMaterial color="#d9e8da" transparent opacity={0.5} />
      </mesh>
      <mesh position={[-2.4, -0.4, 0.16]}>
        <boxGeometry args={[2.0, 0.05, 0.02]} />
        <meshStandardMaterial color="#d9e8da" transparent opacity={0.55} />
      </mesh>
      {/* Chalk tray */}
      <mesh position={[0, -1.45, 0.22]}>
        <boxGeometry args={[7.9, 0.12, 0.22]} />
        <meshStandardMaterial color="#3a2a18" />
      </mesh>
    </group>
  )
}

function Desk({ position }: { position: [number, number, number] }) {
  const [x, y, z] = position
  return (
    <group position={[x, y, z]}>
      {/* Tabletop */}
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.1, 0.8]} />
        <meshStandardMaterial color="#9c7b52" />
      </mesh>
      {/* Legs */}
      {[
        [-0.65, 0.36, -0.32],
        [0.65, 0.36, -0.32],
        [-0.65, 0.36, 0.32],
        [0.65, 0.36, 0.32],
      ].map((p, idx) => (
        <mesh key={idx} position={p as [number, number, number]}>
          <boxGeometry args={[0.08, 0.72, 0.08]} />
          <meshStandardMaterial color="#6f5436" />
        </mesh>
      ))}
      {/* Bench seat behind the desk */}
      <mesh position={[0, 0.42, 0.8]} castShadow>
        <boxGeometry args={[1.4, 0.1, 0.4]} />
        <meshStandardMaterial color="#7d5d3a" />
      </mesh>
    </group>
  )
}

function AkashFigure({ reduceMotion }: { reduceMotion: boolean }) {
  const ref = useRef<Group>(null)
  const baseY = 0
  useFrame((state) => {
    if (reduceMotion || !ref.current) return
    const t = state.clock.elapsedTime
    ref.current.position.y = baseY + Math.sin(t * 1.4) * 0.03
    ref.current.rotation.y = 0.25 + Math.sin(t * 0.5) * 0.06
  })

  return (
    <group ref={ref} position={[-4.4, 0, -5.6]} rotation={[0, 0.25, 0]}>
      {/* Legs */}
      <mesh position={[-0.16, 0.55, 0]} castShadow>
        <boxGeometry args={[0.22, 1.1, 0.22]} />
        <meshStandardMaterial color="#2f3a4a" />
      </mesh>
      <mesh position={[0.16, 0.55, 0]} castShadow>
        <boxGeometry args={[0.22, 1.1, 0.22]} />
        <meshStandardMaterial color="#2f3a4a" />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.7, 0.95, 0.36]} />
        <meshStandardMaterial color="#3b6f63" />
      </mesh>
      {/* Pointing arm toward the board */}
      <mesh position={[0.5, 1.7, -0.1]} rotation={[0, 0, -0.7]} castShadow>
        <boxGeometry args={[0.7, 0.16, 0.16]} />
        <meshStandardMaterial color="#3b6f63" />
      </mesh>
      {/* Other arm */}
      <mesh position={[-0.42, 1.45, 0]} castShadow>
        <boxGeometry args={[0.16, 0.7, 0.16]} />
        <meshStandardMaterial color="#3b6f63" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <boxGeometry args={[0.36, 0.4, 0.34]} />
        <meshStandardMaterial color="#caa07a" />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 2.42, 0]} castShadow>
        <boxGeometry args={[0.4, 0.12, 0.38]} />
        <meshStandardMaterial color="#241a14" />
      </mesh>
    </group>
  )
}

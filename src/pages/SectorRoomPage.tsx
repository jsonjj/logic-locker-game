import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GameCanvas, ThirdPersonPlayer, Waypoint } from '../game3d/engine'
import RoomShell from '../game3d/world/RoomShell'
import { getRoomDef } from '../game3d/world/rooms'
import { getPuzzleScene } from '../game3d/puzzles/registry'
import Hud from '../game3d/hud/Hud'
import GameMenu from '../game3d/hud/GameMenu'
import Minimap from '../game3d/world/Minimap'
import LearnPanel from '../game3d/learn/LearnPanel'
import ReviewSession from '../game3d/review/ReviewSession'
import { GameStateProvider, useGameState } from '../game3d/state/GameStateContext'
import { CombatProvider, useCombat } from '../game3d/combat/CombatContext'
import Enemy, { type EnemyKind } from '../game3d/combat/Enemy'
import WeaponController from '../game3d/combat/WeaponController'
import { useRun } from '../game3d/state/RunContext'
import { useInventory } from '../game3d/state/InventoryContext'
import CombatHud from '../game3d/hud/CombatHud'
import InventoryPanel from '../game3d/hud/InventoryPanel'
import GameOver from '../game3d/hud/GameOver'
import { rewardWheel, pickWeightedIndex, type GearItem } from '../game3d/systems/gear'
import RewardWheel from '../game3d/hud/RewardWheel'
import { getObjective } from '../game3d/story/objectives'
import { R3D, vec3, type LevelResult, type PuzzleResult, type PuzzleReviewItem, type Vec3 } from '../game3d/contracts'
import { getSector, nextSector } from '../data/sectors'
import { getLesson } from '../data/lessons'
import { varyLesson, pickTrack } from '../logic/variants'
import type { Lesson } from '../types'
import { computeResult } from '../scoring/score'
import { useRunTimer } from '../scoring/useRunTimer'
import { saveLevelResult, getLevelResults } from '../firebase/results'
import { submitScore } from '../firebase/leaderboard'
import ResultsScreen from '../components/ResultsScreen'

const NEAR_RANGE = 3.2

interface EnemySpawn {
  id: number
  spawn: Vec3
  speed: number
  hp: number
  kind: EnemyKind
  damage: number
}

function buildEnemies(order: number, size: [number, number], prestige = 0): EnemySpawn[] {
  const [w, d] = size
  // Tougher, gear-gated: earning weapons/armor matters. The enemy COUNT ramps
  // hard the deeper you go (the late blocks are swarms), while HP stays moderate
  // so weak early guns and the late AoE both stay useful. Each PRESTIGE adds a
  // guard or two and a little extra HP, so replays bite harder.
  const count = Math.min(3 + Math.floor(order * 0.85) + prestige, 8)
  const speed = 2.6 + order * 0.22 + prestige * 0.15
  const hp = 3 + Math.round(order * 1.2) + prestige
  const rangedCount = order < 2 ? Math.min(1, prestige) : order < 4 ? 2 : 3
  const slots: Vec3[] = [
    vec3(-w * 0.28, 1, -d * 0.1),
    vec3(w * 0.28, 1, -d * 0.16),
    vec3(0, 1, -d * 0.34),
    vec3(-w * 0.22, 1, -d * 0.3),
    vec3(w * 0.22, 1, -d * 0.34),
    vec3(0, 1, -d * 0.12),
    vec3(-w * 0.34, 1, -d * 0.24),
    vec3(w * 0.34, 1, -d * 0.24),
  ]
  return slots.slice(0, count).map((spawn, i) => ({
    id: i + 1,
    spawn,
    speed,
    hp,
    // Make the last `rangedCount` guards shooters.
    kind: i >= count - rangedCount ? 'ranged' : 'melee',
    // A heavy hitter shows up from sector 4 on.
    damage: order >= 3 && i === 0 ? 2 : 1,
  }))
}

/**
 * Reinforcements the alarm summons when you guess on the lock. They drop in
 * around the room so a sloppy, guessed breach turns the escape into a fight —
 * a real cost for not actually reasoning it out.
 */
function buildReinforcements(n: number, size: [number, number], startId: number): EnemySpawn[] {
  const [w, d] = size
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / Math.max(1, n)) * Math.PI * 2
    return {
      id: startId + i,
      spawn: vec3(Math.cos(angle) * w * 0.3, 1, -d * 0.2 + Math.sin(angle) * d * 0.2),
      speed: 2.8,
      hp: 4,
      kind: (i % 3 === 0 ? 'ranged' : 'melee') as EnemyKind,
      damage: 1,
    }
  })
}

function RoomInner({ sectorId }: { sectorId: string }) {
  const navigate = useNavigate()
  const gs = useGameState()
  const combat = useCombat()
  const run = useRun()
  const inv = useInventory()
  const { user, profile } = useAuth()
  const uid = user?.uid

  const sector = getSector(sectorId)
  const lesson = sector ? getLesson(sector.lessonId) : undefined
  const def = getRoomDef(sectorId)
  const PuzzleScene = useMemo(() => getPuzzleScene(sectorId), [sectorId])

  // Each visit lightly varies this room's questions (authored case track +
  // shuffled answer order) so the puzzle isn't memorizable. Purely local.
  const [playLesson, setPlayLesson] = useState<Lesson | undefined>(lesson)
  const prevTrack = useRef<number | undefined>(undefined)

  const timer = useRunTimer()

  // Less time per prestige (down to a floor) — the clock is part of the ramp.
  const parTime = Math.max(30, Math.round((sector?.parTimeSec ?? 90) * 0.9 ** inv.prestige))
  const [enemies, setEnemies] = useState<EnemySpawn[]>(() =>
    buildEnemies(sector?.order ?? 0, def?.size ?? [24, 20], inv.prestige),
  )
  const [invOpen, setInvOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(parTime)

  const [solved, setSolved] = useState(false)
  const [puzzleOpen, setPuzzleOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [review, setReview] = useState<PuzzleReviewItem[] | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [near, setNear] = useState<'puzzle' | 'exit' | null>(null)
  const [result, setResult] = useState<LevelResult | null>(null)
  const [wheel, setWheel] = useState<{ segments: GearItem[]; winnerIndex: number; flawless: boolean } | null>(null)
  const [isBest, setIsBest] = useState(false)
  const [priorBest, setPriorBest] = useState<LevelResult | null>(null)
  // 'learn' = briefing beat, 'play' = walk + crack the lock, 'results' = scored.
  const [phase, setPhase] = useState<'learn' | 'play' | 'results'>('learn')

  // Re-roll this room's question variant (different track than last time).
  const rerollQuestions = useCallback(() => {
    if (!lesson) return
    const track = pickTrack(lesson, prevTrack.current)
    prevTrack.current = track
    setPlayLesson(varyLesson(lesson, track))
  }, [lesson])

  useEffect(() => {
    rerollQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectorId])

  // Guard + initialize. The run timer starts when the player begins the lock
  // (after the briefing), not while they're still reading.
  useEffect(() => {
    if (!sector || !lesson || !def) {
      navigate(R3D.world, { replace: true })
      return
    }
    timer.reset()
    let active = true
    if (uid) {
      getLevelResults(uid)
        .then((r) => {
          if (active) setPriorBest(r[sectorId] ?? null)
        })
        .catch(() => {})
    }
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectorId])

  // Objective + waypoint follow the current phase.
  useEffect(() => {
    if (!sector || !def) return
    gs.setObjective(
      getObjective({
        scene: 'room',
        phase: solved ? 'exit' : 'solve',
        sector,
        target: solved ? def.exitDoor.position : def.puzzleAnchor,
      }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved, sectorId])

  // Proximity to the puzzle device / exit door.
  useEffect(() => {
    if (!def) return
    let raf = 0
    const tick = () => {
      const p = gs.playerPos.current
      const dPuzzle = Math.hypot(def.puzzleAnchor.x - p.x, def.puzzleAnchor.z - p.z)
      const dExit = Math.hypot(def.exitDoor.position.x - p.x, def.exitDoor.position.z - p.z)
      let found: 'puzzle' | 'exit' | null = null
      if (!solved && dPuzzle < NEAR_RANGE) found = 'puzzle'
      else if (solved && dExit < NEAR_RANGE) found = 'exit'
      setNear((prev) => (prev === found ? prev : found))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [def, solved, gs.playerPos])

  // Keyboard interact.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase()
      if ((k === 'e' || k === ' ' || k === 'enter') && !menuOpen && !puzzleOpen && !reviewOpen) {
        if (near === 'puzzle') {
          e.preventDefault()
          gs.setPaused(true)
          setPuzzleOpen(true)
        } else if (near === 'exit') {
          e.preventDefault()
          setPhase('results')
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, menuOpen, puzzleOpen, reviewOpen])

  const blocked = phase !== 'play' || puzzleOpen || menuOpen || invOpen || reviewOpen || run.isGameOver

  // Quick inventory toggle with the I key.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'i' && !menuOpen && !puzzleOpen && !reviewOpen && !run.isGameOver) {
        e.preventDefault()
        setInvOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen, puzzleOpen, reviewOpen, run.isGameOver])

  // Route guard contact damage into the shared life pool (i-frames handled in CombatContext).
  useEffect(() => {
    combat.setPlayerDamageHandler(() => {
      run.loseLife()
    })
    return () => combat.setPlayerDamageHandler(null)
  }, [combat, run])

  // Per-room countdown while actively playing.
  useEffect(() => {
    if (blocked || solved) return
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [blocked, solved])

  // Time's up — costs a life, then the clock resets for another attempt.
  useEffect(() => {
    if (timeLeft > 0 || solved || phase !== 'play') return
    run.loseLife()
    setTimeLeft(parTime)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  // Auto-dismiss toasts.
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  function handleEnemyDeath(id: number) {
    setEnemies((es) => es.filter((e) => e.id !== id))
  }

  function handleRestart() {
    run.startRun(3 + inv.bonusLives)
    navigate(R3D.world)
  }

  // Each wrong answer on the lock trips the alarm a little harder (visible as the
  // screen heating up). The real bite — reinforcements — lands when you exit.
  function handlePuzzleMistake() {
    gs.setDanger(Math.min(1, gs.danger + 0.25))
  }

  function handlePuzzleComplete(res: PuzzleResult) {
    setPuzzleOpen(false)
    if (!res.solved || !sector) {
      gs.setPaused(false)
      return
    }
    timer.stop()
    setSolved(true)
    // Anti-guessing cost: the more you guessed, the more guards the alarm pours
    // in for your escape (capped so it stays survivable).
    const reinforce = Math.min(res.mistakes, 4)
    if (reinforce > 0) {
      setEnemies((es) => [...es, ...buildReinforcements(reinforce, def?.size ?? [24, 20], 200 + es.length)])
    }
    // Stash the per-question debrief. If the player missed too many, surface the
    // review right away; otherwise it's available via a button on the results.
    const items = res.review ?? []
    setReview(items.length ? items : null)
    const wrong = items.filter((i) => !i.correct).length
    const tooMany = wrong >= Math.max(2, Math.ceil(items.length * 0.3))
    if (items.length > 0 && tooMany) {
      setReviewOpen(true)
      gs.setPaused(true)
    } else {
      gs.setPaused(false)
    }
    const computed = computeResult({
      sectorId,
      timeMs: timer.timeMs,
      mistakes: res.mistakes,
      caught: false,
      parTimeSec: sector.parTimeSec,
    })
    const best = !priorBest || computed.score > priorBest.score
    setResult(computed)
    setIsBest(best)
    if (best) setPriorBest(computed)
    // Reward: spin a performance-weighted wheel of upgrades. A FLAWLESS
    // (zero-mistake) breach bends the odds toward stronger gear AND grants +1
    // life (applied when the wheel is claimed), so clean reasoning literally
    // makes you stronger sooner than guessing your way through.
    const flawless = res.mistakes === 0
    const entries = rewardWheel(sectorId, flawless, res.mistakes, inv.owned)
    if (entries.length > 0) {
      setWheel({ segments: entries.map((e) => e.item), winnerIndex: pickWeightedIndex(entries), flawless })
    }
    if (uid) {
      void saveLevelResult(uid, computed)
      if (profile) {
        void submitScore({
          uid,
          displayName: profile.displayName,
          avatarId: profile.avatarId,
          sectorId,
          score: computed.score,
          stars: computed.stars,
          timeMs: computed.timeMs,
        })
      }
    }
  }

  function beginQuiz() {
    timer.reset()
    timer.start()
    setTimeLeft(parTime)
    setPhase('play')
  }

  function resetRoom() {
    setSolved(false)
    setResult(null)
    setWheel(null)
    setReview(null)
    setReviewOpen(false)
    setPhase('play')
    setPuzzleOpen(false)
    setTimeLeft(parTime)
    setEnemies(buildEnemies(sector?.order ?? 0, def?.size ?? [24, 20], inv.prestige))
    gs.setPaused(false)
    gs.setDanger(0)
    timer.reset()
    timer.start()
    // Retry gets a different question variant.
    rerollQuestions()
  }

  if (!sector || !lesson || !def) return null

  const nxt = nextSector(sectorId)

  return (
    <div className="world-root">
      <GameCanvas danger={gs.danger}>
        <RoomShell def={def} exitOpen={solved} highlightExit={solved} onExit={() => setPhase('results')}>
          {/* Puzzle device marker at the anchor (real device comes from Agent 3 / 2). */}
        </RoomShell>
        <ThirdPersonPlayer spawn={def.spawn} frozen={blocked} />
        <Waypoint target={gs.objective?.target ?? null} />
        {enemies.map((e) => (
          <Enemy
            key={e.id}
            id={e.id}
            spawn={e.spawn}
            speed={e.speed}
            hp={e.hp}
            kind={e.kind}
            damage={e.damage}
            paused={blocked}
            onDeath={handleEnemyDeath}
          />
        ))}
        <WeaponController disabled={blocked} />
      </GameCanvas>

      <Hud
        objective={gs.objective}
        interactHint={
          near === 'puzzle'
            ? 'Press E to work the lock'
            : near === 'exit'
              ? 'Press E to slip through'
              : null
        }
        progress={sector.name}
        onOpenMenu={() => {
          gs.setPaused(true)
          setMenuOpen(true)
        }}
      />

      <Minimap variant="room" def={def} />

      <CombatHud
        lives={run.lives}
        maxLives={run.maxLives}
        weapon={inv.weapon}
        timeLeftSec={phase === 'play' && !solved ? timeLeft : null}
        onOpenInventory={() => setInvOpen(true)}
        toast={toast}
      />
      <InventoryPanel open={invOpen} onClose={() => setInvOpen(false)} />
      <GameOver open={run.isGameOver} onRestart={handleRestart} />

      {phase === 'learn' && <LearnPanel sectorId={sectorId} onBegin={beginQuiz} />}

      {near && phase === 'play' && !puzzleOpen && (
        <button
          type="button"
          className="game-action-btn"
          onClick={() => {
            if (near === 'puzzle') {
              gs.setPaused(true)
              setPuzzleOpen(true)
            } else {
              setPhase('results')
            }
          }}
        >
          {near === 'puzzle' ? 'Work the lock' : 'Escape'}
        </button>
      )}

      {puzzleOpen && (
        <PuzzleScene
          sectorId={sectorId}
          lesson={playLesson ?? lesson}
          anchor={def.puzzleAnchor}
          prestige={inv.prestige}
          onComplete={handlePuzzleComplete}
          onMistake={handlePuzzleMistake}
        />
      )}

      {phase === 'results' && result && (
        <div className="puzzle-overlay">
          <ResultsScreen
            result={result}
            isBest={isBest}
            sectorName={sector.name}
            nextSectorName={nxt?.name}
            onRetry={resetRoom}
            onMap={() => navigate(R3D.world)}
            onLeaderboard={() => navigate(R3D.leaderboard)}
            onReview={review && review.length ? () => setReviewOpen(true) : undefined}
          />
        </div>
      )}

      {phase === 'results' && wheel && (
        <RewardWheel
          segments={wheel.segments}
          winnerIndex={wheel.winnerIndex}
          onResult={(item) => {
            const added = inv.addItem(item.id)
            if (wheel.flawless) run.gainLife()
            setToast(
              `${added ? 'Unlocked' : 'Bonus'} ${item.icon} ${item.name}${
                wheel.flawless ? ' · +1 life (flawless)' : ''
              }`,
            )
          }}
          onClose={() => setWheel(null)}
        />
      )}

      {reviewOpen && review && review.length > 0 && (
        <ReviewSession
          items={review}
          sectorName={sector.name}
          onClose={() => {
            setReviewOpen(false)
            if (phase !== 'results') gs.setPaused(false)
          }}
        />
      )}

      <GameMenu
        open={menuOpen}
        onClose={() => {
          gs.setPaused(false)
          setMenuOpen(false)
        }}
        onRestart={resetRoom}
      />
    </div>
  )
}

export default function SectorRoomPage() {
  const { sectorId = '' } = useParams()
  return (
    <GameStateProvider>
      <CombatProvider>
        <RoomInner sectorId={sectorId} key={sectorId} />
      </CombatProvider>
    </GameStateProvider>
  )
}

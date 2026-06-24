import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameCanvas, ThirdPersonPlayer, Waypoint } from '../game3d/engine'
import HubWorld from '../game3d/world/HubWorld'
import { hubDef } from '../game3d/world/rooms'
import Hud from '../game3d/hud/Hud'
import GameMenu from '../game3d/hud/GameMenu'
import LeaderboardPeek from '../game3d/hud/LeaderboardPeek'
import Minimap from '../game3d/world/Minimap'
import { GameStateProvider, useGameState } from '../game3d/state/GameStateContext'
import { CombatProvider, useCombat } from '../game3d/combat/CombatContext'
import Enemy, { type EnemyKind } from '../game3d/combat/Enemy'
import WeaponController from '../game3d/combat/WeaponController'
import Pickup from '../game3d/combat/Pickup'
import { useRun } from '../game3d/state/RunContext'
import { useInventory } from '../game3d/state/InventoryContext'
import CombatHud from '../game3d/hud/CombatHud'
import InventoryPanel from '../game3d/hud/InventoryPanel'
import GameOver from '../game3d/hud/GameOver'
import { SCATTERED_PICKUPS, gear } from '../game3d/systems/gear'
import { getObjective, getIntroLines, getMissionTagline } from '../game3d/story/objectives'
import { R3D, vec3, type SectorId, type Vec3 } from '../game3d/contracts'
import { useSectorProgress } from '../sectors/useSectorProgress'
import '../styles/learn.css'

const DOOR_RANGE = 3.4
const INTRO_SEEN_KEY = 'll-mission-intro-seen'

interface HubEnemy {
  id: number
  spawn: Vec3
  speed: number
  hp: number
  kind: EnemyKind
  damage: number
}

// Guards patrolling the central hall + loose (non-weapon) gear to find. With
// only fists at the start, these are a real deterrent — earn weapons first.
const HUB_GUARDS: HubEnemy[] = [
  { id: 1, spawn: vec3(-9, 1, -6), speed: 2.3, hp: 5, kind: 'melee', damage: 1 },
  { id: 2, spawn: vec3(9, 1, -3), speed: 2.4, hp: 5, kind: 'melee', damage: 1 },
  { id: 3, spawn: vec3(0, 1, -10), speed: 2.2, hp: 4, kind: 'ranged', damage: 1 },
]
const HUB_PICKUP_SPOTS = [vec3(-12, 0, 5), vec3(12, 0, 1), vec3(0, 0, -7)]

// Endless post-game arena tuning.
const HORDE_MIN = 10
const HORDE_MAX = 20

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

/** A randomized roamer for the endless horde: varied spot, hp, speed, kind, damage. */
function randomHordeEnemy(id: number): HubEnemy {
  const angle = Math.random() * Math.PI * 2
  const r = 16 + Math.random() * 8 // 16..24 m from center
  const x = clamp(Math.cos(angle) * r, -24, 24)
  const z = clamp(Math.sin(angle) * r, -24, 24)
  const kind: EnemyKind = Math.random() < 0.35 ? 'ranged' : 'melee'
  const hp = 2 + Math.floor(Math.random() * 7) // 2..8
  const speed = 1.8 + Math.random() * 1.9 // 1.8..3.7
  const damage = Math.random() < 0.2 ? 2 : 1 // occasional heavy hitter
  return { id, spawn: vec3(x, 1, z), speed, hp, kind, damage }
}

function WorldInner() {
  const navigate = useNavigate()
  const gs = useGameState()
  const combat = useCombat()
  const run = useRun()
  const inv = useInventory()
  const { views } = useSectorProgress()

  const unlocked = useMemo(
    () => new Set<SectorId>(views.filter((v) => v.state !== 'locked').map((v) => v.id)),
    [views],
  )
  const nextView = views.find((v) => v.state === 'unlocked')
  const objectiveSectorId = nextView?.id ?? null
  const objectiveDoor = hubDef.doors.find((d) => d.to === objectiveSectorId)
  const cleared = views.filter((v) => v.state === 'cleared').length
  const allCleared = views.length > 0 && cleared === views.length

  const [menuOpen, setMenuOpen] = useState(false)
  const [nearDoor, setNearDoor] = useState<SectorId | null>(null)
  const [invOpen, setInvOpen] = useState(false)
  const [guards, setGuards] = useState<HubEnemy[]>(HUB_GUARDS)
  const [toast, setToast] = useState<string | null>(null)
  const nextEnemyId = useRef(100)
  const gameOverRef = useRef(run.isGameOver)
  gameOverRef.current = run.isGameOver
  const hordeAnnounced = useRef(false)
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return sessionStorage.getItem(INTRO_SEEN_KEY) !== '1'
    } catch {
      return true
    }
  })

  function dismissIntro() {
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, '1')
    } catch {
      /* ignore */
    }
    setShowIntro(false)
  }

  const blocked = menuOpen || showIntro || invOpen || run.isGameOver

  // Quick inventory toggle with the I key.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'i' && !menuOpen && !showIntro && !run.isGameOver) {
        e.preventDefault()
        setInvOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen, showIntro, run.isGameOver])

  // Begin (or refresh) the run when arriving at the hub.
  useEffect(() => {
    run.startRun(3 + inv.bonusLives)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Guard contact damage -> lose lives (i-frames in CombatContext). Heavy
  // enemies can deal more than one.
  useEffect(() => {
    combat.setPlayerDamageHandler((amount) => {
      for (let i = 0; i < Math.max(1, amount); i++) run.loseLife()
    })
    return () => combat.setPlayerDamageHandler(null)
  }, [combat, run])

  // Endless arena: once every block is cleared, the yard floods with a swarm of
  // varied enemies, kept topped up between HORDE_MIN and HORDE_MAX as you cull them.
  useEffect(() => {
    if (!allCleared) return
    if (!hordeAnnounced.current) {
      hordeAnnounced.current = true
      setToast('All blocks clear — survive the swarm, or confront the Warden!')
    }
    const start = performance.now()
    const iv = setInterval(() => {
      if (gameOverRef.current) return
      const elapsedSec = (performance.now() - start) / 1000
      // Ramp the target from HORDE_MIN up to HORDE_MAX over ~100s.
      const target = Math.min(HORDE_MAX, HORDE_MIN + Math.floor(elapsedSec / 10))
      setGuards((prev) => {
        if (prev.length >= target) return prev
        const toAdd = Math.min(2, target - prev.length)
        const next = prev.slice()
        for (let k = 0; k < toAdd; k++) next.push(randomHordeEnemy(nextEnemyId.current++))
        return next
      })
    }, 1300)
    return () => clearInterval(iv)
  }, [allCleared])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  function grabPickup(id: string) {
    if (inv.addItem(id)) {
      const g = gear(id)
      setToast(`Found ${g?.icon ?? ''} ${g?.name ?? 'gear'}`)
    }
  }

  function handleRestart() {
    run.startRun(3 + inv.bonusLives)
    setGuards(HUB_GUARDS)
  }

  useEffect(() => {
    gs.setObjective(
      getObjective({
        scene: 'hub',
        nextSector: nextView,
        allCleared: !nextView,
        target: objectiveDoor ? objectiveDoor.position : null,
      }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectiveSectorId])

  // Proximity check (reads the live player ref each frame; no re-render churn).
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const p = gs.playerPos.current
      let found: SectorId | null = null
      for (const door of hubDef.doors) {
        if (door.to === 'hub' || !unlocked.has(door.to)) continue
        const dist = Math.hypot(door.position.x - p.x, door.position.z - p.z)
        if (dist < DOOR_RANGE) {
          found = door.to
          break
        }
      }
      setNearDoor((prev) => (prev === found ? prev : found))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [unlocked, gs.playerPos])

  function enter(sectorId: SectorId) {
    if (blocked) return
    navigate(R3D.room(sectorId))
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase()
      if ((k === 'e' || k === ' ' || k === 'enter') && nearDoor && !menuOpen) {
        e.preventDefault()
        enter(nearDoor)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearDoor, menuOpen])

  return (
    <div className="world-root">
      <GameCanvas danger={gs.danger}>
        <HubWorld unlocked={unlocked} objectiveSectorId={objectiveSectorId} onEnterSector={enter} />
        <ThirdPersonPlayer spawn={hubDef.spawn} frozen={blocked} />
        <Waypoint target={gs.objective?.target ?? null} />
        {guards.map((g) => (
          <Enemy
            key={g.id}
            id={g.id}
            spawn={g.spawn}
            speed={g.speed}
            hp={g.hp}
            kind={g.kind}
            damage={g.damage}
            paused={blocked}
            onDeath={(id) => setGuards((gs2) => gs2.filter((x) => x.id !== id))}
          />
        ))}
        {SCATTERED_PICKUPS.filter((id) => !inv.isOwned(id)).map((id, i) => (
          <Pickup key={id} itemId={id} position={HUB_PICKUP_SPOTS[i % HUB_PICKUP_SPOTS.length]} onPickup={grabPickup} />
        ))}
        <WeaponController disabled={blocked} />
      </GameCanvas>

      <Hud
        objective={gs.objective}
        interactHint={nearDoor ? 'Press E to break into the block' : null}
        progress={`${cleared} / ${views.length} blocks`}
        onOpenMenu={() => {
          gs.setPaused(true)
          setMenuOpen(true)
        }}
      />

      <Minimap
        variant="hub"
        extraMarkers={SCATTERED_PICKUPS.filter((id) => !inv.isOwned(id)).map((id, i) => {
          const p = HUB_PICKUP_SPOTS[i % HUB_PICKUP_SPOTS.length]
          return { id: `item-${id}`, x: p.x, z: p.z, className: 'll-minimap__marker ll-minimap__marker--item' }
        })}
      />
      <LeaderboardPeek />

      <CombatHud
        lives={run.lives}
        maxLives={run.maxLives}
        weapon={inv.weapon}
        timeLeftSec={null}
        onOpenInventory={() => setInvOpen(true)}
        toast={toast}
      />
      <InventoryPanel open={invOpen} onClose={() => setInvOpen(false)} />
      <GameOver open={run.isGameOver} onRestart={handleRestart} />

      {allCleared ? (
        <button
          type="button"
          className="game-action-btn game-action-btn--boss"
          onClick={() => navigate(R3D.boss)}
        >
          Confront the Warden
        </button>
      ) : (
        <button
          type="button"
          className="game-action-btn"
          disabled={!nearDoor}
          onClick={() => nearDoor && enter(nearDoor)}
        >
          Break in
        </button>
      )}

      {showIntro && (
        <div className="mission-overlay">
          <div className="mission-card">
            <div className="mission-kicker">Operation Lockdown</div>
            <h1 className="mission-title">Logic Locker: Breakout</h1>
            <p className="mission-tagline">{getMissionTagline()}</p>
            <div className="mission-lines">
              {getIntroLines().map((line, i) => (
                <p key={i} className="mission-line">
                  <b>{line.name}:</b> {line.text}
                </p>
              ))}
            </div>
            <div className="learn-actions">
              <span className="learn-progress">Break out, block by block — then take down the Warden.</span>
              <button type="button" className="btn btn-primary" onClick={dismissIntro}>
                Move out →
              </button>
            </div>
          </div>
        </div>
      )}

      <GameMenu
        open={menuOpen}
        onClose={() => {
          gs.setPaused(false)
          setMenuOpen(false)
        }}
      />
    </div>
  )
}

export default function WorldPage() {
  return (
    <GameStateProvider>
      <CombatProvider>
        <WorldInner />
      </CombatProvider>
    </GameStateProvider>
  )
}

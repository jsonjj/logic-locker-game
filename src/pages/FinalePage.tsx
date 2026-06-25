import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useNavigate } from 'react-router-dom'
import { GameCanvas, ThirdPersonPlayer, Waypoint, Floor, Wall, Door } from '../game3d/engine'
import Hud from '../game3d/hud/Hud'
import GameMenu from '../game3d/hud/GameMenu'
import CombatHud from '../game3d/hud/CombatHud'
import InventoryPanel from '../game3d/hud/InventoryPanel'
import GameOver from '../game3d/hud/GameOver'
import Minimap from '../game3d/world/Minimap'
import { GameStateProvider, useGameState } from '../game3d/state/GameStateContext'
import { CombatProvider, useCombat } from '../game3d/combat/CombatContext'
import Enemy, { type EnemyKind } from '../game3d/combat/Enemy'
import Ally from '../game3d/combat/Ally'
import WeaponController from '../game3d/combat/WeaponController'
import { useRun } from '../game3d/state/RunContext'
import { useInventory } from '../game3d/state/InventoryContext'
import { prestigeReward, type GearItem } from '../game3d/systems/gear'
import { useAuth } from '../context/AuthContext'
import { clearLevelResults } from '../firebase/results'
import { R3D, vec3, type Vec3 } from '../game3d/contracts'
import '../styles/finale.css'

const HALL_W = 16
const HALL_D = 120
const WALL_H = 5
const CONCURRENT_CAP = 14

const PLAYER_SPAWN = vec3(0, 1, HALL_D / 2 - 8) // start at the near end
const KEY_POS = vec3(0, 0.6, 0) // detonator key drops mid-hall
const C4_POS = vec3(0, 0.6, -HALL_D / 2 + 8) // charge sits at the far gate
const GATE_Z = -HALL_D / 2 + 6 // sealed gate the C4 breaches
const AKASH = vec3(0, 1, -HALL_D / 2 + 2.5) // Akash, just behind the gate

const KEY_RANGE = 2.6
const C4_RANGE = 3.2
const AKASH_RANGE = 3.6
const SAFE_DIST = 20 // must be this far from the C4 when it blows
const FUSE_SEC = 5

// The escape corridor hands you a guaranteed crowd-clearer regardless of the
// gear you brought: a wide AoE blast doing 3 damage, so even the toughest guard
// (hp ≤ 7) drops in ~3 shots. You are always equipped to fight your way out.
const FINALE_WEAPON: GearItem = {
  id: 'breach-cannon',
  name: 'Breach Cannon',
  slot: 'weapon',
  icon: '🌋',
  color: '#ff8a3d',
  desc: 'Confiscated riot-suppression cannon. A wide blast that jolts every guard caught in it.',
  weaponKind: 'ranged',
  damage: 3,
  range: 18,
  cooldownMs: 450,
  aoe: 6,
}

interface EnemySpec {
  id: number
  spawn: Vec3
  speed: number
  hp: number
  kind: EnemyKind
  damage: number
}

interface AllySpec {
  id: number
  spawn: Vec3
}

function rand(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo)
}

function makeEnemySpec(id: number): EnemySpec {
  const kind: EnemyKind = Math.random() < 0.4 ? 'ranged' : 'melee'
  return {
    // Spawn down the hall IN FRONT of the player (toward the far gate).
    id,
    spawn: vec3(rand(-6, 6), 1, rand(-HALL_D / 2 + 12, 6)),
    speed: 2.0 + Math.random() * 2.0,
    hp: 2 + Math.floor(Math.random() * 6),
    kind,
    damage: Math.random() < 0.18 ? 2 : 1,
  }
}

/** Akash, waiting behind the sealed gate at the end of the corridor. */
function AkashFigure({ freed }: { freed: boolean }) {
  return (
    <group position={[AKASH.x, 0, AKASH.z]}>
      <mesh position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.4, 0.9, 6, 12]} />
        <meshStandardMaterial color="#ffd9a8" emissive="#ffb15a" emissiveIntensity={freed ? 0.5 : 0.15} />
      </mesh>
      <mesh position={[0, 1.8, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#f2c79a" />
      </mesh>
    </group>
  )
}

/** The C4 charge with a blinking light; pulses faster once armed. */
function Charge({ armed }: { armed: boolean }) {
  const led = useRef<import('three').MeshStandardMaterial>(null)
  useFrame(() => {
    if (!led.current) return
    const speed = armed ? 7 : 1.6
    led.current.emissiveIntensity = 1.2 + Math.abs(Math.sin(performance.now() / (armed ? 90 : 400))) * speed
  })
  return (
    <group position={[C4_POS.x, 0.4, C4_POS.z]}>
      <mesh castShadow>
        <boxGeometry args={[1.1, 0.5, 0.7]} />
        <meshStandardMaterial color="#caa45a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[0.5, 0.18, 0.4]} />
        <meshStandardMaterial color="#1b1f27" />
      </mesh>
      <mesh position={[0.18, 0.33, 0.21]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial ref={led} color="#ff3b30" emissive="#ff2a20" emissiveIntensity={2} />
      </mesh>
    </group>
  )
}

/** A brief expanding blast when the C4 detonates. */
function Blast() {
  const ref = useRef<import('three').Mesh>(null)
  const mat = useRef<import('three').MeshStandardMaterial>(null)
  const born = useRef(performance.now())
  useFrame(() => {
    const t = (performance.now() - born.current) / 700
    if (!ref.current || !mat.current) return
    const s = 1 + t * 16
    ref.current.scale.setScalar(s)
    mat.current.opacity = Math.max(0, 1 - t)
  })
  return (
    <mesh ref={ref} position={[C4_POS.x, 1.2, C4_POS.z]}>
      <sphereGeometry args={[1, 20, 20]} />
      <meshStandardMaterial ref={mat} color="#ffd27a" emissive="#ff8a3d" emissiveIntensity={4} transparent opacity={1} />
    </mesh>
  )
}

type Phase = 'fight' | 'key' | 'arm' | 'flee' | 'breach' | 'end'

function FinaleInner() {
  const navigate = useNavigate()
  const gs = useGameState()
  const combat = useCombat()
  const run = useRun()
  const inv = useInventory()
  const { user } = useAuth()

  const TOTAL = useMemo(() => 50 + Math.floor(Math.random() * 11), [])
  const MAX_ALLIES = Math.floor(TOTAL / 5)

  const queue = useRef<EnemySpec[]>([])
  const spawnedRef = useRef(0)
  const killedRef = useRef(0)
  const nextAllyId = useRef(1)
  const gameOverRef = useRef(false)
  const phaseRef = useRef<Phase>('fight')
  const startRef = useRef(performance.now())

  const [active, setActive] = useState<EnemySpec[]>([])
  const [allies, setAllies] = useState<AllySpec[]>([])
  const [killed, setKilled] = useState(0)
  const [phase, setPhase] = useState<Phase>('fight')
  const [hasKey, setHasKey] = useState(false)
  const [nearC4, setNearC4] = useState(false)
  const [exploded, setExploded] = useState(false)
  const [fuse, setFuse] = useState(FUSE_SEC)
  const [menuOpen, setMenuOpen] = useState(false)
  const [invOpen, setInvOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [prestigeAward, setPrestigeAward] = useState<{ level: number; item: GearItem | null } | null>(null)
  const prestigeDone = useRef(false)

  phaseRef.current = phase
  gameOverRef.current = run.isGameOver

  // Finishing the game = a PRESTIGE: keep every upgrade, pocket one more bonus
  // unlock, and bump the prestige level (which makes the next run's questions
  // and enemies tougher). Runs exactly once when we reach the end.
  useEffect(() => {
    if (phase !== 'end' || prestigeDone.current) return
    prestigeDone.current = true
    const reward = prestigeReward(inv.owned)
    if (reward) {
      inv.addItem(reward.id)
      inv.equip(reward.id)
    }
    inv.prestigeUp()
    // Reset room progress: the replay starts at room 1 and the Warden stays
    // locked until you clear every block again. Gear/upgrades are kept.
    if (user) void clearLevelResults(user.uid)
    setPrestigeAward({ level: inv.prestige + 1, item: reward ?? null })
  }, [phase, inv, user])

  const blocked = menuOpen || invOpen || run.isGameOver || phase === 'end'

  function resetRun() {
    queue.current = Array.from({ length: TOTAL }, (_, i) => makeEnemySpec(i + 1))
    spawnedRef.current = 0
    killedRef.current = 0
    nextAllyId.current = 1
    startRef.current = performance.now()
    setActive([])
    setAllies([])
    setKilled(0)
    setHasKey(false)
    setNearC4(false)
    setExploded(false)
    setFuse(FUSE_SEC)
    setPhase('fight')
    run.startRun(5 + inv.bonusLives)
  }

  useEffect(() => {
    resetRun()
    gs.setDanger(0.85)
    gs.setObjective({ kind: 'escape', text: 'Fight through the guards to the gate', target: C4_POS })
    setToast(`${FINALE_WEAPON.icon} ${FINALE_WEAPON.name} equipped — blast your way through!`)
    return () => gs.setDanger(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Player damage -> lives (heavy enemies hit for more).
  useEffect(() => {
    combat.setPlayerDamageHandler((amount) => {
      for (let i = 0; i < Math.max(1, amount); i++) run.loseLife()
    })
    return () => combat.setPlayerDamageHandler(null)
  }, [combat, run])

  // Quick inventory toggle.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'i' && !menuOpen && !run.isGameOver && phase !== 'end') {
        e.preventDefault()
        setInvOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen, run.isGameOver, phase])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  // Wave spawner (only during the fight).
  useEffect(() => {
    if (phase !== 'fight') return
    const iv = setInterval(() => {
      if (gameOverRef.current) return
      const alive = spawnedRef.current - killedRef.current
      const room = Math.min(2, CONCURRENT_CAP - alive, TOTAL - spawnedRef.current)
      if (room <= 0) return
      const adds: EnemySpec[] = []
      for (let k = 0; k < room; k++) {
        adds.push(queue.current[spawnedRef.current])
        spawnedRef.current += 1
      }
      setActive((prev) => [...prev, ...adds])
    }, 850)
    return () => clearInterval(iv)
  }, [phase, TOTAL])

  // Live timer.
  useEffect(() => {
    if (phase === 'end') return
    const iv = setInterval(() => setElapsedSec((performance.now() - startRef.current) / 1000), 500)
    return () => clearInterval(iv)
  }, [phase])

  // C4 fuse countdown — must be SAFE_DIST away when it hits zero.
  useEffect(() => {
    if (phase !== 'flee') return
    const iv = setInterval(() => {
      setFuse((f) => {
        const next = f - 1
        if (next <= 0) {
          clearInterval(iv)
          const p = gs.playerPos.current
          const dist = Math.hypot(p.x - C4_POS.x, p.z - C4_POS.z)
          if (dist >= SAFE_DIST) {
            setExploded(true)
            setPhase('breach')
            setToast('Gate breached — get to Akash!')
            gs.setObjective({ kind: 'escape', text: 'Reach Akash', target: AKASH })
            gs.setDanger(0.25)
          } else {
            // Too close — caught in the blast.
            setExploded(true)
            setToast('Too close to the blast!')
            for (let i = 0; i < run.maxLives + 1; i++) run.loseLife()
          }
          return 0
        }
        return next
      })
    }, 1000)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function handleEnemyDeath(id: number) {
    killedRef.current += 1
    const k = killedRef.current
    setKilled(k)
    setActive((prev) => prev.filter((e) => e.id !== id))

    if (k % 5 === 0 && nextAllyId.current <= MAX_ALLIES) {
      const p = gs.playerPos.current
      const aid = nextAllyId.current
      nextAllyId.current += 1
      setAllies((prev) => [
        ...prev,
        { id: aid, spawn: vec3(Math.max(-6, Math.min(6, p.x + rand(-3, 3))), 1, p.z - rand(2, 5)) },
      ])
      setToast(`A freed inmate joins you! (${aid}/${MAX_ALLIES})`)
    }

    if (k >= TOTAL && phaseRef.current === 'fight') {
      setPhase('key')
      setAllies([]) // helpers despawn once the corridor is clear
      setToast('Corridor clear — grab the detonator key')
      gs.setObjective({ kind: 'goto', text: 'Pick up the detonator key', target: KEY_POS })
      gs.setDanger(0.3)
    }
  }

  // Proximity handling per phase.
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const p = gs.playerPos.current
      const ph = phaseRef.current
      if (ph === 'key') {
        if (Math.hypot(p.x - KEY_POS.x, p.z - KEY_POS.z) < KEY_RANGE) {
          setHasKey(true)
          setPhase('arm')
          setToast('Detonator key acquired — plant it on the C4')
          gs.setObjective({ kind: 'goto', text: 'Arm the C4 at the gate', target: C4_POS })
        }
      } else if (ph === 'arm') {
        const found = Math.hypot(p.x - C4_POS.x, p.z - C4_POS.z) < C4_RANGE
        setNearC4((prev) => (prev === found ? prev : found))
      } else if (ph === 'breach') {
        if (Math.hypot(p.x - AKASH.x, p.z - AKASH.z) < AKASH_RANGE) {
          setPhase('end')
          gs.setPaused(true)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [gs])

  // Arm the C4 with E when standing next to it (key in hand).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase()
      if ((k === 'e' || k === ' ' || k === 'enter') && phase === 'arm' && nearC4 && hasKey) {
        e.preventDefault()
        setPhase('flee')
        setFuse(FUSE_SEC)
        setToast('C4 armed — RUN!')
        gs.setObjective({ kind: 'escape', text: 'RUN! Get clear of the blast', target: PLAYER_SPAWN })
        gs.setDanger(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, nearC4, hasKey, gs])

  const score = useMemo(() => {
    if (phase !== 'end') return 0
    const timeBonus = Math.max(0, 1200 - Math.round(elapsedSec) * 3)
    return TOTAL * 120 + run.lives * 400 + MAX_ALLIES * 80 + timeBonus
  }, [phase, elapsedSec, run.lives, MAX_ALLIES, TOTAL])

  // Minimap layout for the corridor (memoized per phase so the map's rAF loop
  // isn't torn down every render). Live red/blue dots come from the combat ctx.
  const mapCustom = useMemo(() => {
    const markers = [
      { id: 'akash', x: AKASH.x, z: AKASH.z, className: 'll-minimap__marker ll-minimap__marker--exit' },
    ]
    if (phase === 'key') {
      markers.push({ id: 'key', x: KEY_POS.x, z: KEY_POS.z, className: 'll-minimap__marker ll-minimap__marker--key' })
    }
    if (phase === 'arm' || phase === 'flee') {
      markers.push({ id: 'c4', x: C4_POS.x, z: C4_POS.z, className: 'll-minimap__marker ll-minimap__marker--anchor' })
    }
    return { size: [HALL_W, HALL_D] as [number, number], title: 'Cell Block', markers }
  }, [phase])

  const lightZs = useMemo(() => {
    const zs: number[] = []
    for (let z = -HALL_D / 2 + 8; z <= HALL_D / 2 - 8; z += 14) zs.push(z)
    return zs
  }, [])

  function fmtTime(s: number): string {
    const m = Math.floor(s / 60)
    const sec = Math.round(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const interactHint = phase === 'arm' && nearC4 && hasKey ? 'Press E to arm the C4' : null

  return (
    <div className="world-root">
      <GameCanvas danger={gs.danger}>
        {/* hallway shell */}
        <Floor size={[HALL_W, HALL_D]} theme="cellblock" color="#2b313d" />
        <Wall position={[-HALL_W / 2, WALL_H / 2, 0]} size={[0.5, WALL_H, HALL_D]} color="#39414f" />
        <Wall position={[HALL_W / 2, WALL_H / 2, 0]} size={[0.5, WALL_H, HALL_D]} color="#39414f" />
        <Wall position={[0, WALL_H / 2, HALL_D / 2]} size={[HALL_W, WALL_H, 0.5]} color="#39414f" />
        <Wall position={[0, WALL_H / 2, -HALL_D / 2]} size={[HALL_W, WALL_H, 0.5]} color="#39414f" />

        {lightZs.map((z) => (
          <group key={z} position={[0, WALL_H - 0.3, z]}>
            <mesh>
              <boxGeometry args={[3.2, 0.18, 0.8]} />
              <meshStandardMaterial color="#fdf6e3" emissive="#fff3d6" emissiveIntensity={1.2} />
            </mesh>
            <pointLight position={[0, -0.4, 0]} intensity={6} distance={20} decay={2} color="#ffe9c2" />
          </group>
        ))}

        {/* sealed gate the C4 breaches (bars removed once exploded) */}
        {!exploded &&
          [-1.6, -0.8, 0, 0.8, 1.6].map((x) => (
            <mesh key={x} position={[x, 1.5, GATE_Z]}>
              <cylinderGeometry args={[0.08, 0.08, 3, 8]} />
              <meshStandardMaterial color="#3a4150" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
        <Door position={[0, 1.5, GATE_Z]} rotationY={0} open={exploded} label="Gate" highlight={phase === 'breach'} />

        <AkashFigure freed={exploded} />
        {(phase === 'arm' || phase === 'flee') && <Charge armed={phase === 'flee'} />}
        {exploded && <Blast />}

        {phase === 'key' && (
          <group position={[KEY_POS.x, KEY_POS.y + 0.4, KEY_POS.z]}>
            <mesh>
              <torusGeometry args={[0.28, 0.09, 10, 20]} />
              <meshStandardMaterial color="#ffd54a" emissive="#ffb000" emissiveIntensity={2} metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.5, 0]}>
              <boxGeometry args={[0.12, 0.7, 0.12]} />
              <meshStandardMaterial color="#ffd54a" emissive="#ffb000" emissiveIntensity={1.6} metalness={0.7} roughness={0.3} />
            </mesh>
            <pointLight intensity={6} distance={10} decay={2} color="#ffcf66" />
          </group>
        )}

        <ThirdPersonPlayer spawn={PLAYER_SPAWN} frozen={blocked} />
        <Waypoint target={gs.objective?.target ?? null} />

        {active.map((e) => (
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

        {allies.map((a) => (
          <Ally key={a.id} id={a.id} spawn={a.spawn} paused={blocked} />
        ))}

        <WeaponController disabled={blocked} weaponOverride={FINALE_WEAPON} />
      </GameCanvas>

      <Hud
        objective={gs.objective}
        interactHint={interactHint}
        progress={phase === 'fight' ? `${killed} / ${TOTAL} guards down` : `${killed} / ${TOTAL} cleared`}
        danger={gs.danger}
        onOpenMenu={() => {
          gs.setPaused(true)
          setMenuOpen(true)
        }}
      />

      {phase !== 'end' && <Minimap variant="custom" custom={mapCustom} />}

      {phase === 'flee' && (
        <div className="finale-fuse" role="status">
          <div className="finale-fuse-num">{fuse}</div>
          <div className="finale-fuse-label">GET CLEAR — {SAFE_DIST}m</div>
        </div>
      )}

      <CombatHud
        lives={run.lives}
        maxLives={run.maxLives}
        weapon={FINALE_WEAPON}
        timeLeftSec={null}
        onOpenInventory={() => setInvOpen(true)}
        toast={toast}
      />
      <InventoryPanel open={invOpen} onClose={() => setInvOpen(false)} />
      <GameOver
        open={run.isGameOver}
        onRestart={() => {
          resetRun()
          gs.setDanger(0.85)
          gs.setObjective({ kind: 'escape', text: 'Fight through the guards to the gate', target: C4_POS })
        }}
      />

      {phase === 'end' && (
        <div className="finale-overlay">
          <div className="finale-card" data-ui>
            <div className="finale-escape">
              <p>Akash limps through the smoke and grips your shoulder.</p>
              <p>"I knew you'd come back for me. Let's get out of here — RUN!"</p>
              <p>Side by side, you sprint through the breach and into the open air.</p>
            </div>
            <div className="finale-end-title">THE END</div>
            <p className="finale-sub">Logic Locker: Breakout — complete.</p>

            {prestigeAward && (
              <div className="finale-prestige">
                <div className="finale-prestige-badge">PRESTIGE {prestigeAward.level}</div>
                <p className="finale-prestige-note">
                  You keep every upgrade. {prestigeAward.item
                    ? `Bonus unlock: ${prestigeAward.item.icon} ${prestigeAward.item.name}.`
                    : 'Your arsenal is already complete.'}{' '}
                  Your run resets to room 1 — clear every block again (tougher
                  questions, bigger swarms) to reach the Warden. The more you learn, the stronger you get.
                </p>
              </div>
            )}

            <table className="finale-stats">
              <tbody>
                <tr>
                  <td>Guards eliminated</td>
                  <td>{TOTAL}</td>
                </tr>
                <tr>
                  <td>Inmates freed (helpers)</td>
                  <td>{MAX_ALLIES}</td>
                </tr>
                <tr>
                  <td>Lives remaining</td>
                  <td>
                    {run.lives} / {run.maxLives}
                  </td>
                </tr>
                <tr>
                  <td>Escape time</td>
                  <td>{fmtTime(elapsedSec)}</td>
                </tr>
                <tr className="finale-score-row">
                  <td>Final score</td>
                  <td>{score.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div className="finale-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  gs.setPaused(false)
                  navigate(R3D.world)
                }}
              >
                {prestigeAward ? `Prestige ${prestigeAward.level} · Replay` : 'Play again'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate(R3D.leaderboard)}>
                View leaderboard
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

export default function FinalePage() {
  return (
    <GameStateProvider>
      <CombatProvider>
        <FinaleInner />
      </CombatProvider>
    </GameStateProvider>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameCanvas, ThirdPersonPlayer, Waypoint } from '../game3d/engine'
import RoomShell from '../game3d/world/RoomShell'
import Hud from '../game3d/hud/Hud'
import GameMenu from '../game3d/hud/GameMenu'
import BossDuel from '../game3d/boss/BossDuel'
import { GameStateProvider, useGameState } from '../game3d/state/GameStateContext'
import { useInventory } from '../game3d/state/InventoryContext'
import { R3D, vec3, type RoomDef, type SectorId } from '../game3d/contracts'

const NEAR_RANGE = 3.6

// Synthetic arena room — the Warden's control throne at the heart of the prison.
const arenaDef: RoomDef = {
  sectorId: 'boss' as SectorId,
  name: "The Warden's Throne",
  theme: 'control',
  size: [28, 24],
  spawn: vec3(0, 1, 9),
  puzzleAnchor: vec3(0, 0, -2),
  exitDoor: { to: 'hub', position: vec3(0, 1.5, -12 + 0.4), rotationY: 0, label: 'Escape' },
}

/** A looming Warden figure at the far end of the arena. */
function Warden() {
  return (
    <group position={[0, 0, -8]}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <capsuleGeometry args={[0.7, 1.8, 6, 12]} />
        <meshStandardMaterial color="#241a1e" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[0, 3.1, 0]} castShadow>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial color="#1a1418" />
      </mesh>
      {/* glowing eyes */}
      <mesh position={[-0.22, 3.15, 0.45]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ff4030" emissive="#ff4030" emissiveIntensity={3} />
      </mesh>
      <mesh position={[0.22, 3.15, 0.45]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ff4030" emissive="#ff4030" emissiveIntensity={3} />
      </mesh>
      {/* throne dais glow */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2.3, 40]} />
        <meshStandardMaterial color="#ff5a48" emissive="#ff5a48" emissiveIntensity={0.8} />
      </mesh>
    </group>
  )
}

function BossInner() {
  const navigate = useNavigate()
  const gs = useGameState()
  const inv = useInventory()

  const [menuOpen, setMenuOpen] = useState(false)
  const [near, setNear] = useState(false)
  const [duelOpen, setDuelOpen] = useState(false)
  const [won, setWon] = useState(false)

  useEffect(() => {
    gs.setDanger(0.72)
    gs.setObjective({
      kind: 'escape',
      text: 'Confront the Warden — pass the final test',
      target: arenaDef.puzzleAnchor,
    })
    return () => gs.setDanger(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Proximity to the Warden's console.
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const p = gs.playerPos.current
      const a = arenaDef.puzzleAnchor
      const d = Math.hypot(a.x - p.x, a.z - p.z)
      const found = !won && d < NEAR_RANGE
      setNear((prev) => (prev === found ? prev : found))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [gs.playerPos, won])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase()
      if ((k === 'e' || k === ' ' || k === 'enter') && near && !menuOpen && !duelOpen && !won) {
        e.preventDefault()
        gs.setPaused(true)
        setDuelOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, menuOpen, duelOpen, won])

  function handleWin() {
    setDuelOpen(false)
    setWon(true)
    gs.setPaused(false)
    gs.setDanger(0)
    gs.setObjective({ kind: 'escape', text: 'The Warden is down — reach the cell block', target: arenaDef.exitDoor.position })
  }

  return (
    <div className="world-root">
      <GameCanvas danger={gs.danger}>
        <RoomShell def={arenaDef} exitOpen={won} highlightExit={won} onExit={() => navigate(R3D.finale)}>
          <Warden />
          {/* console the player activates to start the duel */}
          <mesh position={[arenaDef.puzzleAnchor.x, 0.6, arenaDef.puzzleAnchor.z]} castShadow>
            <boxGeometry args={[1.6, 1.2, 0.9]} />
            <meshStandardMaterial color="#2c3340" emissive="#ff5a48" emissiveIntensity={0.25} />
          </mesh>
        </RoomShell>
        <ThirdPersonPlayer spawn={arenaDef.spawn} frozen={menuOpen || duelOpen} />
        <Waypoint target={gs.objective?.target ?? null} />
      </GameCanvas>

      <Hud
        objective={gs.objective}
        interactHint={near && !won ? 'Press E to face the Warden' : won ? 'Get to the escape door' : null}
        progress="Final Boss"
        onOpenMenu={() => {
          gs.setPaused(true)
          setMenuOpen(true)
        }}
      />

      {near && !duelOpen && !won && (
        <button
          type="button"
          className="game-action-btn game-action-btn--boss"
          onClick={() => {
            gs.setPaused(true)
            setDuelOpen(true)
          }}
        >
          Face the Warden
        </button>
      )}

      {duelOpen && (
        <BossDuel
          prestige={inv.prestige}
          onWin={handleWin}
          onClose={() => {
            setDuelOpen(false)
            gs.setPaused(false)
          }}
        />
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

export default function BossRoomPage() {
  return (
    <GameStateProvider>
      <BossInner />
    </GameStateProvider>
  )
}

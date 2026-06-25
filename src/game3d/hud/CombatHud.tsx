import type { GearItem } from '../systems/gear'
import { useHoldFire } from './useHoldFire'
import '../../styles/combat.css'

export interface CombatHudProps {
  lives: number
  maxLives: number
  weapon: GearItem
  /** Seconds remaining, or null to hide the timer. */
  timeLeftSec: number | null
  onOpenInventory: () => void
  /** Transient pickup/notice text. */
  toast?: string | null
}

function fmt(sec: number): string {
  const s = Math.max(0, Math.ceil(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

export default function CombatHud({
  lives,
  maxLives,
  weapon,
  timeLeftSec,
  onOpenInventory,
  toast,
}: CombatHudProps) {
  const low = timeLeftSec !== null && timeLeftSec <= 15
  const hearts = Array.from({ length: Math.max(maxLives, lives) }, (_, i) => i < lives)
  const holdFire = useHoldFire()

  return (
    <>
      <div className="combat-top">
        <div className="combat-lives" aria-label={`${lives} of ${maxLives} lives`}>
          {hearts.map((on, i) => (
            <span key={i} className={`combat-heart${on ? '' : ' is-lost'}`}>
              ♥
            </span>
          ))}
        </div>
        {timeLeftSec !== null && (
          <div className={`combat-timer${low ? ' is-low' : ''}`}>⏱ {fmt(timeLeftSec)}</div>
        )}
        <button type="button" className="combat-gear-btn" onClick={onOpenInventory} data-ui>
          🎒 Gear <span className="combat-gear-key">I</span>
        </button>
      </div>

      <button
        type="button"
        className="combat-weapon"
        onClick={onOpenInventory}
        data-ui
        title="Open inventory"
      >
        <span className="combat-weapon-icon">{weapon.icon}</span>
        <span className="combat-weapon-name">{weapon.name}</span>
      </button>

      <button
        type="button"
        className="combat-fire"
        data-ui
        {...holdFire}
        aria-label="Fire weapon (F)"
      >
        FIRE
        <span className="combat-fire-key">F</span>
      </button>

      {toast && <div className="combat-toast">{toast}</div>}
    </>
  )
}

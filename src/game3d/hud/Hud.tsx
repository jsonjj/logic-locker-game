import type { ObjectiveState } from '../contracts'
import { useGameState } from '../state/GameStateContext'
import AlarmMeter from './AlarmMeter'
import Joystick3D from './Joystick3D'
import Wayfinder from './Wayfinder'
import '../../styles/hud3d.css'

export interface HudProps {
  objective: ObjectiveState | null
  /** Contextual prompt, e.g. "Press E to use the terminal". */
  interactHint?: string | null
  /** Progress chip, e.g. "2 / 7 blocks". */
  progress?: string
  onOpenMenu: () => void
  /** Override the alarm level; defaults to live gs.danger. (optional) */
  danger?: number
  /** Hide the on-screen joystick (e.g. in cutscenes). Defaults to false. */
  hideJoystick?: boolean
  /** Hide the alarm meter (e.g. calm hub). Defaults to false. */
  hideAlarm?: boolean
}

const KICKERS: Record<ObjectiveState['kind'], string> = {
  goto: 'Objective',
  solve: 'Crack it',
  return: 'Fall back',
  escape: 'Get out',
  review: 'Study',
}

/** Splits a hint like "Press E to use the terminal" into a key cap + the rest. */
function parseHint(hint: string): { key: string | null; rest: string } {
  const m = hint.match(/^press\s+([^\s]+)\s+(.*)$/i)
  if (m) return { key: m[1].toUpperCase(), rest: m[2] }
  return { key: null, rest: hint }
}

/**
 * The persistent in-game HUD: objective banner, progress chip, alarm meter,
 * contextual interact prompt, menu button, and the mobile joystick. The root is
 * pointer-events:none (base .hud3d); only interactive children opt back in.
 */
export default function Hud({
  objective,
  interactHint,
  progress,
  onOpenMenu,
  danger,
  hideJoystick = false,
  hideAlarm = false,
}: HudProps) {
  const gs = useGameState()
  const level = Math.min(1, Math.max(0, danger ?? gs.danger))
  const showVignette = level >= 0.66
  const hint = interactHint ? parseHint(interactHint) : null

  return (
    <div className="hud3d">
      <div
        className={`hud-vignette${showVignette ? ' is-on' : ''}`}
        style={{ '--hud-vignette-opacity': Math.min(0.65, (level - 0.5) * 1.3) } as React.CSSProperties}
        aria-hidden
      />

      <div className="hud3d-top">
        <div className="hud3d-banner">
          {objective && (
            <div className="hud3d-objective">
              <span className="hud3d-objective-dot" />
              <span>
                <span className="hud3d-objective-kicker">{KICKERS[objective.kind]}</span>
                <br />
                <span className="hud3d-objective-text">{objective.text}</span>
              </span>
            </div>
          )}
          {!hideAlarm && <AlarmMeter danger={level} />}
        </div>

        <div className="hud3d-top-right">
          {progress && (
            <span className="hud-chip">
              <span className="hud-chip-icon" aria-hidden />
              {progress}
            </span>
          )}
          <button
            type="button"
            className="hud-menu-btn"
            onClick={onOpenMenu}
            aria-label="Open pause menu"
          >
            <span className="hud-menu-bars" aria-hidden>
              <span />
              <span />
              <span />
            </span>
            Menu
          </button>
        </div>
      </div>

      <Wayfinder />

      {hint && (
        <div className="hud3d-interact">
          {hint.key && <span className="hud-key">{hint.key}</span>}
          <span>{hint.rest}</span>
        </div>
      )}

      {!hideJoystick && <Joystick3D />}
    </div>
  )
}

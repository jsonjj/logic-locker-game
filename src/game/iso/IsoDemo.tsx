import { useState } from 'react'
import { useTopDownPlayer } from '../useTopDownPlayer'
import DetectiveSprite from '../DetectiveSprite'
import Joystick from '../Joystick'
import IsoStage from './IsoStage'
import IsoEntity from './IsoEntity'
import WardenSprite from './sprites/WardenSprite'
import MentorSprite from './sprites/MentorSprite'
import IsoBlock from './sprites/IsoBlock'
import type { Vec2 } from '../lockdown/contracts'

/** Static set dressing — wall/crate props placed around the diamond floor. */
const PROPS: { pos: Vec2; tone: 'iron' | 'amber' | 'warden' }[] = [
  { pos: { x: 18, y: 30 }, tone: 'iron' },
  { pos: { x: 82, y: 30 }, tone: 'iron' },
  { pos: { x: 30, y: 70 }, tone: 'amber' },
  { pos: { x: 70, y: 70 }, tone: 'warden' },
]

/**
 * Standalone self-test for Agent A's iso layer. Renders a fortress IsoStage
 * with a player driven by the real top-down controller, a looming Warden, the
 * captive mentor, and a few wall props so the projection / depth sorting / art
 * can be eyeballed. Not wired into routing — import it anywhere to inspect.
 */
export default function IsoDemo() {
  const { pos, facing, moving, setJoy } = useTopDownPlayer({
    start: { x: 50, y: 60 },
    speed: 30,
  })
  const [variant, setVariant] = useState<'corridor' | 'cell' | 'vault'>('corridor')
  const [danger, setDanger] = useState(0.2)

  return (
    <div className="iso-demo-wrap lockdown">
      <div className="iso-demo-caption">
        <strong>Iso layer self-test</strong> — move with WASD / arrows / the joystick. The hero
        sorts in front of and behind the Warden, mentor, and props as you walk past them.
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {(['corridor', 'cell', 'vault'] as const).map((v) => (
          <button
            key={v}
            type="button"
            className="btn btn-ghost"
            onClick={() => setVariant(v)}
            style={{ fontWeight: variant === v ? 800 : 500 }}
          >
            {v}
          </button>
        ))}
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
          danger
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={danger}
            onChange={(e) => setDanger(Number(e.target.value))}
          />
        </label>
      </div>

      <IsoStage variant={variant} danger={danger}>
        {PROPS.map((p, i) => (
          <IsoEntity key={i} pos={p.pos}>
            <IsoBlock tone={p.tone} />
          </IsoEntity>
        ))}

        {/* Captive mentor, deep in the room */}
        <IsoEntity pos={{ x: 50, y: 24 }}>
          <MentorSprite facing="down" />
        </IsoEntity>

        {/* The Warden, patrolling */}
        <IsoEntity pos={{ x: 64, y: 40 }}>
          <WardenSprite facing="left" />
        </IsoEntity>

        {/* The player */}
        <IsoEntity pos={pos}>
          <DetectiveSprite facing={facing} moving={moving} />
        </IsoEntity>

        <Joystick onChange={setJoy} />
      </IsoStage>
    </div>
  )
}

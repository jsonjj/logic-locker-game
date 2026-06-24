import type { Facing } from '../../useTopDownPlayer'

/**
 * Akash — the player's mentor, a monkey being held captive deep in the
 * fortress. Slumped posture, wrist binders, and a dimmed palette signal that
 * he's the rescue objective. `moving` is accepted for a uniform sprite contract
 * but Akash stays put until freed.
 */
export default function MentorSprite({
  facing = 'down',
  moving = false,
  size = 76,
}: {
  facing?: Facing
  moving?: boolean
  size?: number
}) {
  const flip = facing === 'left'
  return (
    <div
      className={`sprite ${moving ? 'sprite-walk' : ''}`}
      style={{ width: size, height: size, transform: flip ? 'scaleX(-1)' : undefined }}
    >
      <svg viewBox="0 0 64 72" width={size} height={size} aria-hidden focusable="false">
        {/* contact shadow */}
        <ellipse cx="32" cy="68" rx="15" ry="4" fill="rgba(10,12,30,0.22)" />

        {/* prisoner tunic */}
        <path d="M20 45 q12 -6 24 0 l1 16 q-13 6 -26 0 z" fill="#3a4150" />
        {/* worn stripes */}
        <path d="M21 50 h22" stroke="#2a303b" strokeWidth="2" />
        <path d="M21 56 h22" stroke="#2a303b" strokeWidth="2" />

        {/* slumped arms + wrist binders */}
        <path d="M22 47 q-5 6 -2 13" fill="none" stroke="#7a5230" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M42 47 q5 6 2 13" fill="none" stroke="#7a5230" strokeWidth="4.5" strokeLinecap="round" />
        {/* binder cuffs glowing faint alarm */}
        <rect x="18" y="58" width="8" height="4" rx="2" fill="#1b1e25" />
        <rect x="38" y="58" width="8" height="4" rx="2" fill="#1b1e25" />
        <rect x="20.5" y="59" width="3" height="2" rx="1" fill="#e5484d" opacity="0.8" />
        <rect x="40.5" y="59" width="3" height="2" rx="1" fill="#e5484d" opacity="0.8" />
        {/* binding chain between cuffs */}
        <path d="M26 60 q6 4 12 0" fill="none" stroke="#5b6675" strokeWidth="1.4" strokeDasharray="2 2" />

        {/* tail, drooped */}
        <path d="M20 56 q-8 4 -7 11" fill="none" stroke="#6f4a2d" strokeWidth="3.2" strokeLinecap="round" />

        {/* head, tilted down */}
        <circle cx="32" cy="29" r="17" fill="#7a5230" />
        {/* ears */}
        <circle cx="16" cy="27" r="5.5" fill="#7a5230" />
        <circle cx="48" cy="27" r="5.5" fill="#7a5230" />
        <circle cx="16" cy="27" r="2.8" fill="#a9764a" />
        <circle cx="48" cy="27" r="2.8" fill="#a9764a" />
        {/* face */}
        <ellipse cx="32" cy="33" rx="12" ry="11" fill="#e0bd95" />
        {/* tired eyes */}
        <path d="M25 31 q1.6 1.6 3.4 0" fill="none" stroke="#2a211b" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M35.6 31 q1.6 1.6 3.4 0" fill="none" stroke="#2a211b" strokeWidth="1.6" strokeLinecap="round" />
        {/* nose + weary mouth */}
        <ellipse cx="32" cy="36" rx="3.2" ry="2" fill="#b07e54" />
        <path d="M28 40 q4 -2 8 0" fill="none" stroke="#7c5a3c" strokeWidth="1.3" strokeLinecap="round" />

        {/* mentor's grey streak / glasses to read as the wise elder */}
        <path d="M19 22 q13 -8 26 0" fill="none" stroke="#c8cdd6" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <circle cx="26" cy="31" r="4.2" fill="none" stroke="#3a4150" strokeWidth="1.2" opacity="0.6" />
        <circle cx="38" cy="31" r="4.2" fill="none" stroke="#3a4150" strokeWidth="1.2" opacity="0.6" />
        <path d="M30 31 h4" stroke="#3a4150" strokeWidth="1.2" opacity="0.6" />
      </svg>
    </div>
  )
}

import type { Facing } from './useTopDownPlayer'

/**
 * The player: a re-styled monkey agent who broke out of the Warden's fortress.
 * Drawn as flat SVG shapes in a tactical escape rig with amber rescue accents.
 *
 * Export signature is intentionally unchanged (default export, `facing` +
 * `moving`) so RoomScene / GameHallway keep compiling. Flips horizontally when
 * walking left; a CSS bob animation runs while moving.
 */
export default function DetectiveSprite({
  facing,
  moving,
  size = 76,
}: {
  facing: Facing
  moving: boolean
  size?: number
}) {
  const flip = facing === 'left'
  return (
    <div
      className={`sprite ${moving ? 'sprite-walk' : ''}`}
      style={{ width: size, height: size, transform: flip ? 'scaleX(-1)' : undefined }}
    >
      <svg viewBox="0 0 64 72" width={size} height={size} aria-hidden focusable="false">
        {/* soft contact shadow */}
        <ellipse cx="32" cy="68" rx="16" ry="4" fill="rgba(10,12,30,0.22)" />

        {/* legs / boots */}
        <rect x="24" y="56" width="6.5" height="11" rx="3" fill="#23262e" />
        <rect x="33.5" y="56" width="6.5" height="11" rx="3" fill="#23262e" />

        {/* tactical jumpsuit body */}
        <path d="M19 43 q13 -7 26 0 l2 17 q-15 6 -30 0 z" fill="#2c333f" />
        {/* rescue harness straps */}
        <path d="M24 44 l6 16" stroke="#f5a524" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M40 44 l-6 16" stroke="#f5a524" strokeWidth="2.4" strokeLinecap="round" />
        {/* chest buckle */}
        <rect x="29" y="50" width="6" height="5" rx="1.2" fill="#d8a657" />
        {/* utility belt */}
        <rect x="18" y="58" width="28" height="4" rx="2" fill="#1b1e25" />
        <rect x="30" y="58" width="4" height="4" rx="1" fill="#f5a524" />

        {/* tail curling out behind */}
        <path
          d="M18 56 q-9 2 -10 -6 q-1 -5 3 -5"
          fill="none"
          stroke="#6f4a2d"
          strokeWidth="3.4"
          strokeLinecap="round"
        />

        {/* arm + glowing keycard tool */}
        <path d="M44 46 q7 1 9 7" fill="none" stroke="#2c333f" strokeWidth="5" strokeLinecap="round" />
        <rect x="50" y="52" width="9" height="6" rx="1.4" fill="#2aa7ff" opacity="0.85" />
        <rect x="50" y="52" width="9" height="6" rx="1.4" fill="none" stroke="#bfe9ff" strokeWidth="1" />

        {/* head */}
        <circle cx="32" cy="27" r="18" fill="#7a5230" />
        {/* ears */}
        <circle cx="15" cy="25" r="6" fill="#7a5230" />
        <circle cx="49" cy="25" r="6" fill="#7a5230" />
        <circle cx="15" cy="25" r="3" fill="#a9764a" />
        <circle cx="49" cy="25" r="3" fill="#a9764a" />
        {/* face */}
        <ellipse cx="32" cy="31" rx="13" ry="12" fill="#e7c39c" />
        {/* eyes — determined */}
        <circle cx="26" cy="28" r="2.4" fill="#2a211b" />
        <circle cx="38" cy="28" r="2.4" fill="#2a211b" />
        <circle cx="26.8" cy="27.2" r="0.8" fill="#fff" />
        <circle cx="38.8" cy="27.2" r="0.8" fill="#fff" />
        {/* brow */}
        <path d="M22 23 l8 2" stroke="#5e4636" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M42 23 l-8 2" stroke="#5e4636" strokeWidth="1.6" strokeLinecap="round" />
        {/* nose + mouth */}
        <ellipse cx="32" cy="34" rx="3.4" ry="2.2" fill="#b07e54" />
        <circle cx="30.6" cy="34" r="0.7" fill="#5e4636" />
        <circle cx="33.4" cy="34" r="0.7" fill="#5e4636" />
        <path d="M28 38 q4 3 8 0" fill="none" stroke="#7c5a3c" strokeWidth="1.3" strokeLinecap="round" />

        {/* amber-lit tactical headband / comms visor */}
        <path d="M14 19 q18 -10 36 0 l-1 4 q-17 -7 -34 0 z" fill="#1b1e25" />
        <rect x="42" y="18" width="6" height="3.4" rx="1.4" fill="#f5a524" />
        <circle cx="45" cy="19.7" r="1" fill="#fff3d6" />
      </svg>
    </div>
  )
}

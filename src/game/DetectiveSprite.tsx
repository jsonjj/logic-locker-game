import type { Facing } from './useTopDownPlayer'

/**
 * A stylized monkey detective, drawn as flat SVG shapes. Faces front and flips
 * horizontally when walking left; a CSS bob animation runs while moving.
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
        <ellipse cx="32" cy="68" rx="16" ry="4" fill="rgba(10,12,30,0.18)" />

        {/* coat / body */}
        <path d="M19 44 q13 -8 26 0 l2 18 q-15 7 -30 0 z" fill="#6a5cff" />
        <path d="M32 44 v20" stroke="#4b3fd0" strokeWidth="1.6" />
        {/* collar */}
        <path d="M24 45 l8 6 8 -6 -3 -4 -5 3 -5 -3 z" fill="#efe9ff" />

        {/* magnifying glass in hand */}
        <g>
          <circle cx="49" cy="52" r="6" fill="none" stroke="#cdbf36" strokeWidth="2.4" />
          <circle cx="49" cy="52" r="4" fill="#bfe9ff" opacity="0.65" />
          <line x1="53" y1="56" x2="58" y2="61" stroke="#8a6d1f" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* head */}
        <circle cx="32" cy="28" r="18" fill="#9a6a44" />
        {/* ears */}
        <circle cx="15" cy="26" r="6" fill="#9a6a44" />
        <circle cx="49" cy="26" r="6" fill="#9a6a44" />
        <circle cx="15" cy="26" r="3" fill="#c79a73" />
        <circle cx="49" cy="26" r="3" fill="#c79a73" />
        {/* face */}
        <ellipse cx="32" cy="32" rx="13" ry="12" fill="#e7c39c" />
        {/* eyes */}
        <circle cx="26" cy="29" r="2.4" fill="#2a211b" />
        <circle cx="38" cy="29" r="2.4" fill="#2a211b" />
        <circle cx="26.8" cy="28.2" r="0.8" fill="#fff" />
        <circle cx="38.8" cy="28.2" r="0.8" fill="#fff" />
        {/* nose + mouth */}
        <ellipse cx="32" cy="35" rx="3.4" ry="2.2" fill="#b07e54" />
        <circle cx="30.6" cy="35" r="0.7" fill="#5e4636" />
        <circle cx="33.4" cy="35" r="0.7" fill="#5e4636" />
        <path d="M28 39 q4 3 8 0" fill="none" stroke="#7c5a3c" strokeWidth="1.3" strokeLinecap="round" />

        {/* deerstalker detective hat */}
        <path d="M14 20 q18 -14 36 0 q-18 -6 -36 0 z" fill="#7a5230" />
        <path d="M16 19 q16 -16 32 0 q-16 -9 -32 0 z" fill="#90653c" />
        <ellipse cx="32" cy="13" rx="6" ry="4" fill="#7a5230" />
      </svg>
    </div>
  )
}

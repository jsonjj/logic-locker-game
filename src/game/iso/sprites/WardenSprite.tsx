import type { Facing } from '../../useTopDownPlayer'

/**
 * The Warden — the human antagonist who runs the fortress. An imposing figure
 * in a long warden's coat with the threat-side violet/alarm palette. Drawn as
 * flat SVG so it stays cheap on low-end hardware. `moving` is accepted for a
 * uniform sprite contract but the Warden looms rather than bobs.
 */
export default function WardenSprite({
  facing = 'down',
  moving = false,
  size = 84,
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
      <svg viewBox="0 0 64 78" width={size} height={size} aria-hidden focusable="false">
        {/* contact shadow */}
        <ellipse cx="32" cy="74" rx="18" ry="4.5" fill="rgba(10,12,30,0.3)" />

        {/* long warden coat */}
        <path d="M16 42 q16 -9 32 0 l4 30 q-20 7 -40 0 z" fill="#2a2440" />
        <path d="M32 44 v30" stroke="#1a1630" strokeWidth="1.8" />
        {/* coat trim — warden violet */}
        <path d="M16 42 l4 30" stroke="#7a3cf0" strokeWidth="2" strokeLinecap="round" />
        <path d="M48 42 l-4 30" stroke="#7a3cf0" strokeWidth="2" strokeLinecap="round" />

        {/* shoulders / pauldrons */}
        <path d="M14 44 q6 -8 14 -6 l-2 8 q-7 -2 -12 4 z" fill="#3a3358" />
        <path d="M50 44 q-6 -8 -14 -6 l2 8 q7 -2 12 4 z" fill="#3a3358" />

        {/* alarm-red authority sash */}
        <path d="M22 44 l18 24" stroke="#e5484d" strokeWidth="3.2" strokeLinecap="round" opacity="0.92" />

        {/* gloved hand holding a baton */}
        <path d="M48 50 q7 2 8 10" fill="none" stroke="#2a2440" strokeWidth="5.5" strokeLinecap="round" />
        <rect x="53" y="56" width="3.4" height="16" rx="1.6" fill="#1a1630" />
        <rect x="52" y="55" width="5.4" height="4" rx="1.2" fill="#7a3cf0" />

        {/* head */}
        <circle cx="32" cy="26" r="15" fill="#caa784" />
        {/* stern face */}
        <ellipse cx="32" cy="29" rx="11" ry="11" fill="#d8b894" />
        {/* hard eyes with violet glow */}
        <path d="M23 25 l7 2" stroke="#2a211b" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M41 25 l-7 2" stroke="#2a211b" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="27" cy="28" r="2" fill="#7a3cf0" />
        <circle cx="37" cy="28" r="2" fill="#7a3cf0" />
        {/* set jaw */}
        <path d="M28 35 q4 2 8 0" fill="none" stroke="#7c5a3c" strokeWidth="1.6" strokeLinecap="round" />

        {/* warden's peaked cap */}
        <path d="M17 19 q15 -12 30 0 l-1 3 q-14 -6 -28 0 z" fill="#1a1630" />
        <rect x="16" y="21" width="32" height="4" rx="2" fill="#241d3c" />
        {/* cap badge */}
        <circle cx="32" cy="16" r="2.6" fill="#7a3cf0" />
        <circle cx="32" cy="16" r="1.2" fill="#cbb3ff" />
      </svg>
    </div>
  )
}

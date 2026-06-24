/**
 * A simple riveted iron block used as a static iso prop (wall segment or crate).
 * Pure CSS layers — handy for dressing the fortress floor in the demo and in
 * real sectors without per-frame cost.
 */
export default function IsoBlock({
  size = 60,
  tone = 'iron',
}: {
  size?: number
  /** Visual tone of the block. */
  tone?: 'iron' | 'amber' | 'warden'
}) {
  const tint =
    tone === 'amber'
      ? 'var(--ll-amber-deep, #c77b10)'
      : tone === 'warden'
        ? 'var(--ll-warden-deep, #4f23a8)'
        : 'var(--ll-stone-500, #475263)'

  return (
    <div className="iso-block" style={{ width: size, height: size }}>
      <div className="iso-block-top" style={{ background: `linear-gradient(135deg, ${tint}, var(--ll-stone-800, #1c2129))` }} />
      <div className="iso-block-rivets" />
    </div>
  )
}

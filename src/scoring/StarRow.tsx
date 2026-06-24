import type { StarRank } from '../game/lockdown/contracts'
import '../styles/scoring.css'

interface StarRowProps {
  stars: StarRank
  /** Pixel size of each star. */
  size?: number
  /** Pop the earned stars in one-by-one. */
  animate?: boolean
}

const TOTAL_STARS = 3

function Star({
  filled,
  size,
  animate,
  index,
}: {
  filled: boolean
  size: number
  animate: boolean
  index: number
}) {
  return (
    <svg
      className={`ll-star ${filled ? 'is-filled' : 'is-empty'} ${animate ? 'is-animate' : ''}`}
      style={animate ? { animationDelay: `${index * 160}ms` } : undefined}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={filled ? 'Earned star' : 'Empty star'}
    >
      <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.9l-5.8 3.05 1.11-6.46-4.7-4.58 6.49-.94L12 2.5z" />
    </svg>
  )
}

/** A row of three stars, filled according to the earned rank. */
export default function StarRow({ stars, size = 32, animate = false }: StarRowProps) {
  return (
    <div className="ll-star-row" role="group" aria-label={`${stars} of ${TOTAL_STARS} stars`}>
      {Array.from({ length: TOTAL_STARS }, (_, i) => (
        <Star key={i} index={i} filled={i < stars} size={size} animate={animate && i < stars} />
      ))}
    </div>
  )
}

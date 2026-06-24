import type { PuzzleReviewItem } from '../contracts'
import '../../styles/review-session.css'

export interface ReviewSessionProps {
  items: PuzzleReviewItem[]
  sectorName?: string
  onClose: () => void
}

/**
 * A short post-room debrief. Lists every question the player just answered with
 * a right/wrong mark, and for the ones they missed, a plain-language reason the
 * wrong answer fails plus the core things to remember next time.
 */
export default function ReviewSession({ items, sectorName, onClose }: ReviewSessionProps) {
  const total = items.length
  const right = items.filter((i) => i.correct).length
  const missed = items.filter((i) => !i.correct)

  return (
    <div className="review-overlay" role="dialog" aria-modal="true" aria-label="Debrief">
      <div className="review-card" data-ui>
        <div className="review-head">
          <span className="review-kicker">Debrief{sectorName ? ` · ${sectorName}` : ''}</span>
          <h2 className="review-title">Let’s go over that</h2>
          <p className="review-score">
            You nailed <b>{right}</b> of <b>{total}</b> on the first try.
            {missed.length > 0 && ' Here’s where it slipped — and what to remember.'}
          </p>
        </div>

        <ul className="review-list">
          {items.map((item, i) => (
            <li key={i} className={`review-item ${item.correct ? 'is-right' : 'is-wrong'}`}>
              <span className="review-mark" aria-hidden>
                {item.correct ? '✓' : '✗'}
              </span>
              <div className="review-body">
                <p className="review-q">{item.prompt}</p>
                {!item.correct && item.explanation && (
                  <p className="review-why">
                    <span className="review-label">Why:</span> {item.explanation}
                  </p>
                )}
                {!item.correct && item.takeaways && item.takeaways.length > 0 && (
                  <div className="review-remember">
                    <span className="review-label">Remember</span>
                    <ul>
                      {item.takeaways.map((t, k) => (
                        <li key={k}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="review-actions">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Got it — continue
          </button>
        </div>
      </div>
    </div>
  )
}

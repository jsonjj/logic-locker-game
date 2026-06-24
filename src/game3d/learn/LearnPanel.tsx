import { useState } from 'react'
import { getReviewDeck } from '../review/decks'
import { getSector } from '../../data/sectors'
import type { SectorId } from '../contracts'
import '../../styles/learn.css'

export interface LearnPanelProps {
  sectorId: SectorId
  /** Player finished the briefing and wants to attempt the lock (mini-quiz). */
  onBegin: () => void
}

/**
 * The short "learn before you quiz" beat shown when the player enters a block:
 * a quick briefing of the block's concept(s) (sourced from the sector's review
 * deck) before they walk up to the security lock and prove it. Keeps the loop
 * "learn a little → solve a little", room by room.
 */
export default function LearnPanel({ sectorId, onBegin }: LearnPanelProps) {
  const deck = getReviewDeck(sectorId)
  const sector = getSector(sectorId)
  const topics = deck?.topics ?? []
  const [i, setI] = useState(0)
  const topic = topics[i]
  const last = i >= topics.length - 1
  const teacher = deck?.teacherLines?.[0]?.text

  return (
    <div className="learn-overlay">
      <div className="learn-card">
        <div className="learn-kicker">Briefing · {sector?.name ?? 'Block'}</div>
        {teacher && <p className="learn-teacher">“{teacher}”</p>}

        {topic ? (
          <>
            <h2 className="learn-term">{topic.term}</h2>
            <p className="learn-detail">{topic.detail}</p>
            {topic.example && <p className="learn-example">Example: {topic.example}</p>}
          </>
        ) : (
          <p className="learn-detail">Crack the lock to break into the next block.</p>
        )}

        <div className="learn-actions">
          <span className="learn-progress">
            {topics.length > 0 ? `${i + 1} / ${topics.length}` : ''}
          </span>
          <div className="learn-buttons">
            {i > 0 && (
              <button type="button" className="btn btn-ghost" onClick={() => setI((n) => n - 1)}>
                Back
              </button>
            )}
            {topics.length > 0 && !last ? (
              <button type="button" className="btn btn-primary" onClick={() => setI((n) => n + 1)}>
                Next
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={onBegin}>
                Work the lock →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * [Agent 3] EVIDENCE LOCKER — maps clueSort steps onto a sealed evidence locker.
 * File each statement into the correct drawer (category), then pull the lever to
 * verify. Misfiled items are flagged so the player can re-sort; never hard-fails.
 */
import { useMemo, useState } from 'react'
import type { ClueSortStep } from '../../types'
import type { DeviceCallbacks } from './types'

interface Props extends DeviceCallbacks {
  step: ClueSortStep
}

export default function EvidenceLocker({ step, onSolved, onMistake }: Props) {
  const [assigned, setAssigned] = useState<Record<string, string>>({})
  const [wrongIds, setWrongIds] = useState<string[]>([])
  const [attempts, setAttempts] = useState(0)
  const [solved, setSolved] = useState(false)

  const allAssigned = useMemo(
    () => step.cards.every((card) => assigned[card.id] !== undefined),
    [assigned, step.cards],
  )

  const assign = (cardId: string, category: string) => {
    if (solved) return
    setAssigned((prev) => ({ ...prev, [cardId]: category }))
    setWrongIds((w) => w.filter((id) => id !== cardId))
  }

  const verify = () => {
    if (solved || !allAssigned) return
    const wrong = step.cards
      .filter((card) => assigned[card.id] !== step.correctAnswer[card.id])
      .map((card) => card.id)
    if (wrong.length === 0) {
      setSolved(true)
      onSolved()
    } else {
      setWrongIds(wrong)
      setAttempts((a) => a + 1)
      onMistake()
    }
  }

  const feedback = step.feedback
  let message: { tone: 'good' | 'bad'; text: string } | null = null
  if (solved && feedback) {
    message = { tone: 'good', text: feedback.correct }
  } else if (attempts > 0 && feedback) {
    message = { tone: 'bad', text: attempts <= 1 ? feedback.firstWrong : feedback.secondWrong }
  }

  return (
    <div className="p3-device">
      <p className="p3-prompt">{step.prompt}</p>
      <div className="p3-cards">
        {step.cards.map((card) => {
          const current = assigned[card.id]
          const isWrong = wrongIds.includes(card.id)
          return (
            <div
              key={card.id}
              className={`p3-card${isWrong ? ' wrong' : ''}${solved ? ' locked' : ''}`}
            >
              <div className="p3-card-text">{card.text}</div>
              <div className="p3-bins">
                {step.categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`p3-bin${current === category ? ' active' : ''}`}
                    disabled={solved}
                    onClick={() => assign(card.id, category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {message && <p className={`p3-feedback ${message.tone}`}>{message.text}</p>}
      {!solved && (
        <div>
          <button type="button" className="p3-btn primary" disabled={!allAssigned} onClick={verify}>
            {allAssigned ? 'Seal & verify locker' : 'File every item to continue'}
          </button>
        </div>
      )}
    </div>
  )
}

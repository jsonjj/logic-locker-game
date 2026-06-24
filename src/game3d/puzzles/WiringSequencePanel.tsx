/**
 * [Agent 3] RELAY SEQUENCER — maps ordering steps onto a wiring harness whose
 * relays must fire in the correct order. Move each lead up or down, then test the
 * sequence. A wrong order trips the alarm but leaves the wiring intact to retry.
 */
import { useState } from 'react'
import type { OrderingItem, OrderingStep } from '../../types'
import type { DeviceCallbacks } from './types'

interface Props extends DeviceCallbacks {
  step: OrderingStep
}

/** Deterministically scramble so the harness never starts already-solved. */
function scramble(items: OrderingItem[], answer: string[]): OrderingItem[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  const ordered = answer.map((id) => byId.get(id)).filter((x): x is OrderingItem => Boolean(x))
  const pool = ordered.length === items.length ? ordered : items
  if (pool.length < 2) return [...pool]
  const rotated = [...pool.slice(1), pool[0]]
  // Guarantee at least the first slot differs from the solution.
  if (rotated[0]?.id === answer[0]) return [...pool].reverse()
  return rotated
}

export default function WiringSequencePanel({ step, onSolved, onMistake }: Props) {
  const [order, setOrder] = useState<OrderingItem[]>(() => scramble(step.items, step.correctAnswer))
  const [attempts, setAttempts] = useState(0)
  const [wrong, setWrong] = useState(false)
  const [solved, setSolved] = useState(false)

  const move = (index: number, delta: number) => {
    if (solved) return
    const next = index + delta
    if (next < 0 || next >= order.length) return
    setOrder((prev) => {
      const copy = [...prev]
      const [item] = copy.splice(index, 1)
      copy.splice(next, 0, item)
      return copy
    })
    setWrong(false)
  }

  const test = () => {
    if (solved) return
    const correct = order.every((item, i) => item.id === step.correctAnswer[i])
    if (correct) {
      setSolved(true)
      onSolved()
    } else {
      setWrong(true)
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
      <ol className="p3-seq">
        {order.map((item, i) => (
          <li
            key={item.id}
            className={`p3-seq-item${wrong ? ' wrong' : ''}${solved ? ' locked' : ''}`}
          >
            <span className="p3-seq-rank">{i + 1}</span>
            <span className="p3-seq-text">{item.text}</span>
            <span className="p3-seq-moves">
              <button
                type="button"
                className="p3-seq-move"
                disabled={solved || i === 0}
                aria-label="Move earlier"
                onClick={() => move(i, -1)}
              >
                ▲
              </button>
              <button
                type="button"
                className="p3-seq-move"
                disabled={solved || i === order.length - 1}
                aria-label="Move later"
                onClick={() => move(i, 1)}
              >
                ▼
              </button>
            </span>
          </li>
        ))}
      </ol>
      {message && <p className={`p3-feedback ${message.tone}`}>{message.text}</p>}
      {!solved && (
        <div>
          <button type="button" className="p3-btn primary" onClick={test}>
            Test relay sequence
          </button>
        </div>
      )}
    </div>
  )
}

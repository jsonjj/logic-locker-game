/**
 * [Agent 3] OVERRIDE CONSOLE — maps multipleChoice / prediction / highlightChoice
 * / symbolTap steps onto a guard-station override panel. Pick the correct command
 * to authorise the breach. Wrong picks raise the alarm but never hard-fail.
 */
import { useState } from 'react'
import type { ChoiceStep } from '../../types'
import type { DeviceCallbacks } from './types'

interface Props extends DeviceCallbacks {
  step: ChoiceStep
}

const KEYS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function OverrideConsole({ step, onSolved, onMistake }: Props) {
  const [picked, setPicked] = useState<string | null>(null)
  const [wrongIds, setWrongIds] = useState<string[]>([])
  const [attempts, setAttempts] = useState(0)
  const [solved, setSolved] = useState(false)

  const handlePick = (id: string) => {
    if (solved || wrongIds.includes(id)) return
    if (id === step.correctAnswer) {
      setPicked(id)
      setSolved(true)
      onSolved()
    } else {
      setPicked(id)
      setWrongIds((w) => [...w, id])
      setAttempts((a) => a + 1)
      onMistake()
    }
  }

  const feedback = step.feedback
  let message: { tone: 'good' | 'bad'; text: string } | null = null
  if (solved && feedback) {
    message = { tone: 'good', text: feedback.correct }
  } else if (picked && !solved && feedback) {
    message = { tone: 'bad', text: attempts <= 1 ? feedback.firstWrong : feedback.secondWrong }
  }

  return (
    <div className="p3-device">
      <p className="p3-prompt">{step.prompt}</p>
      <div className="p3-options" role="listbox" aria-label="Override commands">
        {step.choices.map((choice, i) => {
          const isCorrect = solved && choice.id === step.correctAnswer
          const isWrong = wrongIds.includes(choice.id)
          return (
            <button
              key={choice.id}
              type="button"
              role="option"
              aria-selected={picked === choice.id}
              className={`p3-option${isCorrect ? ' correct' : ''}${isWrong ? ' wrong' : ''}`}
              disabled={solved || isWrong}
              onClick={() => handlePick(choice.id)}
            >
              <span className="p3-option-key">{isCorrect ? '✓' : isWrong ? '✕' : KEYS[i] ?? '•'}</span>
              <span>{choice.label}</span>
            </button>
          )
        })}
      </div>
      {message && <p className={`p3-feedback ${message.tone}`}>{message.text}</p>}
    </div>
  )
}

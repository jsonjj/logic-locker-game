import { useMemo, useState } from 'react'
import { lessons } from '../../data/lessons'
import ChoiceStepView from '../../components/steps/ChoiceStepView'
import StepVisual from '../../components/StepVisual'
import { getEndingLines } from '../story/objectives'
import type { ChoiceStep } from '../../types'
import '../../styles/boss.css'

const CHOICE_TYPES = ['multipleChoice', 'prediction', 'highlightChoice', 'symbolTap']

/**
 * One cumulative question per lesson — the "test on everything". Prefers a
 * question that carries its own context (a visual: grid/clues/options) so the
 * prompt is never asked without the facts needed to answer it.
 */
function buildExam(): ChoiceStep[] {
  const out: ChoiceStep[] = []
  for (const l of lessons) {
    const choices = l.steps.filter((s) => CHOICE_TYPES.includes(s.type)) as ChoiceStep[]
    const q = choices.find((s) => s.visual) ?? choices[0]
    if (q) out.push(q)
  }
  return out
}

export interface BossDuelProps {
  /** Player subdued the Warden (passed the cumulative test). */
  onWin: () => void
  /** Player bailed out of the duel. */
  onClose: () => void
}

/**
 * The final boss: a cumulative test drawn from every block. Each correct answer
 * lands a hit on the Warden; each miss costs a heart. Subdue the Warden (clear
 * the threshold) to win. Learning-safe: running out of hearts just lets you
 * regroup and retry — you're never permanently failed.
 */
export default function BossDuel({ onWin, onClose }: BossDuelProps) {
  const exam = useMemo(buildExam, [])
  const total = exam.length
  const threshold = Math.max(1, Math.ceil(total * 0.7))

  const [i, setI] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [hearts, setHearts] = useState(3)
  const [locked, setLocked] = useState(false)
  const [feedback, setFeedback] = useState<null | { ok: boolean; text: string }>(null)
  const [outcome, setOutcome] = useState<null | 'win' | 'lose'>(null)

  const q = exam[i]
  const wardenPct = total > 0 ? Math.max(0, (total - correct) / total) : 0

  function handleResult(ok: boolean) {
    if (locked || !q) return
    setLocked(true)
    setCorrect((c) => c + (ok ? 1 : 0))
    setHearts((h) => (ok ? h : h - 1))
    setFeedback({
      ok,
      text: ok
        ? q.feedback?.correct ?? 'Direct hit — the Warden staggers.'
        : q.feedback?.firstWrong ?? 'The Warden shrugs it off. Stay sharp.',
    })
  }

  function advance() {
    setFeedback(null)
    setLocked(false)
    if (hearts <= 0) {
      setOutcome('lose')
      return
    }
    const next = i + 1
    if (next >= total) {
      setOutcome(correct >= threshold ? 'win' : 'lose')
      return
    }
    setI(next)
  }

  function retry() {
    setI(0)
    setCorrect(0)
    setHearts(3)
    setLocked(false)
    setFeedback(null)
    setOutcome(null)
  }

  if (outcome) {
    const won = outcome === 'win'
    return (
      <div className="boss-overlay">
        <div className={`boss-card boss-outcome ${won ? 'is-win' : 'is-lose'}`}>
          <div className="boss-kicker">{won ? 'The Warden falls' : 'The Warden holds'}</div>
          <h2 className="boss-title">{won ? 'Breakout complete' : 'Recaptured — but not done'}</h2>
          <p className="boss-score">
            {correct} / {total} correct · needed {threshold}
          </p>
          {won ? (
            <div className="boss-ending">
              {getEndingLines().map((line, idx) => (
                <p key={idx} className="boss-ending-line">
                  <b>{line.name}:</b> {line.text}
                </p>
              ))}
            </div>
          ) : (
            <p className="boss-detail">
              You didn’t land enough clean hits. Regroup, recall what each block taught you, and take
              another run at the Warden.
            </p>
          )}
          <div className="boss-actions">
            {won ? (
              <button type="button" className="btn btn-primary" onClick={onWin}>
                Claim freedom →
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  Leave arena
                </button>
                <button type="button" className="btn btn-primary" onClick={retry}>
                  Face the Warden again
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!q) {
    return (
      <div className="boss-overlay">
        <div className="boss-card">
          <p className="boss-detail">No exam questions found.</p>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="boss-overlay">
      <div className="boss-card">
        <div className="boss-hud">
          <div className="boss-warden">
            <span className="boss-warden-name">The Warden</span>
            <div className="boss-hpbar">
              <span className="boss-hpfill" style={{ width: `${wardenPct * 100}%` }} />
            </div>
          </div>
          <div className="boss-hearts" aria-label={`${hearts} attempts left`}>
            {[0, 1, 2].map((h) => (
              <span key={h} className={`boss-heart${h < hearts ? '' : ' is-spent'}`}>
                ♥
              </span>
            ))}
          </div>
        </div>

        <div className="boss-qmeta">
          Cumulative test · {i + 1} / {total}
        </div>
        <h2 className="boss-prompt">{q.prompt}</h2>

        {q.visual && (
          <div className="boss-visual">
            <StepVisual visual={q.visual} />
          </div>
        )}

        <ChoiceStepView step={q} locked={locked} onResult={(ok) => handleResult(ok)} />

        {feedback && (
          <div className={`boss-feedback ${feedback.ok ? 'is-ok' : 'is-bad'}`}>
            <p>{feedback.text}</p>
            <button type="button" className="btn btn-primary" onClick={advance}>
              {i + 1 >= total ? 'Finish' : 'Next'} →
            </button>
          </div>
        )}

        <button type="button" className="boss-bail" onClick={onClose}>
          Retreat
        </button>
      </div>
    </div>
  )
}

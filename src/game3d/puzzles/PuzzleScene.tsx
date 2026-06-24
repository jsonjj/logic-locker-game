/**
 * [Agent 3] PUZZLE SCENE CONTROLLER — one focused DOM overlay per sector.
 *
 * Responsibilities:
 *   - Let the player choose a DIFFICULTY (fewer questions = harder questions;
 *     more questions = an easier-per-question but longer sweep).
 *   - Assemble that difficulty's quiz from the sector's real lesson content and
 *     run it node by node.
 *   - Track mistakes per question (for scoring AND the post-room review), surface
 *     hints, and never hard-fail.
 *   - Report the outcome via onComplete({ solved, mistakes, timeMs, route, review }).
 *
 * Rendered by the integrator on top of the R3F canvas. Self-contained: the only
 * 3D it uses is its own decorative mini-canvas (LockInset).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PuzzleReviewItem, PuzzleSceneProps } from '../contracts'
import { getSector } from '../../data/sectors'
import { buildQuiz, deviceKindForStep, deviceLabel, DIFFICULTIES, type Difficulty, type DifficultyDef } from './routes'
import type { InteractiveStep } from './types'
import DeviceRenderer from './DeviceRenderer'
import LockInset from './LockInset'
import { usePuzzleTimer } from './usePuzzleTimer'
import '../../styles/puzzles3d.css'

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000)
  const mm = Math.floor(total / 60)
  const ss = total % 60
  return `${mm}:${ss.toString().padStart(2, '0')}`
}

export default function PuzzleScene({ sectorId, lesson, onComplete, onMistake }: PuzzleSceneProps) {
  const elapsed = usePuzzleTimer()
  const mistakesRef = useRef(0)
  const stepMistakes = useRef(0)
  const reviewRef = useRef<PuzzleReviewItem[]>([])

  const [mistakes, setMistakes] = useState(0)
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [, forceTick] = useState(0)

  // The quiz is built once per chosen difficulty (randomized variant per node).
  const quiz = useMemo<InteractiveStep[]>(
    () => (difficulty ? buildQuiz(lesson, difficulty) : []),
    [lesson, difficulty],
  )

  // Tick once a second so the on-screen clock stays live.
  useEffect(() => {
    const id = window.setInterval(() => forceTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const sector = getSector(sectorId)
  const sectorName = sector?.name ?? lesson.title

  const registerMistake = () => {
    mistakesRef.current += 1
    stepMistakes.current += 1
    setMistakes(mistakesRef.current)
    onMistake?.()
  }

  const recordCurrent = () => {
    const step = quiz[stepIndex]
    if (!step) return
    reviewRef.current.push({
      prompt: step.prompt,
      correct: stepMistakes.current === 0,
      explanation: step.feedback?.secondWrong,
      takeaways: step.guidedReasoning,
    })
  }

  const handleSolved = () => {
    if (!difficulty) return
    recordCurrent()
    if (stepIndex + 1 < quiz.length) {
      setStepIndex((i) => i + 1)
      stepMistakes.current = 0
      setShowHint(false)
    } else {
      onComplete({
        solved: true,
        mistakes: mistakesRef.current,
        timeMs: elapsed(),
        route: difficulty,
        review: reviewRef.current,
      })
    }
  }

  const chooseDifficulty = (def: DifficultyDef) => {
    reviewRef.current = []
    stepMistakes.current = 0
    setDifficulty(def.id)
    setStepIndex(0)
    setShowHint(false)
  }

  const changeDifficulty = () => {
    reviewRef.current = []
    stepMistakes.current = 0
    setDifficulty(null)
    setStepIndex(0)
    setShowHint(false)
  }

  const abandon = () => {
    onComplete({
      solved: false,
      mistakes: mistakesRef.current,
      timeMs: elapsed(),
      route: difficulty ?? undefined,
      review: reviewRef.current,
    })
  }

  const sectorKicker = sector ? `Security Lock · ${sector.name.split('·').pop()?.trim() ?? sectorId}` : 'Security Lock'
  const progress = difficulty && quiz.length > 0 ? stepIndex / quiz.length : 0
  const currentStep = quiz[stepIndex]

  return (
    <div className="p3-overlay" role="dialog" aria-modal="true" aria-label={`Security lock — ${sectorName}`}>
      <div className="p3-frame">
        <header className="p3-header">
          <LockInset progress={progress} />
          <div className="p3-header-text">
            <span className="p3-kicker">{sectorKicker}</span>
            <h2 className="p3-title">{difficulty ? lesson.title : 'Choose your breach'}</h2>
            <p className="p3-subtitle">
              {difficulty ? `Node ${stepIndex + 1} of ${quiz.length}` : lesson.subtitle}
            </p>
          </div>
          <div className="p3-meta">
            <div className="p3-chip">
              <span className="p3-chip-num">{formatTime(elapsed())}</span>
              <span className="p3-chip-label">Time</span>
            </div>
            <div className={`p3-chip${mistakes > 0 ? ' is-alert' : ''}`}>
              <span className="p3-chip-num">{mistakes}</span>
              <span className="p3-chip-label">Alarm</span>
            </div>
          </div>
        </header>

        <div className="p3-body">
          {!difficulty && <DifficultySelect onPick={chooseDifficulty} onAbandon={abandon} />}

          {difficulty && currentStep && (
            <QuizRun
              step={currentStep}
              stepIndex={stepIndex}
              total={quiz.length}
              showHint={showHint}
              progress={progress}
              onSolved={handleSolved}
              onMistake={registerMistake}
            />
          )}

          {difficulty && quiz.length === 0 && (
            <div className="p3-device">
              <p className="p3-prompt">No reasoning node is wired to this lock.</p>
            </div>
          )}
        </div>

        {difficulty && (
          <footer className="p3-footer">
            {currentStep?.guidedReasoning?.length ? (
              <button type="button" className="p3-btn-hint" onClick={() => setShowHint((s) => !s)}>
                {showHint ? 'Hide reasoning' : 'Request hint'}
              </button>
            ) : (
              <span />
            )}
            <span className="spacer" />
            <button type="button" className="p3-btn ghost" onClick={changeDifficulty}>
              Change difficulty
            </button>
            <button type="button" className="p3-btn ghost" onClick={abandon}>
              Abandon breach
            </button>
          </footer>
        )}
      </div>
    </div>
  )
}

function DifficultySelect({
  onPick,
  onAbandon,
}: {
  onPick: (def: DifficultyDef) => void
  onAbandon: () => void
}) {
  return (
    <div>
      <p className="p3-routes-intro">
        Pick how hard you want it. Fewer nodes hit harder; more nodes ease up but run longer — every
        route opens the same lock.
      </p>
      <div className="p3-routes">
        {DIFFICULTIES.map((def) => (
          <button key={def.id} type="button" className="p3-route-card" onClick={() => onPick(def)}>
            <span className="p3-route-glyph">{def.count}</span>
            <span>
              <span className="p3-route-name">{def.label}</span>
              <span className="p3-route-blurb">{def.blurb}</span>
              <span className="p3-route-foot">
                {def.count} questions · {def.id === 'thorough' ? 'easier each, longer' : def.id === 'hard' ? 'hardest questions' : 'hard, balanced'}
              </span>
            </span>
            <span className={`p3-risk ${def.risk}`}>{def.count} Q</span>
          </button>
        ))}
      </div>
      <div style={{ marginTop: 14, textAlign: 'right' }}>
        <button type="button" className="p3-btn ghost" onClick={onAbandon}>
          Step back
        </button>
      </div>
    </div>
  )
}

function QuizRun({
  step,
  stepIndex,
  total,
  showHint,
  progress,
  onSolved,
  onMistake,
}: {
  step: InteractiveStep
  stepIndex: number
  total: number
  showHint: boolean
  progress: number
  onSolved: () => void
  onMistake: () => void
}) {
  const kind = deviceKindForStep(step)
  return (
    <div className="p3-device">
      <div className="p3-progress">
        <span>{deviceLabel(kind)}</span>
        <span className="p3-progress-track">
          <span className="p3-progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
        </span>
        <span>
          {stepIndex + 1}/{total}
        </span>
      </div>
      <DeviceRenderer key={`${stepIndex}:${step.id}`} step={step} onSolved={onSolved} onMistake={onMistake} />
      {showHint && step.guidedReasoning && step.guidedReasoning.length > 0 && (
        <div className="p3-feedback hint">
          Reasoning trace
          <ul className="p3-hint-list">
            {step.guidedReasoning.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

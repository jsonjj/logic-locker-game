import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getLesson } from '../data/lessons'
import StepRenderer from '../components/StepRenderer'
import StepVisual from '../components/StepVisual'
import InteractionHint from '../components/InteractionHint'
import RoomScene, { type SceneStation } from '../game/RoomScene'
import { isInteractiveStep } from '../logic/stepUtils'
import ProgressBar from '../components/ProgressBar'
import FeedbackPanel from '../components/FeedbackPanel'
import RoundFailedOverlay from '../components/RoundFailedOverlay'
import CompletionScreen from '../components/CompletionScreen'
import {
  startLesson,
  getLessonProgress,
  saveStepResult,
  completeLesson,
  awardBadge,
  setCurrentPosition,
  setVariantTrack,
  beginReplayRun,
  finishReplay,
} from '../firebase/progress'
import { resumeIndex, nextStepId, isLastStep, addCompletedStep } from '../logic/progressHelpers'
import { resolveStep, pickTrack } from '../logic/variants'
import {
  determineEarnedBadge,
  shouldTriggerRoundFailed,
  betterBadge,
  BADGE_META,
} from '../logic/badgeLogic'
import { computeUnlocks, getNextLessonId } from '../logic/lessonUnlocks'
import { computeStreak, todayString } from '../logic/streak'
import type { BadgeType, StepType, UserProfile } from '../types'

/** Maps a step type to a station glyph + short label for the room scene. */
function stationMeta(type: StepType): { glyph: string; label: string } {
  switch (type) {
    case 'dialogue':
      return { glyph: 'i', label: 'Akash' }
    case 'concept':
      return { glyph: 'i', label: 'Case Board' }
    case 'caseSummary':
      return { glyph: '★', label: 'Wrap-up' }
    case 'symbolTap':
      return { glyph: '✓', label: 'Mark' }
    case 'clueSort':
      return { glyph: '≡', label: 'Evidence' }
    case 'deductionGrid':
    case 'miniGrid':
      return { glyph: '#', label: 'Grid' }
    case 'singleCellGrid':
      return { glyph: '#', label: 'Cell' }
    case 'logicSwitches':
      return { glyph: '⏻', label: 'Switches' }
    case 'ordering':
      return { glyph: '↕', label: 'Sequence' }
    default:
      return { glyph: '?', label: 'Question' }
  }
}

interface Feedback {
  status: 'correct' | 'wrong'
  message: string
  /** Show the step-by-step reasoning (shown immediately on any wrong answer). */
  showReasoning: boolean
}

export default function LessonPage() {
  const { lessonId = '' } = useParams()
  const navigate = useNavigate()
  const { user, profile, setProfile } = useAuth()
  const lesson = getLesson(lessonId)

  const [ready, setReady] = useState(false)
  const [isReplay, setIsReplay] = useState(false)
  const [index, setIndex] = useState(0)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [failedRound, setFailedRound] = useState(false)
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([])
  const [showRoundFailed, setShowRoundFailed] = useState(false)
  const [completion, setCompletion] = useState<{ badge: BadgeType } | null>(null)
  const [priorBadge, setPriorBadge] = useState<BadgeType | null>(null)
  const [saveError, setSaveError] = useState(false)
  const [track, setTrack] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)

  const uid = user?.uid

  // Guard: unknown or locked lessons send the recruit back to the hallway.
  const unlocked = profile?.unlockedLessonIds.includes(lessonId) ?? false

  useEffect(() => {
    if (!lesson || !unlocked) {
      navigate('/hallway', { replace: true })
    }
  }, [lesson, unlocked, navigate])

  // Load (or create) progress and resume at the saved step.
  useEffect(() => {
    let active = true
    async function load() {
      if (!uid || !lesson) return
      try {
        const existing = await getLessonProgress(uid, lesson.id)
        const everCompleted = profile?.completedLessonIds.includes(lesson.id) ?? false
        setPriorBadge(existing?.earnedBadge ?? null)
        if (everCompleted) {
          // Fresh replay run: re-roll the case track and clear the previous
          // run's answers so the review only shows the most recent attempt.
          const nextTrack = pickTrack(lesson, existing?.variantTrack)
          await beginReplayRun(uid, lesson.id, nextTrack)
          if (!active) return
          setTrack(nextTrack)
          setMistakes(0)
          setFailedRound(false)
          setCompletedStepIds([])
          setIndex(0)
          setIsReplay(true)
        } else {
          const prog = existing ?? (await startLesson(uid, lesson.id))
          if (!active) return
          let runTrack = prog.variantTrack
          if (runTrack === undefined || runTrack === null) {
            runTrack = pickTrack(lesson)
            await setVariantTrack(uid, lesson.id, runTrack)
          }
          setTrack(runTrack)
          setMistakes(prog.mistakes)
          setFailedRound(prog.failedRoundTriggered)
          setCompletedStepIds(prog.completedStepIds)
          const resume = resumeIndex(lesson, prog.currentStepId)
          setIndex(resume)
          await setCurrentPosition(uid, lesson.id, lesson.steps[resume]?.id ?? '')
          setIsReplay(false)
        }
      } catch (err) {
        console.error('Failed to load progress', err)
      } finally {
        if (active) setReady(true)
      }
    }
    load()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, lesson])

  const baseStep = lesson?.steps[index]
  const currentStep = baseStep ? resolveStep(baseStep, track) : undefined

  // Non-interactive steps (dialogue / summary) are immediately continuable.
  useEffect(() => {
    const step = lesson?.steps[index]
    if (!step) return
    setWrongAttempts(0)
    setFeedback(null)
    setAnswered(!isInteractiveStep(step))
  }, [index, lesson])

  const totalSteps = lesson?.steps.length ?? 0
  const stepKey = useMemo(
    () => `${lessonId}-${currentStep?.id ?? ''}-${track}`,
    [lessonId, currentStep?.id, track],
  )

  if (!lesson || !currentStep) return null
  if (!ready) {
    return (
      <div className="screen-center">
        <div className="spinner" aria-label="Loading lesson" />
      </div>
    )
  }

  async function persist(data: Parameters<typeof saveStepResult>[3]) {
    if (!uid) return
    try {
      await saveStepResult(uid, lesson!.id, currentStep!.id, data)
      setSaveError(false)
    } catch (err) {
      console.error('Failed to save step', err)
      setSaveError(true)
    }
  }

  function handleResult(isCorrect: boolean, submittedValue: unknown) {
    if (isCorrect) {
      setAnswered(true)
      setFeedback({
        status: 'correct',
        message: currentStep!.feedback?.correct ?? 'Correct. Move on.',
        showReasoning: false,
      })
      const newCompleted = addCompletedStep(completedStepIds, currentStep!.id)
      setCompletedStepIds(newCompleted)
      void persist({
        attempts: wrongAttempts + 1,
        isCorrect: true,
        submittedValue,
        addMistakes: 0,
        failedRoundTriggered: failedRound,
        completedStepIds: newCompleted,
        mistakes,
        nextStepId: currentStep!.id,
      })
    } else {
      const newWrong = wrongAttempts + 1
      const newMistakes = mistakes + 1
      setWrongAttempts(newWrong)
      setMistakes(newMistakes)
      const fb = currentStep!.feedback
      // Show the explanation right away so a wrong answer becomes a teaching
      // moment instead of a dead end.
      setFeedback({
        status: 'wrong',
        message: fb?.secondWrong ?? fb?.firstWrong ?? '',
        showReasoning: true,
      })

      let nextFailed = failedRound
      if (shouldTriggerRoundFailed(newMistakes) && !failedRound) {
        nextFailed = true
        setFailedRound(true)
        setShowRoundFailed(true)
      }
      void persist({
        attempts: newWrong,
        isCorrect: false,
        submittedValue,
        addMistakes: 1,
        failedRoundTriggered: nextFailed,
        completedStepIds,
        mistakes: newMistakes,
        nextStepId: currentStep!.id,
      })
    }
  }

  async function finishLesson() {
    if (!profile) return
    const runBadge = determineEarnedBadge(mistakes, failedRound)

    // Replaying an already-completed room: keep this run's answers (for review),
    // restore completed status, and only upgrade the badge if this run was better.
    if (isReplay) {
      const best = betterBadge(priorBadge, runBadge)
      if (uid) {
        try {
          await finishReplay(uid, lesson!.id, best)
          if (best !== priorBadge) {
            await awardBadge(uid, {
              badgeId: lesson!.badgeId,
              lessonId: lesson!.id,
              badgeType: best,
              label: BADGE_META[best].label,
              earnedAt: null,
            })
          }
          setSaveError(false)
        } catch (err) {
          console.error('Failed to update badge', err)
          setSaveError(true)
        }
      }
      setPriorBadge(best)
      setCompletion({ badge: runBadge })
      return
    }

    const today = todayString()
    const unlockedLessonIds = computeUnlocks(profile.unlockedLessonIds, lesson!.id)
    const completedLessonIds = profile.completedLessonIds.includes(lesson!.id)
      ? profile.completedLessonIds
      : [...profile.completedLessonIds, lesson!.id]
    const alreadyToday = profile.lastLessonCompletedDate === today
    const streakCount = computeStreak(profile.streakCount, profile.lastLessonCompletedDate, today)
    const nextLessonId = getNextLessonId(lesson!.id) ?? lesson!.id

    if (uid) {
      try {
        await completeLesson(uid, lesson!.id, runBadge, {
          unlockedLessonIds,
          completedLessonIds,
          streakCount,
          lastLessonCompletedDate: today,
          nextLessonId,
        })
        await awardBadge(uid, {
          badgeId: lesson!.badgeId,
          lessonId: lesson!.id,
          badgeType: runBadge,
          label: BADGE_META[runBadge].label,
          earnedAt: null,
        })
        setSaveError(false)
      } catch (err) {
        console.error('Failed to complete lesson', err)
        setSaveError(true)
      }
    }

    const updatedProfile: UserProfile = {
      ...profile,
      unlockedLessonIds,
      completedLessonIds,
      streakCount: alreadyToday ? profile.streakCount : streakCount,
      lastLessonCompletedDate: today,
      currentLessonId: nextLessonId,
    }
    setProfile(updatedProfile)
    setPriorBadge(runBadge)
    setCompletion({ badge: runBadge })
  }

  function handleContinue() {
    setModalOpen(false)
    const completingStep = currentStep!
    const updatedCompleted = addCompletedStep(completedStepIds, completingStep.id)

    if (isLastStep(lesson!, completingStep.id)) {
      // Persist non-interactive final step completion before finishing.
      if (!isInteractiveStep(completingStep)) {
        void persist({
          attempts: 0,
          isCorrect: true,
          submittedValue: null,
          addMistakes: 0,
          failedRoundTriggered: failedRound,
          completedStepIds: updatedCompleted,
          mistakes,
          nextStepId: completingStep.id,
        })
      }
      void finishLesson()
      return
    }

    const next = nextStepId(lesson!, completingStep.id)
    setCompletedStepIds(updatedCompleted)
    if (next) {
      if (!isInteractiveStep(completingStep)) {
        void persist({
          attempts: 0,
          isCorrect: true,
          submittedValue: null,
          addMistakes: 0,
          failedRoundTriggered: failedRound,
          completedStepIds: updatedCompleted,
          mistakes,
          nextStepId: next,
        })
      } else if (uid && !isReplay) {
        void setCurrentPosition(uid, lesson!.id, next).catch(() => {})
      }
      setIndex((i) => i + 1)
    }
  }

  async function handleReplay() {
    if (uid && lesson) {
      const nextTrack = pickTrack(lesson, track)
      setTrack(nextTrack)
      try {
        await beginReplayRun(uid, lesson.id, nextTrack)
      } catch (err) {
        console.error('Failed to start replay', err)
      }
    }
    setCompletion(null)
    setIsReplay(true)
    setMistakes(0)
    setFailedRound(false)
    setCompletedStepIds([])
    setWrongAttempts(0)
    setFeedback(null)
    setIndex(0)
  }

  if (completion) {
    return (
      <div className="app-shell">
        <CompletionScreen
          lessonTitle={lesson.title}
          badge={completion.badge}
          mistakes={mistakes}
          isFinal={getNextLessonId(lesson.id) === null}
          nextLabel={getNextLessonId(lesson.id) ? 'Enter Next Room' : null}
          onNext={() => {
            const next = getNextLessonId(lesson.id)
            if (next) navigate(`/lesson/${next}`)
          }}
          onHallway={() => navigate('/hallway')}
          onReplay={handleReplay}
        />
      </div>
    )
  }

  const stations: SceneStation[] = lesson.steps.map((s) => {
    const meta = stationMeta(s.type)
    return { id: s.id, label: meta.label, glyph: meta.glyph }
  })
  const interactiveTotal = lesson.steps.filter(isInteractiveStep).length
  const interactiveDone = lesson.steps.slice(0, index).filter(isInteractiveStep).length

  return (
    <>
      {showRoundFailed && <RoundFailedOverlay onReview={() => setShowRoundFailed(false)} />}

      {saveError && (
        <div className="save-toast" role="status">
          <span>Couldn’t save your progress. Check your connection — your answers still work.</span>
          <button type="button" onClick={() => setSaveError(false)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      <RoomScene
        title={lesson.title}
        subtitle={lesson.doorLabel}
        stations={stations}
        activeIndex={index}
        frozen={modalOpen}
        onInteract={() => setModalOpen(true)}
        onExit={() => navigate('/hallway')}
        hudDone={interactiveDone}
        hudTotal={interactiveTotal}
      />

      {modalOpen && (
        <div className="game-modal" role="dialog" aria-modal="true" aria-label={lesson.title}>
          <div className="game-modal-card">
            <div className="game-modal-head">
              <span className="game-modal-kicker">
                {lesson.doorLabel} · Step {index + 1} of {totalSteps}
              </span>
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
            <ProgressBar current={index + 1} total={totalSteps} />

            <div key={stepKey} className="stack step-view">
              {currentStep.prompt && (
                <div className="card">
                  <p style={{ margin: 0, fontWeight: 600 }}>{currentStep.prompt}</p>
                  {currentStep.visual && (
                    <div style={{ marginTop: 14 }}>
                      <StepVisual visual={currentStep.visual} />
                    </div>
                  )}
                </div>
              )}

              {isInteractiveStep(currentStep) && !answered && (
                <InteractionHint key={currentStep.type} type={currentStep.type} />
              )}

              <div className="card">
                <StepRenderer
                  key={stepKey}
                  step={currentStep}
                  locked={answered}
                  onResult={handleResult}
                />
              </div>

              {feedback && (
                <FeedbackPanel
                  status={feedback.status}
                  message={feedback.message}
                  guidedReasoning={currentStep.guidedReasoning}
                  showReasoning={feedback.showReasoning}
                />
              )}

              {answered && (
                <button
                  type="button"
                  className="btn btn-success btn-block continue-btn"
                  onClick={handleContinue}
                >
                  {isLastStep(lesson, currentStep.id) ? 'Finish Room' : 'Continue'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

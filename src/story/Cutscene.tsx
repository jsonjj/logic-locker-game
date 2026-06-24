import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DialogueLine, SpeakerId } from '../game/lockdown/contracts'
import '../styles/cutscene.css'

/**
 * Cutscene — a full-screen, pure CSS/SVG stylized scene (Agent B).
 *
 * Plays a DialogueLine[] as a caption track while lightweight silhouettes act
 * out the story: the player and Akash walking in, the Warden's ambush, Akash
 * dragged through the gate, and the player's vow to fight inward. The "phase"
 * of the staged animation is derived from how far through the lines we are, so
 * the same component works for the intro or any future cutscene.
 *
 * Visuals are all CSS/SVG (no images, no canvas) to stay lightweight, and
 * everything respects prefers-reduced-motion.
 */
export interface CutsceneProps {
  lines: DialogueLine[]
  onComplete: () => void
}

const TYPE_SPEED_MS = 24

type Phase = 'approach' | 'ambush' | 'dragged' | 'resolve'

function phaseForProgress(progress: number): Phase {
  if (progress < 0.25) return 'approach'
  if (progress < 0.5) return 'ambush'
  if (progress < 0.78) return 'dragged'
  return 'resolve'
}

function speakerClass(speaker: SpeakerId): string {
  switch (speaker) {
    case 'self':
      return 'cap--self'
    case 'akash':
      return 'cap--akash'
    case 'warden':
      return 'cap--warden'
    case 'ally':
      return 'cap--ally'
    default:
      return 'cap--ally'
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export default function Cutscene({ lines, onComplete }: CutsceneProps) {
  const [index, setIndex] = useState(0)
  const [shown, setShown] = useState('')
  const reduceMotion = useMemo(prefersReducedMotion, [])
  const timerRef = useRef<number | null>(null)

  const current = lines[index]
  const isLast = index >= lines.length - 1
  const progress = lines.length > 1 ? index / (lines.length - 1) : 1
  const phase = phaseForProgress(progress)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!current) return
    clearTimer()
    if (reduceMotion) {
      setShown(current.text)
      return
    }
    setShown('')
    let i = 0
    const tick = () => {
      i += 1
      setShown(current.text.slice(0, i))
      if (i < current.text.length) {
        timerRef.current = window.setTimeout(tick, TYPE_SPEED_MS)
      }
    }
    timerRef.current = window.setTimeout(tick, TYPE_SPEED_MS)
    return clearTimer
  }, [current, reduceMotion, clearTimer])

  const advance = useCallback(() => {
    if (!current) return
    if (shown.length < current.text.length) {
      clearTimer()
      setShown(current.text)
      return
    }
    if (isLast) {
      onComplete()
    } else {
      setIndex((i) => i + 1)
    }
  }, [current, shown.length, isLast, clearTimer, onComplete])

  const skipAll = useCallback(() => {
    clearTimer()
    onComplete()
  }, [clearTimer, onComplete])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        advance()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        skipAll()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance, skipAll])

  if (!current) return null

  const isTyping = shown.length < current.text.length

  return (
    <div className="cutscene" role="dialog" aria-modal="true" aria-label="Story cutscene">
      <div className="cutscene-stage" data-phase={phase} aria-hidden="true">
        {/* alarm wash that intensifies as danger rises */}
        <div className="cs-alarm" />

        {/* fortress wall + barred gate */}
        <div className="cs-wall">
          <div className="cs-gate">
            <span className="cs-bar" />
            <span className="cs-bar" />
            <span className="cs-bar" />
            <span className="cs-bar" />
            <div className="cs-gate-door" />
          </div>
          <div className="cs-floor" />
        </div>

        {/* The Warden — tall, looming silhouette */}
        <Silhouette className="cs-fig cs-warden" hat="none" />

        {/* Akash — mentor with a fedora hint, gets dragged toward the gate */}
        <Silhouette className="cs-fig cs-akash" hat="fedora" />

        {/* The player — stands their ground, then resolves */}
        <Silhouette className="cs-fig cs-self" hat="none" />
      </div>

      <div className={`cutscene-caption ${speakerClass(current.speaker)}`}>
        <div className="cap-head">
          <span className="cap-name">{current.name}</span>
          {current.mood && current.mood !== 'neutral' && (
            <span className="cap-mood">{current.mood}</span>
          )}
          <span className="cap-count">
            {index + 1}/{lines.length}
          </span>
        </div>

        <button type="button" className="cap-body" onClick={advance} aria-label="Advance">
          <p className="cap-text">
            {shown}
            {isTyping && <span className="cap-caret" aria-hidden="true" />}
          </p>
        </button>

        <div className="cap-actions">
          <button type="button" className="cap-skip" onClick={skipAll}>
            Skip intro
          </button>
          <button type="button" className="cap-next" onClick={advance}>
            {isTyping ? 'Reveal' : isLast ? 'Enter the fortress' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** A minimal humanoid silhouette in SVG; `hat="fedora"` marks the mentor. */
function Silhouette({ className, hat }: { className?: string; hat: 'fedora' | 'none' }) {
  return (
    <svg className={className} viewBox="0 0 64 120" role="presentation" aria-hidden="true">
      {/* body */}
      <path
        className="sil-body"
        d="M32 40
           c10 0 16 8 16 20
           v44
           h-8 v-30 h-2 v30 h-12 v-30 h-2 v30 h-8
           v-44
           c0 -12 6 -20 16 -20 z"
      />
      {/* head */}
      <circle className="sil-head" cx="32" cy="22" r="13" />
      {/* optional fedora brim + crown */}
      {hat === 'fedora' && (
        <>
          <ellipse className="sil-hat" cx="32" cy="13" rx="20" ry="4.5" />
          <path className="sil-hat" d="M21 13 v-3 a11 8 0 0 1 22 0 v3 z" />
        </>
      )}
    </svg>
  )
}

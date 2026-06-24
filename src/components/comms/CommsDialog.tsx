import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DialogueLine, SpeakerId } from '../../game/lockdown/contracts'
import '../../styles/comms.css'

/**
 * CommsDialog — an in-world "comms terminal" overlay (Agent B).
 *
 * Plays a list of DialogueLines one at a time with a typewriter reveal so the
 * story feels like a radio/terminal exchange instead of a quiz popup. The
 * header is themed by speaker + mood. Enter / Space advance; a single click on
 * the line skips the typewriter; "Next" advances; "Skip" jumps to the end and
 * calls onDone.
 *
 * Respects prefers-reduced-motion: no typewriter, lines appear instantly.
 */
export interface CommsDialogProps {
  lines: DialogueLine[]
  onDone: () => void
  title?: string
}

const TYPE_SPEED_MS = 22

/** Map an abstract speaker id to a stable theme class. */
function speakerClass(speaker: SpeakerId): string {
  switch (speaker) {
    case 'self':
      return 'comms--self'
    case 'akash':
      return 'comms--akash'
    case 'warden':
      return 'comms--warden'
    case 'ally':
      return 'comms--ally'
    default:
      return 'comms--ally'
  }
}

/** Short tag shown in the header channel readout. */
function speakerTag(speaker: SpeakerId): string {
  switch (speaker) {
    case 'self':
      return 'OUTBOUND'
    case 'akash':
      return 'SECURE LINK'
    case 'warden':
      return 'INTRUSION'
    case 'ally':
      return 'INSIDE LINE'
    default:
      return 'CHANNEL'
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export default function CommsDialog({ lines, onDone, title = 'COMMS' }: CommsDialogProps) {
  const [index, setIndex] = useState(0)
  const [shown, setShown] = useState('')
  const reduceMotion = useMemo(prefersReducedMotion, [])
  const timerRef = useRef<number | null>(null)

  const current = lines[index]
  const isLast = index >= lines.length - 1
  const isTyping = !!current && shown.length < current.text.length

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Drive the typewriter for the current line.
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

  const finishTyping = useCallback(() => {
    if (current) {
      clearTimer()
      setShown(current.text)
    }
  }, [current, clearTimer])

  const advance = useCallback(() => {
    if (!current) return
    // First, complete the typewriter if it's still running.
    if (shown.length < current.text.length) {
      finishTyping()
      return
    }
    if (isLast) {
      onDone()
    } else {
      setIndex((i) => i + 1)
    }
  }, [current, shown.length, isLast, finishTyping, onDone])

  const skipAll = useCallback(() => {
    clearTimer()
    onDone()
  }, [clearTimer, onDone])

  // Keyboard: Enter / Space advance, Escape skips.
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

  return (
    <div className="comms-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`comms-panel ${speakerClass(current.speaker)}`}>
        <header className="comms-topbar">
          <span className="comms-title">{title}</span>
          <span className="comms-channel">
            <span className="comms-dot" aria-hidden="true" />
            {speakerTag(current.speaker)}
          </span>
          <span className="comms-count">
            {index + 1}/{lines.length}
          </span>
        </header>

        <div className="comms-speaker">
          <span className="comms-name">{current.name}</span>
          {current.mood && current.mood !== 'neutral' && (
            <span className="comms-mood">{current.mood}</span>
          )}
        </div>

        <button
          type="button"
          className="comms-body"
          onClick={advance}
          aria-label="Advance dialogue"
        >
          <p className="comms-text">
            {shown}
            {isTyping && <span className="comms-caret" aria-hidden="true" />}
          </p>
        </button>

        <footer className="comms-actions">
          <button type="button" className="comms-skip" onClick={skipAll}>
            Skip
          </button>
          <button type="button" className="comms-next" onClick={advance}>
            {isTyping ? 'Reveal' : isLast ? 'Close' : 'Next'}
          </button>
        </footer>
      </div>
    </div>
  )
}

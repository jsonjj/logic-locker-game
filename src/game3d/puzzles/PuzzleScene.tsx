/**
 * [Agent 3] PUZZLE SCENE CONTROLLER — one focused DOM overlay per sector.
 *
 * Responsibilities:
 *   - Derive 2-3 branching breach ROUTES from the sector's lesson content.
 *   - Let the player pick a route, then clear that route's device(s) in order.
 *   - Track mistakes + elapsed time, surface hints, and never hard-fail.
 *   - Report the outcome via onComplete({ solved, mistakes, timeMs, route }).
 *
 * Rendered by the integrator on top of the R3F canvas. Self-contained: the only
 * 3D it uses is its own decorative mini-canvas (LockInset).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PuzzleSceneProps } from '../contracts'
import { getSector } from '../../data/sectors'
import { buildRoutes, deviceKindForStep, deviceLabel } from './routes'
import type { RouteDef } from './types'
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
  const routes = useMemo(() => buildRoutes(lesson), [lesson])
  const elapsed = usePuzzleTimer()
  const mistakesRef = useRef(0)
  const [mistakes, setMistakes] = useState(0)
  const [route, setRoute] = useState<RouteDef | null>(routes.length === 1 ? routes[0] : null)
  const [stepIndex, setStepIndex] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [, forceTick] = useState(0)

  // Tick once a second so the on-screen clock stays live.
  useEffect(() => {
    const id = window.setInterval(() => forceTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const sector = getSector(sectorId)
  const sectorName = sector?.name ?? lesson.title

  const registerMistake = () => {
    mistakesRef.current += 1
    setMistakes(mistakesRef.current)
    onMistake?.()
  }

  const handleSolved = () => {
    if (!route) return
    if (stepIndex + 1 < route.steps.length) {
      setStepIndex((i) => i + 1)
      setShowHint(false)
    } else {
      onComplete({ solved: true, mistakes: mistakesRef.current, timeMs: elapsed(), route: route.id })
    }
  }

  const chooseRoute = (next: RouteDef) => {
    setRoute(next)
    setStepIndex(0)
    setShowHint(false)
  }

  const switchRoute = () => {
    setRoute(null)
    setStepIndex(0)
    setShowHint(false)
  }

  const abandon = () => {
    onComplete({ solved: false, mistakes: mistakesRef.current, timeMs: elapsed(), route: route?.id })
  }

  const sectorKicker = sector ? `Security Lock · ${sector.name.split('·').pop()?.trim() ?? sectorId}` : 'Security Lock'

  const progress = route && route.steps.length > 0 ? stepIndex / route.steps.length : 0

  return (
    <div className="p3-overlay" role="dialog" aria-modal="true" aria-label={`Security lock — ${sectorName}`}>
      <div className="p3-frame">
        <header className="p3-header">
          <LockInset progress={progress} />
          <div className="p3-header-text">
            <span className="p3-kicker">{sectorKicker}</span>
            <h2 className="p3-title">{route ? route.label : lesson.title}</h2>
            <p className="p3-subtitle">
              {route ? `Breach node ${stepIndex + 1} of ${route.steps.length}` : lesson.subtitle}
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
          {!route && <RouteSelect routes={routes} onPick={chooseRoute} onAbandon={abandon} />}

          {route && route.steps.length > 0 && (
            <RouteRun
              route={route}
              stepIndex={stepIndex}
              showHint={showHint}
              progress={progress}
              onSolved={handleSolved}
              onMistake={registerMistake}
            />
          )}

          {route && route.steps.length === 0 && (
            <div className="p3-device">
              <p className="p3-prompt">No reasoning node is wired to this lock. Force it open?</p>
            </div>
          )}
        </div>

        {route && (
          <footer className="p3-footer">
            {route.steps[stepIndex]?.guidedReasoning?.length ? (
              <button type="button" className="p3-btn-hint" onClick={() => setShowHint((s) => !s)}>
                {showHint ? 'Hide reasoning' : 'Request hint'}
              </button>
            ) : (
              <span />
            )}
            <span className="spacer" />
            {routes.length > 1 && (
              <button type="button" className="p3-btn ghost" onClick={switchRoute}>
                Switch route
              </button>
            )}
            <button type="button" className="p3-btn ghost" onClick={abandon}>
              Abandon breach
            </button>
          </footer>
        )}
      </div>
    </div>
  )
}

function RouteSelect({
  routes,
  onPick,
  onAbandon,
}: {
  routes: RouteDef[]
  onPick: (route: RouteDef) => void
  onAbandon: () => void
}) {
  if (routes.length === 0) {
    return (
      <div className="p3-device">
        <p className="p3-prompt">This lock has no active reasoning nodes.</p>
        <button type="button" className="p3-btn primary" onClick={onAbandon}>
          Step back
        </button>
      </div>
    )
  }
  return (
    <div>
      <p className="p3-routes-intro">
        Pick a breach vector. Every route opens the same door — trade speed against safety.
      </p>
      <div className="p3-routes">
        {routes.map((route) => {
          const devices = [...new Set(route.steps.map((s) => deviceLabel(deviceKindForStep(s))))]
          return (
            <button key={route.id} type="button" className="p3-route-card" onClick={() => onPick(route)}>
              <span className="p3-route-glyph">{route.risk.charAt(0).toUpperCase()}</span>
              <span>
                <span className="p3-route-name">{route.label}</span>
                <span className="p3-route-blurb">{route.blurb}</span>
                <span className="p3-route-foot">
                  {route.steps.length} node{route.steps.length === 1 ? '' : 's'} · {devices.join(' + ')}
                </span>
              </span>
              <span className={`p3-risk ${route.risk}`}>{route.risk}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function RouteRun({
  route,
  stepIndex,
  showHint,
  progress,
  onSolved,
  onMistake,
}: {
  route: RouteDef
  stepIndex: number
  showHint: boolean
  progress: number
  onSolved: () => void
  onMistake: () => void
}) {
  const step = route.steps[stepIndex]
  const kind = deviceKindForStep(step)
  return (
    <div className="p3-device">
      <div className="p3-progress">
        <span>{deviceLabel(kind)}</span>
        <span className="p3-progress-track">
          <span className="p3-progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
        </span>
        <span>
          {stepIndex + 1}/{route.steps.length}
        </span>
      </div>
      <DeviceRenderer key={`${route.id}:${step.id}`} step={step} onSolved={onSolved} onMistake={onMistake} />
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

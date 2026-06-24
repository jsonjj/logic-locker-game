export interface AlarmMeterProps {
  /** Alarm level in [0, 1]; clamped internally. */
  danger: number
  /** Threshold above which the meter goes "critical" (blink/throb). */
  criticalAt?: number
}

/** Green -> amber -> red ramp as the alarm climbs. */
function rampColor(level: number): string {
  // Hue sweeps 140 (green) down to 0 (red); saturation/lightness tuned for HUD.
  const hue = Math.round(140 - 140 * level)
  return `hsl(${hue}, 85%, 52%)`
}

/**
 * The escape-thriller alarm meter. Fills with `danger`, ramps to red, and goes
 * critical (pulsing siren dot + throbbing bar) near the top. Reduced-motion is
 * handled in CSS. Purely presentational — the Hud owns the value source.
 */
export default function AlarmMeter({ danger, criticalAt = 0.66 }: AlarmMeterProps) {
  const level = Math.min(1, Math.max(0, danger))
  const critical = level >= criticalAt
  const color = rampColor(level)

  return (
    <div
      className={`hud-alarm${critical ? ' is-critical' : ''}`}
      style={
        {
          '--hud-meter-fill': `${Math.round(level * 100)}%`,
          '--hud-meter-color': color,
        } as React.CSSProperties
      }
      role="meter"
      aria-label="Alarm level"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(level * 100)}
    >
      <span className="hud-alarm-label">
        <span className="hud-alarm-siren" />
        Alarm
      </span>
      <span className="hud-alarm-track">
        <span className="hud-alarm-fill" />
      </span>
    </div>
  )
}

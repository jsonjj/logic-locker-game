/**
 * Tiny procedural sound engine (Web Audio API — no asset files).
 *
 * - A low, tense "prison-block" ambient bed: a detuned drone with a slow filter
 *   sweep plus a sparse minor arpeggio.
 * - Punchy weapon blasts synthesized on demand (a tone sweep + a noise burst).
 *
 * Everything is gated behind a user gesture (browser autoplay policy) via
 * `unlockAudio()`, and a persisted on/off flag.
 */

const KEY = 'll-sound-enabled'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noiseBuf: AudioBuffer | null = null
let enabled = true

interface MusicHandle {
  bus: GainNode
  sources: AudioScheduledSourceNode[]
  interval: ReturnType<typeof setInterval>
}
let music: MusicHandle | null = null

try {
  const v = localStorage.getItem(KEY)
  if (v !== null) enabled = v === '1'
} catch {
  /* ignore */
}

export function isSoundEnabled(): boolean {
  return enabled
}

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = 0.5
      master.connect(ctx.destination)
    } catch {
      ctx = null
    }
  }
  return ctx
}

function noise(c: AudioContext): AudioBuffer {
  if (!noiseBuf) {
    const len = Math.floor(c.sampleRate * 0.5)
    noiseBuf = c.createBuffer(1, len, c.sampleRate)
    const data = noiseBuf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  }
  return noiseBuf
}

/** Resume the context inside a user gesture, and start music if enabled. */
export function unlockAudio(): void {
  const c = ensure()
  if (!c) return
  if (c.state === 'suspended') void c.resume().catch(() => {})
  if (enabled) startMusic()
}

export function setSoundEnabled(on: boolean): void {
  enabled = on
  try {
    localStorage.setItem(KEY, on ? '1' : '0')
  } catch {
    /* ignore */
  }
  if (on) unlockAudio()
  else stopMusic()
}

/** A weapon blast: 'laser' for hitscan guns, 'boom' for AoE. */
export function playBlast(kind: 'laser' | 'boom' = 'laser'): void {
  if (!enabled) return
  const c = ensure()
  if (!c || !master) return
  if (c.state === 'suspended') void c.resume().catch(() => {})
  const t = c.currentTime
  const boom = kind === 'boom'

  const osc = c.createOscillator()
  osc.type = boom ? 'sawtooth' : 'square'
  osc.frequency.setValueAtTime(boom ? 320 : 760, t)
  osc.frequency.exponentialRampToValueAtTime(boom ? 70 : 130, t + (boom ? 0.32 : 0.16))
  const og = c.createGain()
  og.gain.setValueAtTime(0.0001, t)
  og.gain.exponentialRampToValueAtTime(boom ? 0.3 : 0.2, t + 0.006)
  og.gain.exponentialRampToValueAtTime(0.0001, t + (boom ? 0.4 : 0.2))
  osc.connect(og).connect(master)
  osc.start(t)
  osc.stop(t + (boom ? 0.42 : 0.22))

  const src = c.createBufferSource()
  src.buffer = noise(c)
  const ng = c.createGain()
  ng.gain.setValueAtTime(boom ? 0.28 : 0.15, t)
  ng.gain.exponentialRampToValueAtTime(0.0001, t + (boom ? 0.25 : 0.12))
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = boom ? 1200 : 2200
  src.connect(lp).connect(ng).connect(master)
  src.start(t)
  src.stop(t + 0.3)
}

// A-minor-ish pentatonic for a tense, modal feel.
const ARP = [220, 261.63, 293.66, 329.63, 392, 329.63, 293.66, 261.63]

export function startMusic(): void {
  const c = ensure()
  if (!c || !master || music) return

  const bus = c.createGain()
  bus.gain.value = 0
  bus.connect(master)
  bus.gain.linearRampToValueAtTime(0.6, c.currentTime + 2.5)

  // Drone: two detuned saws through a slowly-sweeping lowpass.
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 280
  lp.connect(bus)
  const dg = c.createGain()
  dg.gain.value = 0.16
  dg.connect(lp)
  const o1 = c.createOscillator()
  o1.type = 'sawtooth'
  o1.frequency.value = 55
  const o2 = c.createOscillator()
  o2.type = 'sawtooth'
  o2.frequency.value = 55 * 1.008
  o1.connect(dg)
  o2.connect(dg)
  o1.start()
  o2.start()

  const lfo = c.createOscillator()
  lfo.frequency.value = 0.05
  const lfoGain = c.createGain()
  lfoGain.gain.value = 130
  lfo.connect(lfoGain)
  lfoGain.connect(lp.frequency)
  lfo.start()

  // Sparse arpeggio.
  let i = 0
  const interval = setInterval(() => {
    if (!enabled || !ctx || !music) return
    const tt = ctx.currentTime
    const f = ARP[i % ARP.length] * (i % 16 < 8 ? 1 : 0.5)
    i++
    const o = ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = f
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, tt)
    g.gain.exponentialRampToValueAtTime(0.05, tt + 0.05)
    g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.7)
    o.connect(g).connect(music.bus)
    o.start(tt)
    o.stop(tt + 0.75)
  }, 540)

  music = { bus, sources: [o1, o2, lfo], interval }
}

export function stopMusic(): void {
  if (!music || !ctx) return
  clearInterval(music.interval)
  const now = ctx.currentTime
  try {
    music.bus.gain.cancelScheduledValues(now)
    music.bus.gain.setValueAtTime(music.bus.gain.value, now)
    music.bus.gain.linearRampToValueAtTime(0, now + 0.6)
  } catch {
    /* ignore */
  }
  const sources = music.sources
  setTimeout(() => {
    for (const s of sources) {
      try {
        s.stop()
      } catch {
        /* already stopped */
      }
    }
  }, 700)
  music = null
}

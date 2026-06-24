import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { isSoundEnabled, setSoundEnabled, unlockAudio } from '../audio/sound'
import '../styles/sound-control.css'

/**
 * Always-on mute toggle (top-right cluster). Also arms the one-time gesture that
 * "unlocks" Web Audio so the themed background music can start (browsers block
 * autoplay until the user interacts).
 */
export default function SoundControl() {
  const { user } = useAuth()
  const [on, setOn] = useState(isSoundEnabled())

  useEffect(() => {
    const unlock = () => {
      unlockAudio()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  if (!user) return null

  function toggle() {
    const next = !on
    setOn(next)
    setSoundEnabled(next)
  }

  return (
    <button
      type="button"
      className="global-sound"
      onClick={toggle}
      aria-label={on ? 'Mute sound' : 'Unmute sound'}
      title={on ? 'Sound on' : 'Sound off'}
    >
      <span aria-hidden>{on ? '🔊' : '🔇'}</span>
    </button>
  )
}

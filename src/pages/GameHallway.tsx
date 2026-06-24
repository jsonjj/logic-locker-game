import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { lessons } from '../data/lessons'
import { getAllProgress } from '../firebase/progress'
import { logOut } from '../firebase/auth'
import { getAvatar } from '../data/avatars'
import AvatarIcon from '../components/AvatarIcon'
import BadgeMedal from '../components/BadgeMedal'
import { useTopDownPlayer } from '../game/useTopDownPlayer'
import DetectiveSprite from '../game/DetectiveSprite'
import Joystick from '../game/Joystick'
import type { BadgeType, LessonProgress } from '../types'

// Doors arranged along a corridor: left wall, right wall, and one at the far end.
const DOOR_SLOTS = [
  { x: 22, y: 30 },
  { x: 78, y: 30 },
  { x: 22, y: 50 },
  { x: 78, y: 50 },
  { x: 22, y: 70 },
  { x: 78, y: 70 },
  { x: 50, y: 22 },
]

const DOOR_COLORS = [
  '#4f46e5',
  '#0f9d58',
  '#7c3aed',
  '#d2540c',
  '#0c8aa6',
  '#c81e63',
  '#334155',
]

const INTERACT_RANGE = 12

export default function GameHallway() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [progressMap, setProgressMap] = useState<Record<string, LessonProgress>>({})
  const [lockedMsg, setLockedMsg] = useState('')
  const lockedTimer = useRef<number | undefined>(undefined)

  const { pos, facing, moving, setJoy } = useTopDownPlayer({
    start: { x: 50, y: 84 },
    speed: 30,
    bounds: { minX: 10, maxX: 90, minY: 16, maxY: 90 },
  })

  useEffect(() => {
    let active = true
    async function load() {
      if (!user) return
      try {
        const all = await getAllProgress(user.uid)
        if (!active) return
        const map: Record<string, LessonProgress> = {}
        for (const p of all) map[p.lessonId] = p
        setProgressMap(map)
      } catch (err) {
        console.error('Failed to load progress', err)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [user])

  const doors = useMemo(() => {
    const completed = profile?.completedLessonIds ?? []
    const unlocked = profile?.unlockedLessonIds ?? []
    return lessons.map((lesson, i) => {
      const slot = DOOR_SLOTS[i] ?? { x: 50, y: 50 }
      const state: 'completed' | 'unlocked' | 'locked' = completed.includes(lesson.id)
        ? 'completed'
        : unlocked.includes(lesson.id)
          ? 'unlocked'
          : 'locked'
      return {
        lesson,
        index: i,
        ...slot,
        state,
        badge: progressMap[lesson.id]?.earnedBadge ?? null,
        color: DOOR_COLORS[i % DOOR_COLORS.length],
      }
    })
  }, [profile, progressMap])

  // Which door is the player standing next to?
  const nearDoor = useMemo(() => {
    let best: (typeof doors)[number] | null = null
    let bestDist = INTERACT_RANGE
    for (const d of doors) {
      const dist = Math.hypot(d.x - pos.x, d.y - pos.y)
      if (dist < bestDist) {
        bestDist = dist
        best = d
      }
    }
    return best
  }, [doors, pos.x, pos.y])

  function enter(door: (typeof doors)[number]) {
    if (door.state === 'locked') {
      setLockedMsg(`Room ${door.index + 1} is locked — clear the case before it to open it.`)
      window.clearTimeout(lockedTimer.current)
      lockedTimer.current = window.setTimeout(() => setLockedMsg(''), 2200)
      return
    }
    navigate(door.state === 'completed' ? `/review/${door.lesson.id}` : `/lesson/${door.lesson.id}`)
  }

  // Keyboard interact (Space / Enter / E).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase()
      if ((k === ' ' || k === 'enter' || k === 'e') && nearDoor) {
        e.preventDefault()
        enter(nearDoor)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearDoor])

  if (!profile) return null
  const avatar = getAvatar(profile.avatarId)
  const cleared = profile.completedLessonIds.length

  async function handleLogout() {
    try {
      await logOut()
    } catch {
      /* ignore */
    }
    navigate('/auth', { replace: true })
  }

  return (
    <div className="game-page">
      <div className="game-hud">
        <div className="hud-left">
          <div className="brand">
            <span className="brand-mark">LL</span>
            <span>LOGIC LOCKER</span>
          </div>
        </div>
        <div className="hud-right">
          <span className="hud-chip">
            <span className="hud-chip-num">{cleared}</span>/{lessons.length} rooms
          </span>
          <span className="hud-chip">
            <span className="hud-chip-num">{profile.streakCount}</span> streak
          </span>
          <Link to="/profile" className="avatar-pill" title="Profile" aria-label="Profile">
            <AvatarIcon id={avatar.id} size={40} />
          </Link>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>

      <div className="game-stage floor-hall">
        <div className="game-wall" />
        <div className="stage-title">
          The Academy Hallway
          <small>Walk up to a door and press the button (or Space) to enter</small>
        </div>

        {doors.map((d) => {
          const isNear = nearDoor?.lesson.id === d.lesson.id
          return (
            <button
              key={d.lesson.id}
              type="button"
              className={`game-door ${d.state} ${isNear ? 'near' : ''}`}
              style={{ left: `${d.x}%`, top: `${d.y}%` }}
              onClick={() => enter(d)}
              aria-label={`Room ${d.index + 1}: ${d.lesson.title} (${d.state})`}
            >
              <div
                className="door-3d"
                style={{ background: d.color }}
              >
                <span className="door-vents" />
                <span className="door-num">{d.index + 1}</span>
                {d.state === 'completed' && d.badge && (
                  <span className="door-emblem">
                    <BadgeMedal type={d.badge as BadgeType} size={26} />
                  </span>
                )}
                {d.state === 'locked' && (
                  <span className="door-emblem" aria-hidden>
                    🔒
                  </span>
                )}
              </div>
              <span className="door-nameplate">{d.lesson.title}</span>
            </button>
          )
        })}

        <div
          className="player"
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        >
          <DetectiveSprite facing={facing} moving={moving} />
        </div>

        {nearDoor && (
          <div
            className="interact-prompt"
            style={{ left: `${nearDoor.x}%`, top: `${nearDoor.y - 9}%` }}
          >
            {nearDoor.state === 'locked' ? (
              <>🔒 Locked</>
            ) : (
              <>
                <b>Enter</b> {nearDoor.state === 'completed' ? '· Review' : ''}
              </>
            )}
          </div>
        )}

        {lockedMsg && <div className="game-hint-bar">{lockedMsg}</div>}

        <Joystick onChange={setJoy} />
        <button
          type="button"
          className="game-action-btn"
          disabled={!nearDoor}
          onClick={() => nearDoor && enter(nearDoor)}
        >
          {nearDoor?.state === 'completed' ? 'Review' : 'Enter'}
        </button>
      </div>
    </div>
  )
}

import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import GlobalLogout from './components/GlobalLogout'
import GlobalHome from './components/GlobalHome'
import SoundControl from './components/SoundControl'
import { RunProvider } from './game3d/state/RunContext'
import { InventoryProvider } from './game3d/state/InventoryContext'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import ProfileSetupPage from './pages/ProfileSetupPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ModeSelectPage from './pages/ModeSelectPage'
import MultiplayerLobbyPage from './pages/MultiplayerLobbyPage'
import { ROOM_ROUTE_PATTERN } from './game3d/contracts'

// The 3D pages pull in three.js + Rapier (a large bundle), so they are
// code-split and only loaded when the player actually enters the 3D world.
const WorldPage = lazy(() => import('./pages/WorldPage'))
const SectorRoomPage = lazy(() => import('./pages/SectorRoomPage'))
const BossRoomPage = lazy(() => import('./pages/BossRoomPage'))
const FinalePage = lazy(() => import('./pages/FinalePage'))
const MultiplayerArenaPage = lazy(() => import('./pages/MultiplayerArenaPage'))

function World3DFallback() {
  return <div className="world-loading">Entering the compound…</div>
}

export default function App() {
  return (
    <RunProvider>
      <InventoryProvider>
        <GlobalLogout />
        <GlobalHome />
        <SoundControl />
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/profile-setup"
          element={
            <ProtectedRoute requireProfile={false}>
              <ProfileSetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/play"
          element={
            <ProtectedRoute>
              <ModeSelectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mp"
          element={
            <ProtectedRoute>
              <MultiplayerLobbyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mp/:code"
          element={
            <ProtectedRoute>
              <MultiplayerLobbyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mp/:code/play"
          element={
            <ProtectedRoute>
              <Suspense fallback={<World3DFallback />}>
                <MultiplayerArenaPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/world"
          element={
            <ProtectedRoute>
              <Suspense fallback={<World3DFallback />}>
                <WorldPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROOM_ROUTE_PATTERN}
          element={
            <ProtectedRoute>
              <Suspense fallback={<World3DFallback />}>
                <SectorRoomPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/boss"
          element={
            <ProtectedRoute>
              <Suspense fallback={<World3DFallback />}>
                <BossRoomPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finale"
          element={
            <ProtectedRoute>
              <Suspense fallback={<World3DFallback />}>
                <FinalePage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </InventoryProvider>
    </RunProvider>
  )
}

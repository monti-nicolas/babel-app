import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import RegisterBook from './pages/RegisterBook'
import ReadingHistory from './pages/ReadingHistory'
import BadgeJourney from './pages/BadgeJourney'
import Reviews from './pages/Reviews'
import Account from './pages/Account'
import VerifyEmail from './pages/VerifyEmail'
import ResetPassword from './pages/ResetPassword'

// ─── Background theme map ────────────────────────────────────────────────────
// Must stay in sync with BackgroundPicker options
const BG_STYLES: Record<string, React.CSSProperties> = {
  default:    { background: 'rgba(13, 15, 20, 0.82)' },
  bg_library: { background: 'rgba(0, 0, 0, 0.15)' },
  bg_dark:    { background: 'rgba(13, 15, 20, 0.5)' },
  bg_ocean:   { background: 'rgba(9, 20, 32, 0.5)' },
  bg_forest:  { background: 'rgba(10, 20, 16, 0.5)' },
  bg_sunset:  { background: 'rgba(26, 15, 10, 0.5)' },
  bg_space:   { background: 'rgba(8, 8, 15, 0.5)' },
  bg_wine:    { background: 'rgba(20, 8, 15, 0.5)' },
}

function getBackgroundStyle(backgroundId?: string): React.CSSProperties {
  if (!backgroundId) return BG_STYLES.default
  return BG_STYLES[backgroundId] ?? BG_STYLES.bg_library
}

// ─── Route guards ────────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />
}

// ─── Themed wrapper for all authenticated pages ───────────────────────────────
// Reads the current user's backgroundId and applies the matching style
// to a full-viewport wrapper so every page shares the theme.
function ThemedLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const bgStyle = getBackgroundStyle(user?.backgroundId)

  return (
    <div
      style={{
        minHeight: '100vh',
        ...bgStyle,
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  )
}

// ─── App routes ──────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public — no theme wrapper needed */}
      <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected — all wrapped in ThemedLayout */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <ThemedLayout><Dashboard /></ThemedLayout>
        </ProtectedRoute>
      } />
      <Route path="/register-book" element={
        <ProtectedRoute>
          <ThemedLayout><RegisterBook /></ThemedLayout>
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute>
          <ThemedLayout><ReadingHistory /></ThemedLayout>
        </ProtectedRoute>
      } />
      <Route path="/badges" element={
        <ProtectedRoute>
          <ThemedLayout><BadgeJourney /></ThemedLayout>
        </ProtectedRoute>
      } />
      <Route path="/reviews" element={
        <ProtectedRoute>
          <ThemedLayout><Reviews /></ThemedLayout>
        </ProtectedRoute>
      } />
      <Route path="/account" element={
        <ProtectedRoute>
          <ThemedLayout><Account /></ThemedLayout>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// ─── Root ────────────────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App

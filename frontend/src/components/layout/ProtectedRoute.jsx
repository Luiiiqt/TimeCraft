import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * Wraps a route so only authenticated users with the correct role can access it.
 *
 * Usage:
 *   <ProtectedRoute roles={['ADMIN']}>
 *     <AdminDashboard />
 *   </ProtectedRoute>
 *
 * If no roles prop is given, any authenticated user is allowed.
 */
export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Still loading auth state — show a minimal spinner
  if (loading) {
    return (
      <div style={styles.center}>
        <span style={styles.spinner} />
      </div>
    )
  }

  // Not logged in — redirect to login, preserve intended destination
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Logged in but wrong role
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

const styles = {
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#0f172a',
  },
  spinner: {
    display: 'block',
    width: '36px',
    height: '36px',
    border: '3px solid rgba(245,158,11,0.2)',
    borderTopColor: '#f59e0b',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
}
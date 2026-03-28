import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleLabel = {
    ADMIN: 'Registrar',
    TEACHER: 'Faculty',
    STUDENT: 'Student',
  }[user?.role] ?? user?.role

  const roleColor = {
    ADMIN: '#f59e0b',
    TEACHER: '#6366f1',
    STUDENT: '#10b981',
  }[user?.role] ?? '#94a3b8'

  return (
    <nav style={styles.nav}>
      {/* Brand */}
      <Link to="/" style={styles.brand}>
        <span style={styles.brandIcon}>◈</span>
        <span style={styles.brandText}>Time<em>Craft</em></span>
      </Link>

      {/* Desktop right section */}
      <div style={styles.right}>
        {user && (
          <>
            <div style={styles.userChip}>
              <span style={{ ...styles.roleDot, background: roleColor }} />
              <span style={styles.userName}>{user.fullName}</span>
              <span style={{ ...styles.roleTag, color: roleColor }}>
                {roleLabel}
              </span>
            </div>

            <button style={styles.logoutBtn} onClick={handleLogout}>
              Sign out
            </button>
          </>
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        style={styles.hamburger}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span style={styles.bar} />
        <span style={styles.bar} />
        <span style={styles.bar} />
      </button>

      {/* Mobile dropdown */}
      {menuOpen && user && (
        <div style={styles.mobileMenu}>
          <p style={styles.mobileUser}>{user.fullName}</p>
          <p style={{ ...styles.mobileRole, color: roleColor }}>{roleLabel}</p>
          <button style={styles.mobileLogout} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      )}
    </nav>
  )
}

const styles = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '64px',
    background: '#0f172a',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    zIndex: 1000,
    gap: '16px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    flexShrink: 0,
  },
  brandIcon: {
    fontSize: '22px',
    color: '#f59e0b',
    lineHeight: 1,
  },
  brandText: {
    fontFamily: '"Playfair Display", Georgia, serif',
    fontSize: '20px',
    fontWeight: 700,
    color: '#f8fafc',
    letterSpacing: '-0.3px',
  },
  right: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '999px',
    padding: '6px 14px',
  },
  roleDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  userName: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '13px',
    color: '#e2e8f0',
    fontWeight: 500,
  },
  roleTag: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  logoutBtn: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '13px',
    fontWeight: 500,
    color: '#94a3b8',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    padding: '6px 14px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  hamburger: {
    display: 'none',
    flexDirection: 'column',
    gap: '5px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    marginLeft: 'auto',
    padding: '4px',
  },
  bar: {
    display: 'block',
    width: '22px',
    height: '2px',
    background: '#94a3b8',
    borderRadius: '2px',
  },
  mobileMenu: {
    position: 'absolute',
    top: '64px',
    right: '16px',
    background: '#1e293b',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '16px',
    minWidth: '200px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  mobileUser: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '14px',
    color: '#e2e8f0',
    fontWeight: 500,
    margin: '0 0 4px',
  },
  mobileRole: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 16px',
  },
  mobileLogout: {
    width: '100%',
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '13px',
    color: '#94a3b8',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    padding: '8px',
    cursor: 'pointer',
  },
}
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = {
  ADMIN: [
    { to: '/admin/dashboard',   icon: '⬡', label: 'Dashboard' },
    { to: '/admin/schedules',   icon: '◫', label: 'Schedules' },
    { to: '/admin/generate',    icon: '⚙', label: 'Generate' },
    { to: '/admin/teachers',    icon: '◈', label: 'Teachers' },
    { to: '/admin/students',    icon: '◉', label: 'Students' },
    { to: '/admin/subjects',    icon: '▣', label: 'Subjects' },
    { to: '/admin/rooms',       icon: '⬕', label: 'Rooms' },
    { to: '/admin/sections',    icon: '▦', label: 'Sections' },
    { to: '/admin/conflicts',   icon: '⚠', label: 'Conflicts' },
    { to: '/admin/reports',     icon: '◧', label: 'Reports' },
  ],
  TEACHER: [
    { to: '/teacher/schedule',      icon: '◫', label: 'My Schedule' },
    { to: '/teacher/availability',  icon: '◉', label: 'Availability' },
  ],
  STUDENT: [
    { to: '/student/schedule',  icon: '◫', label: 'My Schedule' },
  ],
}

export default function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return null

  const links = NAV[user.role] ?? []

  return (
    <aside style={styles.sidebar}>
      <nav style={styles.nav}>
        {links.map(({ to, icon, label }) => {
          const active = location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              style={{
                ...styles.link,
                ...(active ? styles.linkActive : {}),
              }}
            >
              <span style={{
                ...styles.icon,
                color: active ? '#f59e0b' : '#64748b',
              }}>
                {icon}
              </span>
              <span style={{
                ...styles.label,
                color: active ? '#f8fafc' : '#94a3b8',
                fontWeight: active ? 600 : 400,
              }}>
                {label}
              </span>
              {active && <span style={styles.activeBar} />}
            </NavLink>
          )
        })}
      </nav>

      <div style={styles.footer}>
        <p style={styles.version}>TimeCraft v1.0</p>
      </div>
    </aside>
  )
}

const styles = {
  sidebar: {
    position: 'fixed',
    top: '64px',
    left: 0,
    bottom: 0,
    width: '220px',
    background: '#0f172a',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    zIndex: 900,
  },
  nav: {
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
  },
  link: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    textDecoration: 'none',
    transition: 'background 0.15s',
    background: 'transparent',
  },
  linkActive: {
    background: 'rgba(245,158,11,0.08)',
  },
  icon: {
    fontSize: '16px',
    width: '20px',
    textAlign: 'center',
    flexShrink: 0,
    transition: 'color 0.15s',
  },
  label: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '13.5px',
    letterSpacing: '0.1px',
    transition: 'color 0.15s',
  },
  activeBar: {
    position: 'absolute',
    right: 0,
    top: '25%',
    height: '50%',
    width: '3px',
    background: '#f59e0b',
    borderRadius: '2px 0 0 2px',
  },
  footer: {
    padding: '16px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  version: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '11px',
    color: '#334155',
    textAlign: 'center',
    margin: 0,
    letterSpacing: '0.5px',
  },
}
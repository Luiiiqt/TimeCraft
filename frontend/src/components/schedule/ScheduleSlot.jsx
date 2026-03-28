/**
 * ScheduleSlot
 * A single timetable cell showing subject, teacher, room, and status.
 *
 * @param {Object}   schedule  - ScheduleResponse from API
 * @param {Function} onClick   - called when slot is clicked
 */
export default function ScheduleSlot({ schedule, onClick }) {
  const {
    subjectCode,
    subjectName,
    teacherName,
    roomName,
    sessionType,
    subjectType,
    status,
    campusCode,
  } = schedule

  const isLab      = sessionType === 'LABORATORY'
  const isConflict = status === 'CONFLICTED'
  const isDraft    = status === 'DRAFT'
  const isMajor    = subjectType === 'MAJOR'

  const accentColor = isConflict
    ? '#ef4444'
    : isLab
    ? '#6366f1'
    : isMajor
    ? '#f59e0b'
    : '#10b981'

  const bgColor = isConflict
    ? 'rgba(239,68,68,0.08)'
    : isLab
    ? 'rgba(99,102,241,0.08)'
    : isMajor
    ? 'rgba(245,158,11,0.08)'
    : 'rgba(16,185,129,0.07)'

  return (
    <button
      onClick={onClick}
      style={{
        ...styles.slot,
        background: bgColor,
        borderLeft: `3px solid ${accentColor}`,
        opacity: isDraft ? 0.75 : 1,
      }}
      title={`${subjectName} — ${teacherName} — ${roomName}`}
    >
      {/* Subject code */}
      <span style={{ ...styles.code, color: accentColor }}>
        {subjectCode}
      </span>

      {/* Subject name (truncated) */}
      <span style={styles.name}>{subjectName}</span>

      {/* Teacher */}
      {teacherName && (
        <span style={styles.meta}>
          <span style={styles.dot}>·</span>
          {teacherName.split(' ').pop()}
        </span>
      )}

      {/* Room + Campus */}
      {roomName && (
        <span style={styles.meta}>
          <span style={styles.dot}>◫</span>
          {roomName}
          {campusCode && (
            <span style={styles.campus}>{campusCode}</span>
          )}
        </span>
      )}

      {/* Status badges */}
      <div style={styles.badges}>
        {isConflict && (
          <span style={{ ...styles.badge, background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
            ⚠ conflict
          </span>
        )}
        {isDraft && (
          <span style={{ ...styles.badge, background: 'rgba(148,163,184,0.1)', color: '#64748b' }}>
            draft
          </span>
        )}
        {isLab && (
          <span style={{ ...styles.badge, background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
            lab
          </span>
        )}
      </div>
    </button>
  )
}

const styles = {
  slot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
    width: '100%',
    height: '100%',
    minHeight: '72px',
    padding: '6px 8px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'filter 0.15s, transform 0.1s',
    overflow: 'hidden',
  },
  code: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
    lineHeight: 1,
  },
  name: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '11px',
    fontWeight: 500,
    color: '#e2e8f0',
    lineHeight: 1.3,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  meta: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '10px',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    lineHeight: 1,
  },
  dot: {
    color: '#475569',
  },
  campus: {
    fontWeight: 700,
    fontSize: '9px',
    color: '#475569',
    textTransform: 'uppercase',
    marginLeft: '2px',
  },
  badges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '3px',
    marginTop: '2px',
  },
  badge: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '9px',
    fontWeight: 600,
    padding: '1px 5px',
    borderRadius: '3px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
}
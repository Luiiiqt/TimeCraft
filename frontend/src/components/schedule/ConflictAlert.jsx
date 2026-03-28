/**
 * ConflictAlert
 * Displays a single conflict log entry with type, description, and resolve action.
 *
 * @param {Object}   conflict   - ConflictLog object from API
 * @param {Function} onResolve  - called when admin clicks "Resolve"
 */
export default function ConflictAlert({ conflict, onResolve }) {
  const {
    conflictType,
    description,
    subjectCode,
    subjectName,
    teacherName,
    sectionLabel,
    detectedAt,
    resolved,
  } = conflict

  const typeConfig = {
    TEACHER_DOUBLE_BOOKED: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', icon: '⚠', label: 'Teacher double-booked' },
    ROOM_DOUBLE_BOOKED:    { color: '#f97316', bg: 'rgba(249,115,22,0.08)', icon: '⬕', label: 'Room double-booked' },
    STUDENT_TIME_CONFLICT: { color: '#eab308', bg: 'rgba(234,179,8,0.08)', icon: '◉', label: 'Student time conflict' },
    TEACHER_UNAVAILABLE:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: '◈', label: 'Teacher unavailable' },
    WRONG_ROOM_TYPE:       { color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', icon: '▣', label: 'Wrong room type' },
    WRONG_CAMPUS:          { color: '#6366f1', bg: 'rgba(99,102,241,0.08)', icon: '⬡', label: 'Wrong campus' },
    WRONG_DEPARTMENT:      { color: '#94a3b8', bg: 'rgba(148,163,184,0.06)', icon: '◧', label: 'Wrong department' },
  }

  const cfg = typeConfig[conflictType] ?? {
    color: '#94a3b8', bg: 'rgba(148,163,184,0.06)', icon: '!', label: conflictType,
  }

  const formattedDate = detectedAt
    ? new Date(detectedAt).toLocaleString('en-PH', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div style={{
      ...styles.card,
      background: cfg.bg,
      borderLeft: `3px solid ${cfg.color}`,
      opacity: resolved ? 0.5 : 1,
    }}>
      {/* Header row */}
      <div style={styles.header}>
        <div style={styles.typeRow}>
          <span style={{ ...styles.icon, color: cfg.color }}>{cfg.icon}</span>
          <span style={{ ...styles.typeLabel, color: cfg.color }}>{cfg.label}</span>
          {resolved && (
            <span style={styles.resolvedBadge}>Resolved</span>
          )}
        </div>
        {!resolved && onResolve && (
          <button
            style={styles.resolveBtn}
            onClick={() => onResolve(conflict)}
          >
            Resolve
          </button>
        )}
      </div>

      {/* Context info */}
      <div style={styles.context}>
        {subjectCode && (
          <span style={styles.chip}>
            <span style={{ color: cfg.color }}>{subjectCode}</span>
            {subjectName && ` · ${subjectName}`}
          </span>
        )}
        {teacherName && (
          <span style={styles.chip}>◈ {teacherName}</span>
        )}
        {sectionLabel && (
          <span style={styles.chip}>▦ {sectionLabel}</span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p style={styles.description}>{description}</p>
      )}

      {/* Timestamp */}
      {formattedDate && (
        <p style={styles.timestamp}>Detected {formattedDate}</p>
      )}
    </div>
  )
}

const styles = {
  card: {
    borderRadius: '8px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    border: '1px solid rgba(255,255,255,0.04)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  typeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  icon: {
    fontSize: '14px',
    lineHeight: 1,
  },
  typeLabel: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  resolvedBadge: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '10px',
    fontWeight: 700,
    color: '#10b981',
    background: 'rgba(16,185,129,0.12)',
    padding: '2px 7px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  resolveBtn: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '12px',
    fontWeight: 600,
    color: '#10b981',
    background: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.2)',
    borderRadius: '6px',
    padding: '5px 12px',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background 0.15s',
  },
  context: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  chip: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '11px',
    color: '#94a3b8',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '4px',
    padding: '2px 8px',
  },
  description: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '12px',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.5,
  },
  timestamp: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '10px',
    color: '#334155',
    margin: 0,
    letterSpacing: '0.2px',
  },
}
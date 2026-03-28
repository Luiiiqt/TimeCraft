/**
 * Table — reusable data table
 *
 * @param {Array}   columns  - [{ key, label, render?, width?, align? }]
 * @param {Array}   data     - array of row objects
 * @param {boolean} loading  - shows skeleton rows
 * @param {string}  emptyMsg - message when data is empty
 * @param {Function} onRowClick - optional row click handler
 */
export default function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMsg = 'No data found.',
  onRowClick,
  keyField = 'id',
}) {
  return (
    <div style={styles.wrapper}>
      <table style={styles.table}>
        {/* Header */}
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                style={{
                  ...styles.th,
                  width: col.width,
                  textAlign: col.align ?? 'left',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {loading ? (
            // Skeleton rows
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={`skel-${i}`} style={styles.skeletonRow}>
                {columns.map(col => (
                  <td key={col.key} style={styles.td}>
                    <div style={{
                      ...styles.skeletonCell,
                      width: col.align === 'right' ? '60%' : '80%',
                      marginLeft: col.align === 'right' ? 'auto' : 0,
                    }} />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={styles.emptyCell}>
                <div style={styles.emptyState}>
                  <span style={styles.emptyIcon}>◫</span>
                  <p style={styles.emptyText}>{emptyMsg}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={row[keyField] ?? i}
                style={{
                  ...styles.tr,
                  cursor: onRowClick ? 'pointer' : 'default',
                }}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    style={{
                      ...styles.td,
                      textAlign: col.align ?? 'left',
                    }}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Reusable cell renderers ───────────────────────────────────────────────────

export function StatusBadge({ status }) {
  const map = {
    PUBLISHED:  { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  label: 'Published' },
    DRAFT:      { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: 'Draft' },
    CONFLICTED: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Conflicted' },
    ACTIVE:     { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  label: 'Active' },
    INACTIVE:   { color: '#64748b', bg: 'rgba(100,116,139,0.1)', label: 'Inactive' },
  }
  const cfg = map[status] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', label: status }
  return (
    <span style={{
      fontFamily: '"DM Sans", sans-serif',
      fontSize: '11px',
      fontWeight: 700,
      color: cfg.color,
      background: cfg.bg,
      padding: '2px 8px',
      borderRadius: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.4px',
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

export function RoleTag({ role }) {
  const map = {
    ADMIN:   { color: '#f59e0b', label: 'Admin' },
    TEACHER: { color: '#6366f1', label: 'Teacher' },
    STUDENT: { color: '#10b981', label: 'Student' },
  }
  const cfg = map[role] ?? { color: '#94a3b8', label: role }
  return (
    <span style={{
      fontFamily: '"DM Sans", sans-serif',
      fontSize: '11px',
      fontWeight: 600,
      color: cfg.color,
    }}>
      {cfg.label}
    </span>
  )
}

const styles = {
  wrapper: {
    overflowX: 'auto',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: '#0f172a',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '480px',
  },
  th: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '11px',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    whiteSpace: 'nowrap',
    background: '#0f172a',
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    transition: 'background 0.1s',
  },
  td: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '13px',
    color: '#cbd5e1',
    padding: '13px 16px',
    lineHeight: 1.4,
    verticalAlign: 'middle',
  },
  skeletonRow: {
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  skeletonCell: {
    height: '12px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '4px',
  },
  emptyCell: {
    padding: '48px 16px',
    textAlign: 'center',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  emptyIcon: {
    fontSize: '32px',
    color: '#1e293b',
  },
  emptyText: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '14px',
    color: '#334155',
    margin: 0,
  },
}
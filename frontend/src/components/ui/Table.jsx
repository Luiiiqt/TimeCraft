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
    PUBLISHED:  { color:"#1A6A2A", bg:"rgba(52,196,124,0.1)",  border:"rgba(52,196,124,0.25)",  label:"Published"  },
    DRAFT:      { color:"#5F5E5A", bg:"rgba(95,94,90,0.08)",   border:"rgba(95,94,90,0.2)",     label:"Draft"      },
    CONFLICTED: { color:"#B83030", bg:"rgba(226,75,74,0.08)",  border:"rgba(226,75,74,0.2)",    label:"Conflicted" },
    ACTIVE:     { color:"#1A6A2A", bg:"rgba(52,196,124,0.1)",  border:"rgba(52,196,124,0.25)",  label:"Active"     },
    INACTIVE:   { color:"#5F5E5A", bg:"rgba(95,94,90,0.08)",   border:"rgba(95,94,90,0.2)",     label:"Inactive"   },
  };
  const cfg = map[status] ?? { color:"#888780", bg:"rgba(136,135,128,0.08)", border:"rgba(136,135,128,0.2)", label: status };
  return (
    <span style={{
      fontSize:"10.5px", fontWeight:"700", color: cfg.color,
      background: cfg.bg, border:`1px solid ${cfg.border}`,
      padding:"2px 8px", borderRadius:"5px",
      textTransform:"uppercase", letterSpacing:"0.4px", whiteSpace:"nowrap",
      fontFamily:"'DM Sans', sans-serif",
    }}>{cfg.label}</span>
  );
}

export function RoleTag({ role }) {
  const map = {
    ADMIN:        { color:"#BA7517", bg:"rgba(186,117,23,0.08)",  border:"rgba(186,117,23,0.2)",  label:"Admin"        },
    TEACHER:      { color:"#185FA5", bg:"rgba(24,95,165,0.08)",   border:"rgba(24,95,165,0.2)",   label:"Teacher"      },
    STUDENT:      { color:"#1A6A2A", bg:"rgba(26,106,42,0.08)",   border:"rgba(26,106,42,0.2)",   label:"Student"      },
    PROGRAM_HEAD: { color:"#534AB7", bg:"rgba(83,74,183,0.08)",   border:"rgba(83,74,183,0.2)",   label:"Program Head" },
  };
  const cfg = map[role] ?? { color:"#888780", bg:"rgba(136,135,128,0.08)", border:"rgba(136,135,128,0.2)", label: role };
  return (
    <span style={{
      fontSize:"10.5px", fontWeight:"600", color: cfg.color,
      background: cfg.bg, border:`1px solid ${cfg.border}`,
      padding:"2px 8px", borderRadius:"5px",
      fontFamily:"'DM Sans', sans-serif",
    }}>{cfg.label}</span>
  );
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
    overflowX: "auto",
    borderRadius: "12px",
    border: "1px solid #E0EAE0",
    background: "#fff",
    fontFamily: "'DM Sans', sans-serif",
  },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "480px" },
  th: {
    fontSize: "10.5px", fontWeight: "700", color: "#3B6D3B",
    textTransform: "uppercase", letterSpacing: "0.6px",
    padding: "12px 16px", borderBottom: "1px solid #E0EAE0",
    whiteSpace: "nowrap", background: "#F4FAF6",
    fontFamily: "'DM Sans', sans-serif",
  },
  tr: { borderBottom: "1px solid #EEF4EE", transition: "background 0.12s", cursor: "default" },
  td: {
    fontSize: "13px", color: "#112A17",
    padding: "13px 16px", lineHeight: 1.45, verticalAlign: "middle",
    fontFamily: "'DM Sans', sans-serif",
  },
  skeletonRow: { borderBottom: "1px solid #EEF4EE" },
  skeletonCell: { height: "12px", background: "#EAF5EC", borderRadius: "4px" },
  emptyCell: { padding: "48px 16px", textAlign: "center" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  emptyIcon: { fontSize: "32px", color: "#D8EAD8" },
  emptyText: { fontSize: "14px", color: "#7AAE7A", margin: 0, fontFamily: "'DM Sans', sans-serif" },
};
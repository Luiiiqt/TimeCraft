import { useEffect } from 'react'

/**
 * Modal — accessible overlay dialog
 *
 * @param {boolean}  open     - controls visibility
 * @param {Function} onClose  - called when backdrop or X is clicked
 * @param {string}   title    - modal heading
 * @param {'sm'|'md'|'lg'|'xl'} size
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  hideClose = false,
}) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handler = e => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const widthMap = { sm: '400px', md: '560px', lg: '720px', xl: '920px' }

  return (
    <div style={styles.backdrop} onClick={e => { if (e.target === e.currentTarget) onClose?.() }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ ...styles.panel, maxWidth: widthMap[size] }}
      >
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
          {!hideClose && (
            <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Body */}
        <div style={styles.body}>
          {children}
        </div>
      </div>
    </div>
  )
}

const styles = {
  backdrop: {
    position: "fixed", inset: 0, background: "rgba(17,42,23,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "20px", zIndex: 2000, animation: "fadeIn 0.15s ease",
  },
  panel: {
    width: "100%", background: "#fff", border: "1px solid #D8EAD8",
    borderRadius: "16px", boxShadow: "0 24px 60px rgba(17,42,23,0.18)",
    display: "flex", flexDirection: "column", maxHeight: "90vh", animation: "slideUp 0.2s ease",
  },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0", gap: "16px" },
  title: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "20px", fontWeight: "700", color: "#112A17", margin: 0, lineHeight: 1.2 },
  closeBtn: {
    background: "#F4FAF6", border: "1px solid #D8EAD8",
    borderRadius: "6px", color: "#7AAE7A", fontSize: "13px",
    width: "30px", height: "30px", display: "flex", alignItems: "center",
    justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
  },
  divider: { height: "1px", background: "#E8EEE8", margin: "16px 0 0" },
  body: { padding: "20px 24px 24px", overflowY: "auto", flex: 1 },
};
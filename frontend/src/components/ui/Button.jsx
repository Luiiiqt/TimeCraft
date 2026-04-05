/**
 * Button — reusable button component
 *
 * @param {'primary'|'secondary'|'danger'|'ghost'} variant
 * @param {'sm'|'md'|'lg'}                         size
 * @param {boolean}                                 loading
 * @param {boolean}                                 disabled
 * @param {string}                                  icon     - optional leading icon/glyph
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  onClick,
  type = 'button',
  style: extraStyle = {},
  ...props
}) {
  const base = {
    ...sizeMap[size],
    ...variantMap[variant],
    ...styles.base,
    opacity: disabled || loading ? 0.55 : 1,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    ...extraStyle,
  }

  return (
    <button
      type={type}
      style={base}
      onClick={!disabled && !loading ? onClick : undefined}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span style={styles.spinner} />
      ) : icon ? (
        <span style={styles.icon}>{icon}</span>
      ) : null}
      {children}
    </button>
  )
}

const styles = {
  base: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
    fontFamily: "'DM Sans', sans-serif", fontWeight: "600", borderRadius: "8px",
    border: "none", transition: "all 0.15s", letterSpacing: "0.2px", lineHeight: 1,
  },
  spinner: {
    display: "block", width: "14px", height: "14px",
    border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "currentColor",
    borderRadius: "50%", animation: "spin 0.6s linear infinite", flexShrink: 0,
  },
  icon: { fontSize: "14px", lineHeight: 1, flexShrink: 0 },
};

const variantMap = {
  primary:   { background: "#1A6A2A", color: "#fff" },
  secondary: { background: "#F4FAF6", color: "#112A17", border: "1px solid #D8EAD8" },
  danger:    { background: "rgba(226,75,74,0.08)", color: "#B83030", border: "1px solid rgba(226,75,74,0.2)" },
  ghost:     { background: "transparent", color: "#3B6D3B", border: "1px solid #D8EAD8" },
};
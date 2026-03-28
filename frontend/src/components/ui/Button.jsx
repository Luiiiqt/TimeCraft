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
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: '"DM Sans", sans-serif',
    fontWeight: 600,
    borderRadius: '8px',
    border: 'none',
    transition: 'all 0.15s',
    letterSpacing: '0.2px',
    lineHeight: 1,
  },
  spinner: {
    display: 'block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'currentColor',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
    flexShrink: 0,
  },
  icon: {
    fontSize: '14px',
    lineHeight: 1,
    flexShrink: 0,
  },
}

const sizeMap = {
  sm: { fontSize: '12px', padding: '7px 14px' },
  md: { fontSize: '13.5px', padding: '9px 20px' },
  lg: { fontSize: '15px', padding: '12px 28px' },
}

const variantMap = {
  primary: {
    background: '#f59e0b',
    color: '#0f172a',
  },
  secondary: {
    background: 'rgba(255,255,255,0.06)',
    color: '#e2e8f0',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  danger: {
    background: 'rgba(239,68,68,0.12)',
    color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.2)',
  },
  ghost: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.08)',
  },
}
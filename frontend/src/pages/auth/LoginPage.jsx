import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

// ── Role → route map ──────────────────────────────────────────────────────────
const ROLE_REDIRECT = {
  ADMIN   : "/dashboard",
  TEACHER : "/dashboard",
  STUDENT : "/dashboard",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate          = useNavigate();
  const { login }         = useAuth();

  const [form, setForm]         = useState({ email: "", password: "" });
  const [error, setError]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const user     = await login(form.email.trim(), form.password);
      const redirect = ROLE_REDIRECT[user.role] ?? "/dashboard";
      navigate(redirect, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error    ||
        "Invalid email or password. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={styles.page}>
      {/* Left panel — branding */}
      <div style={styles.brand}>
        <div style={styles.brandInner}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>⏱</span>
            <span style={styles.logoText}>TimeCraft</span>
          </div>
          <p style={styles.brandTagline}>
            Intelligent scheduling,<br />crafted for your campus.
          </p>
          <div style={styles.brandDots}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ ...styles.dot, opacity: 0.15 + i * 0.1 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={styles.formPanel}>
        <div style={styles.card}>
          <h1 style={styles.heading}>Welcome back</h1>
          <p style={styles.subheading}>Sign in to your account</p>

          {error && (
            <div style={styles.errorBanner} role="alert">
              <span style={styles.errorIcon}>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={styles.form}>
            {/* Email */}
            <div style={styles.field}>
              <label htmlFor="email" style={styles.label}>Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={form.email}
                onChange={handleChange}
                disabled={submitting}
                style={styles.input}
                placeholder="you@school.edu"
              />
            </div>

            {/* Password */}
            <div style={styles.field}>
              <label htmlFor="password" style={styles.label}>Password</label>
              <div style={styles.passwordWrapper}>
                <input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  disabled={submitting}
                  style={{ ...styles.input, paddingRight: "3rem" }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  style={styles.eyeBtn}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.submitBtn,
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? (
                <span style={styles.spinnerRow}>
                  <span style={styles.spinner} /> Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p style={styles.registerLink}>
            New student?{" "}
            <Link to="/register" style={styles.link}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const palette = {
  primary : "#1a56db",
  primaryDark : "#1343b0",
  bg      : "#f8faff",
  brand   : "#0f2057",
  white   : "#ffffff",
  text    : "#111827",
  muted   : "#6b7280",
  border  : "#d1d5db",
  error   : "#dc2626",
  errorBg : "#fef2f2",
};

const styles = {
  page: {
    display        : "flex",
    minHeight      : "100vh",
    fontFamily     : "'Sora', 'Segoe UI', sans-serif",
    backgroundColor: palette.bg,
  },
  brand: {
    width          : "42%",
    background     : `linear-gradient(145deg, ${palette.brand} 0%, #1a3a8f 100%)`,
    display        : "flex",
    alignItems     : "center",
    justifyContent : "center",
    padding        : "2rem",
    position       : "relative",
    overflow       : "hidden",
  },
  brandInner: {
    position       : "relative",
    zIndex         : 1,
    color          : palette.white,
  },
  logo: {
    display        : "flex",
    alignItems     : "center",
    gap            : "0.6rem",
    marginBottom   : "1.5rem",
  },
  logoIcon: {
    fontSize       : "2.4rem",
  },
  logoText: {
    fontSize       : "2rem",
    fontWeight     : "700",
    letterSpacing  : "-0.03em",
    color          : palette.white,
  },
  brandTagline: {
    fontSize       : "1.15rem",
    lineHeight     : "1.6",
    color          : "rgba(255,255,255,0.75)",
    maxWidth       : "280px",
  },
  brandDots: {
    display        : "flex",
    gap            : "0.6rem",
    marginTop      : "3rem",
  },
  dot: {
    width          : "10px",
    height         : "10px",
    borderRadius   : "50%",
    backgroundColor: palette.white,
  },
  formPanel: {
    flex           : 1,
    display        : "flex",
    alignItems     : "center",
    justifyContent : "center",
    padding        : "2rem",
  },
  card: {
    width          : "100%",
    maxWidth       : "420px",
    backgroundColor: palette.white,
    borderRadius   : "16px",
    padding        : "2.5rem",
    boxShadow      : "0 4px 32px rgba(0,0,0,0.08)",
  },
  heading: {
    fontSize       : "1.75rem",
    fontWeight     : "700",
    color          : palette.text,
    margin         : "0 0 0.25rem",
    letterSpacing  : "-0.02em",
  },
  subheading: {
    fontSize       : "0.95rem",
    color          : palette.muted,
    margin         : "0 0 1.75rem",
  },
  errorBanner: {
    display        : "flex",
    alignItems     : "center",
    gap            : "0.5rem",
    backgroundColor: palette.errorBg,
    color          : palette.error,
    border         : `1px solid ${palette.error}30`,
    borderRadius   : "8px",
    padding        : "0.75rem 1rem",
    fontSize       : "0.875rem",
    marginBottom   : "1.25rem",
  },
  errorIcon: { fontSize: "1rem" },
  form: {
    display        : "flex",
    flexDirection  : "column",
    gap            : "1.1rem",
  },
  field: {
    display        : "flex",
    flexDirection  : "column",
    gap            : "0.35rem",
  },
  label: {
    fontSize       : "0.85rem",
    fontWeight     : "600",
    color          : palette.text,
  },
  input: {
    padding        : "0.7rem 0.9rem",
    border         : `1.5px solid ${palette.border}`,
    borderRadius   : "8px",
    fontSize       : "0.95rem",
    color          : palette.text,
    outline        : "none",
    transition     : "border-color 0.15s",
    width          : "100%",
    boxSizing      : "border-box",
  },
  passwordWrapper: {
    position       : "relative",
  },
  eyeBtn: {
    position       : "absolute",
    right          : "0.75rem",
    top            : "50%",
    transform      : "translateY(-50%)",
    background     : "none",
    border         : "none",
    cursor         : "pointer",
    fontSize       : "1rem",
    lineHeight     : 1,
    padding        : 0,
  },
  submitBtn: {
    marginTop      : "0.5rem",
    padding        : "0.8rem",
    backgroundColor: palette.primary,
    color          : palette.white,
    border         : "none",
    borderRadius   : "8px",
    fontSize       : "1rem",
    fontWeight     : "600",
    transition     : "background-color 0.15s",
    width          : "100%",
  },
  spinnerRow: {
    display        : "flex",
    alignItems     : "center",
    justifyContent : "center",
    gap            : "0.5rem",
  },
  spinner: {
    display        : "inline-block",
    width          : "14px",
    height         : "14px",
    border         : "2px solid rgba(255,255,255,0.4)",
    borderTop      : "2px solid #fff",
    borderRadius   : "50%",
    animation      : "spin 0.7s linear infinite",
  },
  registerLink: {
    textAlign      : "center",
    marginTop      : "1.5rem",
    fontSize       : "0.9rem",
    color          : palette.muted,
  },
  link: {
    color          : palette.primary,
    fontWeight     : "600",
    textDecoration : "none",
  },
};

// Inject keyframe for spinner
if (typeof document !== "undefined" && !document.getElementById("tc-spin")) {
  const style    = document.createElement("style");
  style.id       = "tc-spin";
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
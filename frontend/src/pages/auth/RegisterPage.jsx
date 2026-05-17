import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "", schoolId: "", email: "", password: "",
    departmentId: "", courseId: "", yearLevel: "1",
    section: "", isIrregular: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [focused, setFocused] = useState(null);
  const [showPw, setShowPw] = useState(false);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        ...form,
        departmentId: Number(form.departmentId) || undefined,
        courseId: Number(form.courseId) || undefined,
        yearLevel: Number(form.yearLevel),
        section: form.isIrregular ? null : form.section,
        userType: "STUDENT",
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const field = (name) => ({
    className: "tc-input",
    name,
    value: form[name],
    onChange: handleChange,
    onFocus: () => setFocused(name),
    onBlur: () => setFocused(null),
    style: focused === name ? focusedStyle : {},
  });

  return (
    <div style={shell}>
      <style>{STYLES}</style>

      {/* ── Ambient background ── */}
      <div style={ambientWrap}>
        <div style={blob1} />
        <div style={blob2} />
        <div style={blob3} />
        <div style={gridPattern} />
      </div>

      {/* ── Left panel ── */}
      <div style={leftPanel}>
        {/* Brand */}
        <div style={brandRow}>
          <div style={logoBox}>⬡</div>
          <div>
            <div style={brandName}>TimeCraft</div>
            <div style={brandSub}>Lorma College</div>
          </div>
        </div>

        {/* Steps */}
        <div style={stepsWrap}>
          <div style={stepsTitle}>Get started in minutes</div>
          {[
            { icon: "📝", step: "01", title: "Create your account", desc: "Fill in your student details and school credentials." },
            { icon: "✅", step: "02", title: "Account verification", desc: "Your enrollment is reviewed and activated by admin." },
            { icon: "📅", step: "03", title: "View your timetable", desc: "See your conflict-free schedule the moment it's published." },
          ].map((s, i) => (
            <div key={i} style={stepRow}>
              <div style={stepNumWrap}>
                <div style={stepIcon}>{s.icon}</div>
                {i < 2 && <div style={stepConnector} />}
              </div>
              <div style={stepContent}>
                <div style={stepNum}>{s.step}</div>
                <div style={stepTitle}>{s.title}</div>
                <div style={stepDesc}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div style={leftBottom}>
          <div style={rolePillsRow}>
            {[
              { icon: "🎓", label: "Students", color: "#22C55E" },
              { icon: "🏫", label: "All Courses", color: "#3B82F6" },
              { icon: "📋", label: "Regular & Irregular", color: "#8B5CF6" },
            ].map(p => (
              <div key={p.label} style={{ ...tagPill, borderColor: p.color + "30", color: p.color }}>
                {p.icon} <span>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div style={rightPanel}>
        <div style={formWrap}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={eyebrow}>
              <span style={eyebrowDot} />
              <span>Student Registration</span>
            </div>
            <h1 style={formTitle}>Create your<br />account</h1>
            <p style={formSub}>All fields are required to complete registration.</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="tc-alert tc-alert-error">
              <span>⚠</span> {error}
            </div>
          )}
          {success && (
            <div className="tc-alert tc-alert-success">
              <span>✓</span> Account created! Redirecting to login…
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Row 1 */}
            <div style={grid2}>
              <div className="tc-field">
                <label className="tc-label">Full Name</label>
                <input {...field("fullName")} placeholder="Juan dela Cruz" required />
              </div>
              <div className="tc-field">
                <label className="tc-label">School ID</label>
                <input {...field("schoolId")} placeholder="2024-0001" required />
              </div>
            </div>

            {/* Email */}
            <div className="tc-field">
              <label className="tc-label">Email Address</label>
              <input {...field("email")} type="email" placeholder="student@lorma.edu" required />
            </div>

            {/* Password */}
            <div className="tc-field">
              <label className="tc-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  {...field("password")}
                  type={showPw ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  required minLength={8}
                  style={{ ...(focused === "password" ? focusedStyle : {}), paddingRight: 42 }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)} style={eyeBtn}>
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Row 2 */}
            <div style={grid2}>
              <div className="tc-field">
                <label className="tc-label">Department ID</label>
                <input {...field("departmentId")} type="number" placeholder="e.g. 1" required />
              </div>
              <div className="tc-field">
                <label className="tc-label">Course ID</label>
                <input {...field("courseId")} type="number" placeholder="e.g. 3" required />
              </div>
            </div>

            {/* Row 3 */}
            <div style={grid2}>
              <div className="tc-field">
                <label className="tc-label">Year Level</label>
                <select
                  className="tc-input"
                  name="yearLevel" value={form.yearLevel}
                  onChange={handleChange}
                  onFocus={() => setFocused("yearLevel")}
                  onBlur={() => setFocused(null)}
                  style={focused === "yearLevel" ? focusedStyle : {}}
                >
                  {[1, 2, 3, 4, 5].map(y => (
                    <option key={y} value={y}>Year {y}</option>
                  ))}
                </select>
              </div>
              <div className="tc-field">
                <label className="tc-label">Section</label>
                <input
                  {...field("section")}
                  placeholder="A / B / C…"
                  disabled={form.isIrregular}
                  style={{
                    ...(focused === "section" ? focusedStyle : {}),
                    ...(form.isIrregular ? { opacity: 0.35, cursor: "not-allowed" } : {}),
                  }}
                />
              </div>
            </div>

            {/* Irregular checkbox */}
            <div style={checkRow}>
              <label style={checkLabel}>
                <div
                  style={{
                    ...checkBox,
                    background: form.isIrregular ? "#22C55E" : "rgba(255,255,255,0.05)",
                    borderColor: form.isIrregular ? "#22C55E" : "rgba(255,255,255,0.15)",
                  }}
                  onClick={() => setForm(f => ({ ...f, isIrregular: !f.isIrregular }))}
                >
                  {form.isIrregular && <span style={{ fontSize: 10, color: "#fff", fontWeight: 900, lineHeight: 1 }}>✓</span>}
                </div>
                <input
                  type="checkbox" name="isIrregular"
                  checked={form.isIrregular} onChange={handleChange}
                  style={{ display: "none" }}
                />
                <span style={checkText}>
                  I am an <strong style={{ color: "rgba(255,255,255,0.7)" }}>irregular student</strong> — no fixed section
                </span>
              </label>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading || success} className="tc-btn">
              {loading
                ? <><span className="tc-spinner" /> Creating account…</>
                : success
                ? <><span>✓</span> Account Created!</>
                : <>Create Account <span style={{ marginLeft: 4 }}>→</span></>
              }
            </button>
          </form>

          <p style={formFooter}>
            Already have an account?{" "}
            <Link to="/login" style={loginLink}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes tcSlideIn {
    from { opacity:0; transform:translateX(24px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes tcPulse {
    0%,100% { opacity:0.6; transform:scale(1); }
    50%     { opacity:1;   transform:scale(1.06); }
  }
  @keyframes tcSpin {
    to { transform: rotate(360deg); }
  }
  @keyframes tcErrorShake {
    0%,100% { transform:translateX(0); }
    20%,60% { transform:translateX(-5px); }
    40%,80% { transform:translateX(5px); }
  }
  @keyframes tcStepIn {
    from { opacity:0; transform:translateX(-12px); }
    to   { opacity:1; transform:translateX(0); }
  }

  .tc-field { margin-bottom: 14px; }

  .tc-label {
    display: block;
    font-size: 10px;
    font-weight: 700;
    color: rgba(255,255,255,0.3);
    margin-bottom: 6px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: 'DM Mono', monospace;
  }

  .tc-input {
    width: 100%;
    padding: 10px 13px;
    background: rgba(255,255,255,0.04);
    border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 9px;
    font-size: 13px;
    color: #fff;
    outline: none;
    font-family: 'DM Sans', sans-serif;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }
  .tc-input::placeholder { color: rgba(255,255,255,0.18); }
  .tc-input option { background: #0f1a2e; color: #fff; }

  .tc-btn {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #22C55E, #16A34A);
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    letter-spacing: 0.01em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 4px 24px rgba(34,197,94,0.28);
    transition: all 0.2s ease;
    margin-top: 6px;
  }
  .tc-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 36px rgba(34,197,94,0.42);
    background: linear-gradient(135deg, #4ADE80, #22C55E);
  }
  .tc-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .tc-alert {
    padding: 10px 13px;
    border-radius: 9px;
    font-size: 13px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'DM Sans', sans-serif;
  }
  .tc-alert-error {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.22);
    color: #FCA5A5;
    animation: tcErrorShake 0.4s ease;
  }
  .tc-alert-success {
    background: rgba(34,197,94,0.1);
    border: 1px solid rgba(34,197,94,0.22);
    color: #86EFAC;
  }

  .tc-spinner {
    width: 13px; height: 13px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: tcSpin 0.7s linear infinite;
    display: inline-block;
    flex-shrink: 0;
  }

  @media (max-width: 900px) {
    .tc-left-panel { display: none !important; }
  }
`;

const focusedStyle = {
  borderColor: "rgba(34,197,94,0.5)",
  background: "rgba(34,197,94,0.04)",
  boxShadow: "0 0 0 3px rgba(34,197,94,0.08)",
};

// ── Layout ────────────────────────────────────────────────────────────────────

const shell = {
  minHeight: "100vh",
  display: "flex",
  background: "#060D1A",
  fontFamily: "'DM Sans', sans-serif",
  color: "#fff",
  overflow: "hidden",
};

const ambientWrap = { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" };
const blob1 = {
  position: "absolute", top: "-5%", left: "5%", width: 500, height: 500,
  borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)",
  filter: "blur(60px)", animation: "tcPulse 8s ease infinite",
};
const blob2 = {
  position: "absolute", bottom: "0%", left: "30%", width: 400, height: 400,
  borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
  filter: "blur(60px)", animation: "tcPulse 10s ease infinite 2s",
};
const blob3 = {
  position: "absolute", top: "40%", right: "0%", width: 350, height: 350,
  borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)",
  filter: "blur(60px)", animation: "tcPulse 12s ease infinite 4s",
};
const gridPattern = {
  position: "absolute", inset: 0,
  backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
  backgroundSize: "60px 60px",
  maskImage: "radial-gradient(ellipse at 30% 50%, black 20%, transparent 75%)",
  WebkitMaskImage: "radial-gradient(ellipse at 30% 50%, black 20%, transparent 75%)",
};

// ── Left panel ────────────────────────────────────────────────────────────────

const leftPanel = {
  position: "relative", zIndex: 1,
  width: 380, flexShrink: 0,
  display: "flex", flexDirection: "column",
  padding: "40px 32px",
  borderRight: "1px solid rgba(255,255,255,0.05)",
  className: "tc-left-panel",
};

const brandRow = { display: "flex", alignItems: "center", gap: 12, marginBottom: 40 };
const logoBox = {
  width: 36, height: 36, borderRadius: 10,
  background: "linear-gradient(135deg, #22C55E, #16A34A)",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 17, boxShadow: "0 4px 16px rgba(34,197,94,0.35)",
};
const brandName = {
  fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 16,
  color: "#fff", letterSpacing: "-0.02em",
};
const brandSub = {
  fontSize: 9, color: "rgba(255,255,255,0.28)",
  letterSpacing: "0.12em", textTransform: "uppercase",
};

const stepsWrap = { flex: 1, display: "flex", flexDirection: "column", gap: 0 };
const stepsTitle = {
  fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)",
  letterSpacing: "0.12em", textTransform: "uppercase",
  fontFamily: "'DM Mono', monospace", marginBottom: 24,
};

const stepRow = { display: "flex", gap: 14, alignItems: "flex-start" };
const stepNumWrap = {
  display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0,
};
const stepIcon = {
  width: 36, height: 36, borderRadius: 10,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 16,
};
const stepConnector = {
  width: 1, height: 28, background: "rgba(255,255,255,0.07)",
  margin: "4px 0",
};
const stepContent = { paddingBottom: 20 };
const stepNum = {
  fontSize: 9, fontWeight: 700, color: "rgba(34,197,94,0.5)",
  fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", marginBottom: 2,
};
const stepTitle = {
  fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 4,
  fontFamily: "'Sora', sans-serif",
};
const stepDesc = { fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 };

const leftBottom = { marginTop: "auto", paddingTop: 24 };
const rolePillsRow = { display: "flex", flexDirection: "column", gap: 8 };
const tagPill = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "7px 12px", borderRadius: 8,
  background: "rgba(255,255,255,0.02)",
  border: "1.5px solid",
  fontSize: 12, fontWeight: 600,
};

// ── Right panel ───────────────────────────────────────────────────────────────

const rightPanel = {
  flex: 1, position: "relative", zIndex: 1,
  display: "flex", alignItems: "flex-start", justifyContent: "center",
  padding: "40px 32px",
  overflowY: "auto",
};

const formWrap = {
  width: "100%", maxWidth: 420,
  paddingTop: 16, paddingBottom: 40,
  animation: "tcSlideIn 0.5s ease 0.1s both",
};

const eyebrow = {
  display: "inline-flex", alignItems: "center", gap: 8,
  background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
  borderRadius: 100, padding: "5px 13px", marginBottom: 16,
  fontSize: 10, fontWeight: 700, color: "#4ADE80",
  letterSpacing: "0.1em", textTransform: "uppercase",
  fontFamily: "'DM Mono', monospace",
};
const eyebrowDot = {
  width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block",
};
const formTitle = {
  fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800,
  color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 8,
};
const formSub = { fontSize: 13, color: "rgba(255,255,255,0.32)", lineHeight: 1.6 };

const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

const eyeBtn = {
  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
  background: "none", border: "none", cursor: "pointer",
  fontSize: 15, color: "rgba(255,255,255,0.3)", padding: 0, lineHeight: 1,
};

const checkRow = { margin: "4px 0 14px" };
const checkLabel = { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" };
const checkBox = {
  width: 18, height: 18, borderRadius: 5, border: "1.5px solid",
  display: "flex", alignItems: "center", justifyContent: "center",
  flexShrink: 0, cursor: "pointer", transition: "all 0.15s",
};
const checkText = { fontSize: 12.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 };

const formFooter = {
  marginTop: 20, textAlign: "center",
  fontSize: 13, color: "rgba(255,255,255,0.3)",
};
const loginLink = { color: "#22C55E", fontWeight: 700, textDecoration: "none" };
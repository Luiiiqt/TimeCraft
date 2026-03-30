import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm] = useState({
    fullName: "", schoolId: "", email: "", password: "",
    departmentId: "", courseId: "", yearLevel: "1",
    section: "", isIrregular: false,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

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
        courseId:     Number(form.courseId)     || undefined,
        yearLevel:    Number(form.yearLevel),
        section:      form.isIrregular ? null : form.section,
        userType:     "STUDENT",
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={authShell}>
      <style>{STYLES}</style>

      {/* Left panel */}
      <div style={authLeft}>
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", color: "#fff" }}>
          <div style={authLogo}>TC</div>
          <h1 style={authBrandName}>TimeCraft</h1>
          <p style={authTagline}>Create your student account to view your personalised timetable.</p>
        </div>
        <div style={circle1} />
        <div style={circle2} />
      </div>

      {/* Right form */}
      <div style={{ ...authRight, overflowY: "auto" }}>
        <div style={{ ...authCard, maxWidth: 460 }}>
          <h2 style={authTitle}>Create account</h2>
          <p style={authSub}>Student registration — all fields required.</p>

          {error   && <div className="auth-alert auth-alert-error">⚠️ {error}</div>}
          {success && <div className="auth-alert auth-alert-success">✅ Account created! Redirecting to login…</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-grid-2">
              <div className="auth-group">
                <label className="auth-label">Full Name</label>
                <input className="auth-input" name="fullName" value={form.fullName}
                  onChange={handleChange} placeholder="Juan dela Cruz" required />
              </div>
              <div className="auth-group">
                <label className="auth-label">School ID</label>
                <input className="auth-input" name="schoolId" value={form.schoolId}
                  onChange={handleChange} placeholder="2024-0001" required />
              </div>
            </div>

            <div className="auth-group">
              <label className="auth-label">Email Address</label>
              <input className="auth-input" type="email" name="email" value={form.email}
                onChange={handleChange} placeholder="student@university.edu" required />
            </div>

            <div className="auth-group">
              <label className="auth-label">Password</label>
              <input className="auth-input" type="password" name="password" value={form.password}
                onChange={handleChange} placeholder="Min. 8 characters" required minLength={8} />
            </div>

            <div className="auth-grid-2">
              <div className="auth-group">
                <label className="auth-label">Department ID</label>
                <input className="auth-input" type="number" name="departmentId"
                  value={form.departmentId} onChange={handleChange} placeholder="e.g. 1" required />
              </div>
              <div className="auth-group">
                <label className="auth-label">Course ID</label>
                <input className="auth-input" type="number" name="courseId"
                  value={form.courseId} onChange={handleChange} placeholder="e.g. 3" required />
              </div>
            </div>

            <div className="auth-grid-2">
              <div className="auth-group">
                <label className="auth-label">Year Level</label>
                <select className="auth-input" name="yearLevel" value={form.yearLevel} onChange={handleChange}>
                  {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div className="auth-group">
                <label className="auth-label">Section</label>
                <input className="auth-input" name="section" value={form.section}
                  onChange={handleChange} placeholder="A / B / C…"
                  disabled={form.isIrregular} />
              </div>
            </div>

            <div className="auth-group" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" id="isIrregular" name="isIrregular"
                checked={form.isIrregular} onChange={handleChange}
                style={{ width: 16, height: 16, accentColor: "#1A237E" }} />
              <label htmlFor="isIrregular" style={{ fontSize: 13, color: "#6B7280", cursor: "pointer" }}>
                I am an <strong>irregular student</strong> (no fixed section)
              </label>
            </div>

            <button type="submit" className="auth-btn" disabled={loading || success}>
              {loading ? "Creating account…" : "Create Account →"}
            </button>
          </form>

          <p style={{ marginTop: 20, fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#1A237E", fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Outfit:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Outfit', system-ui, sans-serif; }
  .auth-group  { margin-bottom: 14px; }
  .auth-label  { display: block; font-size: 11.5px; font-weight: 700; color: #6B7280; margin-bottom: 5px; letter-spacing: .4px; text-transform: uppercase; }
  .auth-input  { width: 100%; padding: 10px 14px; border: 1.5px solid #E4E7F0; border-radius: 8px; font-size: 13.5px; color: #111827; background: #fff; outline: none; font-family: 'Outfit', sans-serif; transition: border-color .15s; }
  .auth-input:focus { border-color: #5C6BC0; box-shadow: 0 0 0 3px rgba(89,101,196,.12); }
  .auth-btn    { width: 100%; padding: 11px; border-radius: 8px; background: #1A237E; color: #fff; border: none; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Outfit', sans-serif; margin-top: 8px; transition: background .15s; }
  .auth-btn:hover { background: #3949AB; }
  .auth-btn:disabled { opacity: .5; cursor: not-allowed; }
  .auth-alert  { padding: 11px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 14px; }
  .auth-alert-error   { background: #FEE2E2; border: 1px solid #FCA5A5; color: #991B1B; }
  .auth-alert-success { background: #D1FAE5; border: 1px solid #6EE7B7; color: #065F46; }
  .auth-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 640px) { .auth-grid-2 { grid-template-columns: 1fr; } }
`;

const authShell    = { minHeight: "100vh", display: "flex", fontFamily: "'Outfit', sans-serif" };
const authLeft     = { width: 420, background: "linear-gradient(150deg,#1A237E 0%,#3949AB 55%,#5C6BC0 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 40px", position: "relative", overflow: "hidden", flexShrink: 0 };
const authRight    = { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", background: "#F5F6FA" };
const authCard     = { background: "#fff", borderRadius: 18, padding: "36px 32px", width: "100%", maxWidth: 420, boxShadow: "0 4px 32px rgba(0,0,0,0.08)", border: "1.5px solid #E4E7F0" };
const authLogo     = { width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.18)", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 };
const authBrandName= { fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 10 };
const authTagline  = { fontSize: 14, color: "rgba(255,255,255,0.72)", lineHeight: 1.6, maxWidth: 280, margin: "0 auto" };
const authTitle    = { fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#111827", marginBottom: 6 };
const authSub      = { fontSize: 13.5, color: "#6B7280", marginBottom: 24 };
const circle1      = { position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.06)", top: -80, right: -80 };
const circle2      = { position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)", bottom: -60, left: -60 };
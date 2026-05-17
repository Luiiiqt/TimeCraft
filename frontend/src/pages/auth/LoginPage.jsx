import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const userData = await login(form.email, form.password);
      if (userData.role === "PROGRAM_HEAD") navigate("/program-head");
      else if (userData.role === "ADMIN") navigate("/admin");
      else if (userData.role === "TEACHER") navigate("/teacher");
      else navigate("/student");
    } catch (err) {
      setError(err?.response?.data?.message ?? "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

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

        {/* Animated timetable preview */}
        <div style={previewCard}>
          <div style={previewHeader}>
            <div style={dots}>
              {["#FF5F57","#FFBD2E","#28C840"].map((c,i)=>(
                <div key={i} style={{width:9,height:9,borderRadius:"50%",background:c}} />
              ))}
            </div>
            <div style={previewTitle}>S.Y. 2025–2026 · 1ST SEM</div>
            <div style={liveBadge}>● LIVE</div>
          </div>
          <MiniGrid />
        </div>

        {/* Bottom tagline */}
        <div style={leftBottom}>
          <p style={tagline}>
            Intelligent scheduling for<br />modern academic institutions.
          </p>
          <div style={statsRow}>
            {[
              { v: "5+",   l: "Departments" },
              { v: "100%", l: "Conflict-Free" },
              { v: "<3s",  l: "Generation" },
            ].map(s => (
              <div key={s.l} style={statItem}>
                <div style={statVal}>{s.v}</div>
                <div style={statLabel}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div style={rightPanel}>
        <div style={formCard}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={eyebrow}>
              <span style={eyebrowDot} />
              <span>Welcome back</span>
            </div>
            <h1 style={formTitle}>Sign in to<br />your account</h1>
            <p style={formSub}>Enter your Lorma College credentials below.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="tc-error">
              <span style={{ fontSize: 15 }}>⚠</span> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="tc-field">
              <label className="tc-label">Email address</label>
              <div style={{ position: "relative" }}>
                <span style={{ ...inputIcon, opacity: focused === "email" ? 1 : 0.35 }}>✉</span>
                <input
                  className={`tc-input${focused === "email" ? " focused" : ""}`}
                  type="email" name="email"
                  value={form.email} onChange={handleChange}
                  placeholder="you@lorma.edu"
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  required autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="tc-field">
              <label className="tc-label">Password</label>
              <div style={{ position: "relative" }}>
                <span style={{ ...inputIcon, opacity: focused === "password" ? 1 : 0.35 }}>🔑</span>
                <input
                  className={`tc-input${focused === "password" ? " focused" : ""}`}
                  type={showPw ? "text" : "password"} name="password"
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••"
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button" onClick={() => setShowPw(p => !p)}
                  style={eyeBtn} title={showPw ? "Hide" : "Show"}
                >
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="tc-btn"
            >
              {loading
                ? <><span className="tc-spinner" /> Signing in…</>
                : <>Sign In <span style={{ marginLeft: 4 }}>→</span></>
              }
            </button>
          </form>

          {/* Divider */}
          <div style={divider}>
            <div style={dividerLine} />
            <span style={dividerText}>or</span>
            <div style={dividerLine} />
          </div>

          {/* Role quick-access */}
          <div style={rolesRow}>
            {[
              { icon: "🛡️", label: "Admin",   color: "#F59E0B" },
              { icon: "🎓", label: "Dean",    color: "#22C55E" },
              { icon: "👨‍🏫", label: "Teacher", color: "#EC4899" },
              { icon: "📚", label: "Student", color: "#06B6D4" },
            ].map(r => (
              <div key={r.label} style={{ ...rolePill, borderColor: r.color + "30", color: r.color }}>
                <span>{r.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em" }}>{r.label}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p style={formFooter}>
            Don't have an account?{" "}
            <Link to="/register" style={registerLink}>Create one →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Mini timetable grid ───────────────────────────────────────────────────────
const MINI_SLOTS = [
  { day: 0, row: 0, span: 2, code: "CS101", color: "#22C55E" },
  { day: 1, row: 0, span: 2, code: "MATH2", color: "#3B82F6" },
  { day: 2, row: 0, span: 2, code: "ENG01", color: "#F59E0B" },
  { day: 3, row: 0, span: 2, code: "PE001", color: "#EC4899" },
  { day: 4, row: 0, span: 2, code: "PHYS1", color: "#8B5CF6" },
  { day: 0, row: 2, span: 2, code: "MATH2", color: "#3B82F6" },
  { day: 1, row: 2, span: 2, code: "CS101", color: "#22C55E" },
  { day: 3, row: 2, span: 2, code: "ENG01", color: "#F59E0B" },
  { day: 4, row: 2, span: 2, code: "PE001", color: "#EC4899" },
  { day: 2, row: 4, span: 2, code: "PHYS1", color: "#8B5CF6" },
  { day: 0, row: 4, span: 2, code: "PE001", color: "#EC4899" },
];
const DAYS = ["M","T","W","Th","F"];

function MiniGrid() {
  return (
    <div style={{ padding: "10px 12px 12px" }}>
      {/* Day headers */}
      <div style={{ display:"grid", gridTemplateColumns:"32px repeat(5,1fr)", gap:2, marginBottom:2 }}>
        <div/>
        {DAYS.map(d=>(
          <div key={d} style={{textAlign:"center",fontSize:8,fontWeight:800,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",fontFamily:"'DM Mono',monospace"}}>{d}</div>
        ))}
      </div>
      {/* Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"32px repeat(5,1fr)", gridTemplateRows:"repeat(6,18px)", gap:2 }}>
        {[0,1,2,3,4,5].map(r=>(
          <div key={r} style={{gridColumn:1,gridRow:r+1,display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:4}}>
            {r%2===0 && <span style={{fontSize:7,color:"rgba(255,255,255,0.2)",fontFamily:"'DM Mono',monospace"}}>{7+r/2}:30</span>}
          </div>
        ))}
        {/* BG cells */}
        {Array.from({length:6}).map((_,r)=>
          Array.from({length:5}).map((_,d)=>(
            <div key={`${r}-${d}`} style={{gridColumn:d+2,gridRow:r+1,background:"rgba(255,255,255,0.02)",borderRadius:3,border:"1px solid rgba(255,255,255,0.03)"}} />
          ))
        )}
        {/* Slots */}
        {MINI_SLOTS.map((s,i)=>(
          <div key={i} style={{
            gridColumn:s.day+2,
            gridRow:`${s.row+1}/${s.row+s.span+1}`,
            background:s.color+"18",
            border:`1px solid ${s.color}50`,
            borderLeft:`2px solid ${s.color}`,
            borderRadius:3,
            display:"flex",alignItems:"center",justifyContent:"center",
            opacity:0,
            animation:`tcFadeUp 0.4s ease ${0.2+i*0.05}s forwards`,
          }}>
            <span style={{fontSize:7,fontWeight:800,color:s.color,fontFamily:"'DM Mono',monospace",letterSpacing:"0.04em"}}>{s.code}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes tcFadeUp {
    from { opacity:0; transform:translateY(4px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes tcPulse {
    0%,100% { opacity:0.6; transform:scale(1); }
    50%     { opacity:1;   transform:scale(1.06); }
  }
  @keyframes tcSpin {
    to { transform: rotate(360deg); }
  }
  @keyframes tcSlideIn {
    from { opacity:0; transform:translateX(24px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes tcErrorShake {
    0%,100% { transform:translateX(0); }
    20%,60% { transform:translateX(-6px); }
    40%,80% { transform:translateX(6px); }
  }

  .tc-field { margin-bottom: 16px; }

  .tc-label {
    display: block;
    font-size: 10.5px;
    font-weight: 700;
    color: rgba(255,255,255,0.35);
    margin-bottom: 7px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: 'DM Mono', monospace;
  }

  .tc-input {
    width: 100%;
    padding: 12px 14px 12px 38px;
    background: rgba(255,255,255,0.04);
    border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    font-size: 13.5px;
    color: #fff;
    outline: none;
    font-family: 'DM Sans', sans-serif;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }
  .tc-input::placeholder { color: rgba(255,255,255,0.2); }
  .tc-input.focused,
  .tc-input:focus {
    border-color: rgba(34,197,94,0.5);
    background: rgba(34,197,94,0.04);
    box-shadow: 0 0 0 3px rgba(34,197,94,0.08);
  }

  .tc-btn {
    width: 100%;
    padding: 13px;
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
    box-shadow: 0 4px 24px rgba(34,197,94,0.3);
    transition: all 0.2s ease;
    margin-top: 8px;
  }
  .tc-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 36px rgba(34,197,94,0.45);
    background: linear-gradient(135deg, #4ADE80, #22C55E);
  }
  .tc-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .tc-error {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: 10px;
    padding: 11px 14px;
    font-size: 13px;
    color: #FCA5A5;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: tcErrorShake 0.4s ease;
    font-family: 'DM Sans', sans-serif;
  }

  .tc-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: tcSpin 0.7s linear infinite;
    display: inline-block;
  }
`;

// ── Layout ────────────────────────────────────────────────────────────────────

const shell = {
  minHeight: "100vh",
  display: "flex",
  background: "#060D1A",
  fontFamily: "'DM Sans', sans-serif",
  color: "#fff",
  overflow: "hidden",
};

const ambientWrap = {
  position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden",
};
const blob1 = {
  position: "absolute", top: "-10%", left: "10%", width: 600, height: 600,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(34,197,94,0.09) 0%, transparent 70%)",
  filter: "blur(60px)",
  animation: "tcPulse 8s ease infinite",
};
const blob2 = {
  position: "absolute", bottom: "5%", left: "25%", width: 400, height: 400,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
  filter: "blur(60px)",
  animation: "tcPulse 10s ease infinite 2s",
};
const blob3 = {
  position: "absolute", top: "30%", right: "5%", width: 350, height: 350,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)",
  filter: "blur(60px)",
  animation: "tcPulse 12s ease infinite 4s",
};
const gridPattern = {
  position: "absolute", inset: 0,
  backgroundImage: "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
  backgroundSize: "60px 60px",
  maskImage: "radial-gradient(ellipse at 30% 50%, black 20%, transparent 75%)",
  WebkitMaskImage: "radial-gradient(ellipse at 30% 50%, black 20%, transparent 75%)",
};

// ── Left panel ────────────────────────────────────────────────────────────────

const leftPanel = {
  position: "relative", zIndex: 1,
  width: 440,
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  padding: "40px 36px",
  borderRight: "1px solid rgba(255,255,255,0.05)",
};

const brandRow = {
  display: "flex", alignItems: "center", gap: 12, marginBottom: 36,
};
const logoBox = {
  width: 38, height: 38, borderRadius: 11,
  background: "linear-gradient(135deg, #22C55E, #16A34A)",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 18, fontWeight: 900,
  boxShadow: "0 4px 16px rgba(34,197,94,0.35)",
};
const brandName = {
  fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 17,
  color: "#fff", letterSpacing: "-0.02em",
};
const brandSub = {
  fontSize: 9, color: "rgba(255,255,255,0.3)",
  letterSpacing: "0.12em", textTransform: "uppercase",
};

const previewCard = {
  background: "rgba(15,23,42,0.85)",
  backdropFilter: "blur(20px)",
  borderRadius: 16,
  border: "1px solid rgba(34,197,94,0.15)",
  boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset",
  overflow: "hidden",
  flex: 1,
};
const previewHeader = {
  padding: "11px 14px",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  display: "flex", alignItems: "center", gap: 8,
};
const dots = { display: "flex", gap: 5 };
const previewTitle = {
  flex: 1, textAlign: "center",
  fontSize: 9, color: "rgba(255,255,255,0.25)",
  fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em",
};
const liveBadge = {
  fontSize: 9, color: "#22C55E", fontWeight: 700,
  background: "rgba(34,197,94,0.1)", padding: "2px 7px",
  borderRadius: 4, border: "1px solid rgba(34,197,94,0.25)",
  fontFamily: "'DM Mono', monospace",
};

const leftBottom = { marginTop: 28 };
const tagline = {
  fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7,
  fontFamily: "'DM Sans', sans-serif", marginBottom: 24,
};
const statsRow = {
  display: "flex", gap: 32,
};
const statItem = {};
const statVal = {
  fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800,
  color: "#fff", letterSpacing: "-0.02em",
};
const statLabel = {
  fontSize: 10, color: "rgba(255,255,255,0.3)",
  letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 3,
};

// ── Right panel ───────────────────────────────────────────────────────────────

const rightPanel = {
  flex: 1, position: "relative", zIndex: 1,
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: "40px 32px",
};

const formCard = {
  width: "100%", maxWidth: 400,
  animation: "tcSlideIn 0.5s ease 0.1s both",
};

const eyebrow = {
  display: "inline-flex", alignItems: "center", gap: 8,
  background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
  borderRadius: 100, padding: "5px 13px", marginBottom: 18,
  fontSize: 11, fontWeight: 700, color: "#4ADE80",
  letterSpacing: "0.08em", textTransform: "uppercase",
  fontFamily: "'DM Mono', monospace",
};
const eyebrowDot = {
  width: 6, height: 6, borderRadius: "50%", background: "#22C55E",
  display: "inline-block",
};
const formTitle = {
  fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 800,
  color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 10,
};
const formSub = {
  fontSize: 13.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.6,
};

const inputIcon = {
  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
  fontSize: 14, transition: "opacity 0.2s", pointerEvents: "none",
  userSelect: "none",
};
const eyeBtn = {
  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
  background: "none", border: "none", cursor: "pointer",
  fontSize: 15, color: "rgba(255,255,255,0.3)", padding: 0, lineHeight: 1,
  transition: "color 0.2s",
};

const divider = {
  display: "flex", alignItems: "center", gap: 12, margin: "22px 0",
};
const dividerLine = {
  flex: 1, height: 1, background: "rgba(255,255,255,0.07)",
};
const dividerText = {
  fontSize: 11, color: "rgba(255,255,255,0.2)",
  fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em",
};

const rolesRow = {
  display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 24,
};
const rolePill = {
  display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
  padding: "10px 6px",
  background: "rgba(255,255,255,0.02)",
  border: "1.5px solid",
  borderRadius: 10,
  fontSize: 18,
};

const formFooter = {
  textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.3)",
};
const registerLink = {
  color: "#22C55E", fontWeight: 700, textDecoration: "none",
};
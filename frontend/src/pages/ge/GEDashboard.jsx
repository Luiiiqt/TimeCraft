import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes slideUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse-glow { 0%,100%{ opacity:0.5; } 50%{ opacity:1; } }

  .tc-card { background:rgba(15,23,42,0.72); backdrop-filter:blur(20px); border-radius:16px; border:1px solid rgba(255,255,255,0.07); transition:all .25s ease; }

  .tc-select {
    padding: 8px 12px; border-radius: 9px; border: 1.5px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04); color: #F1F5F9; font-size: 13px;
    font-family: 'DM Sans', sans-serif; outline: none; cursor: pointer;
    transition: border-color .2s; flex: 1; min-width: 0;
  }
  .tc-select:focus { border-color: rgba(6,182,212,0.5); }
  .tc-select option { background: #0f172a; color: #F1F5F9; }

  .tc-stat-card {
    background: rgba(15,23,42,0.72); backdrop-filter: blur(20px); border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.07); padding: 18px 20px; transition: all .25s ease;
    flex: 1; min-width: 0;
  }
  .tc-stat-card:hover { transform: translateY(-2px); }

  .tc-quick-link {
    display: block; border-radius: 16px; padding: 20px 18px;
    border: 1px solid rgba(255,255,255,0.07); text-decoration: none;
    background: rgba(15,23,42,0.6); backdrop-filter: blur(12px);
    transition: all .25s ease; position: relative; overflow: hidden; cursor: pointer;
  }
  .tc-quick-link:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.15); }
  .tc-quick-link:active { transform: translateY(-1px); }

  /* Responsive: stats row */
  .tc-stats-row { display: flex; gap: 12px; margin-bottom: 24px; }
  .tc-term-row { display: flex; gap: 10px; margin-bottom: 22px; }
  .tc-quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  @media (max-width: 600px) {
    .tc-stats-row { flex-direction: column; gap: 10px; }
    .tc-stat-card { padding: 14px 16px; }
    .tc-quick-grid { grid-template-columns: 1fr; gap: 12px; }
    .tc-term-row { flex-direction: column; gap: 8px; }
    .tc-select { width: 100%; }
    .tc-quick-link { padding: 16px 14px; }
  }

  @media (min-width: 601px) and (max-width: 900px) {
    .tc-stats-row { gap: 10px; }
    .tc-stat-card { padding: 16px 18px; }
  }
`;

const SEMESTER_OPTIONS = [
  { value: "FIRST",  label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "SUMMER", label: "Summer" },
];
const SCHOOL_YEARS = ["2024-2025", "2025-2026", "2026-2027"];

function getCurrentTerm() {
  const m = new Date().getMonth() + 1, y = new Date().getFullYear();
  return { semester: m >= 6 && m <= 10 ? "FIRST" : "SECOND", schoolYear: `${y}-${y + 1}` };
}

export default function GEDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [term, setTerm] = useState(getCurrentTerm());
  const [grouped, setGrouped] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/ge-coordinator/preferences/grouped?semester=${term.semester}&schoolYear=${term.schoolYear}`)
      .then(r => setGrouped(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [term]);

  const total     = grouped.length;
  const finalized = grouped.filter(g => g.assigned).length;
  const pending   = total - finalized;

  return (
    <div style={{
      minHeight: "100vh", background: "#060D1A", color: "#F1F5F9",
      fontFamily: "'DM Sans',sans-serif",
      padding: "clamp(1rem, 4vw, 2rem) clamp(1rem, 5vw, 2.5rem)",
    }}>
      <style>{STYLES}</style>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "25%", width: "clamp(280px,40vw,560px)", height: "clamp(280px,40vw,560px)", borderRadius: "50%", background: "radial-gradient(circle,rgba(6,182,212,0.07) 0%,transparent 70%)", filter: "blur(60px)", animation: "pulse-glow 9s ease infinite" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "5%", width: "clamp(200px,28vw,380px)", height: "clamp(200px,28vw,380px)", borderRadius: "50%", background: "radial-gradient(circle,rgba(34,197,94,0.05) 0%,transparent 70%)", filter: "blur(60px)", animation: "pulse-glow 12s ease infinite 4s" }} />
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: "clamp(20px,4vw,28px)", animation: "slideUp .5s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#06B6D4", boxShadow: "0 0 8px #06B6D4", flexShrink: 0 }} />
            <span style={{ fontSize: "clamp(10px,2vw,11px)", fontWeight: 700, color: "#06B6D4", letterSpacing: ".12em", textTransform: "uppercase", fontFamily: "'DM Mono',monospace" }}>GE Coordinator Portal</span>
          </div>
          <h1 style={{ fontSize: "clamp(1.4rem,5vw,2rem)", fontWeight: 800, color: "#fff", letterSpacing: "-.03em", fontFamily: "'Sora',sans-serif", lineHeight: 1.2 }}>
            Welcome back, {user?.fullName?.split(" ")[0] ?? "Coordinator"}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "clamp(12px,2.5vw,14px)", marginTop: 4, lineHeight: 1.5 }}>
            Manage GE subject-teacher assignments for the current term.
          </p>
        </div>

        {/* Term selectors */}
        <div className="tc-term-row" style={{ animation: "slideUp .5s ease .06s both" }}>
          <select className="tc-select" value={term.semester} onChange={e => setTerm(t => ({ ...t, semester: e.target.value }))}>
            {SEMESTER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select className="tc-select" value={term.schoolYear} onChange={e => setTerm(t => ({ ...t, schoolYear: e.target.value }))}>
            {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Stats */}
        <div className="tc-stats-row" style={{ animation: "slideUp .5s ease .1s both" }}>
          {[
            { label: "GE Subjects w/ Votes", value: loading ? "…" : total,     color: "#06B6D4", glow: "rgba(6,182,212,0.15)" },
            { label: "Pending Assignment",    value: loading ? "…" : pending,   color: "#F59E0B", glow: "rgba(245,158,11,0.12)" },
            { label: "Finalized",             value: loading ? "…" : finalized, color: "#22C55E", glow: "rgba(34,197,94,0.15)" },
          ].map(s => (
            <div key={s.label} className="tc-stat-card" style={{ boxShadow: s.value && s.value !== "…" && Number(s.value) > 0 ? `0 0 24px ${s.glow}` : "none" }}>
              <div style={{ fontSize: "clamp(24px,6vw,32px)", fontWeight: 800, color: s.color, fontFamily: "'Sora',sans-serif", letterSpacing: "-.03em", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "clamp(10px,2vw,11px)", color: "rgba(255,255,255,0.35)", marginTop: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div style={{ animation: "slideUp .5s ease .16s both" }}>
          <div style={{ fontSize: "clamp(10px,2vw,11px)", fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 14, fontFamily: "'DM Mono',monospace" }}>Quick Access</div>
          <div className="tc-quick-grid">

            <div className="tc-quick-link" onClick={() => navigate("/ge/preferences")}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#06B6D480,transparent)", borderRadius: "16px 16px 0 0" }} />
              <div style={{ fontSize: "clamp(22px,5vw,28px)", marginBottom: 10 }}>🗳️</div>
              <div style={{ fontSize: "clamp(13px,3vw,14px)", fontWeight: 700, color: "#F1F5F9", fontFamily: "'Sora',sans-serif", letterSpacing: "-.01em", marginBottom: 6 }}>Assign GE Teachers</div>
              <div style={{ fontSize: "clamp(11px,2.5vw,13px)", color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                Review teacher votes and assign GE teachers to minor subjects.
              </div>
              {pending > 0 && (
                <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, fontSize: "clamp(10px,2vw,11px)", background: "rgba(245,158,11,0.12)", color: "#FCD34D", borderRadius: 8, padding: "4px 12px", fontWeight: 700, border: "1px solid rgba(245,158,11,0.25)", fontFamily: "'DM Mono',monospace" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", display: "inline-block", animation: "pulse-glow 2s ease infinite", flexShrink: 0 }} />
                  {pending} pending
                </div>
              )}
              <div style={{ marginTop: 12, fontSize: "clamp(10px,2vw,11px)", color: "#06B6D4", fontWeight: 700, letterSpacing: ".04em" }}>→ Open</div>
            </div>

            <div className="tc-quick-link" onClick={() => navigate("/ge/schedule")}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#22C55E80,transparent)", borderRadius: "16px 16px 0 0" }} />
              <div style={{ fontSize: "clamp(22px,5vw,28px)", marginBottom: 10 }}>📅</div>
              <div style={{ fontSize: "clamp(13px,3vw,14px)", fontWeight: 700, color: "#F1F5F9", fontFamily: "'Sora',sans-serif", letterSpacing: "-.01em", marginBottom: 6 }}>View Schedule</div>
              <div style={{ fontSize: "clamp(11px,2.5vw,13px)", color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                View the published timetable for GE subjects across all departments.
              </div>
              <div style={{ marginTop: 12, fontSize: "clamp(10px,2vw,11px)", color: "#22C55E", fontWeight: 700, letterSpacing: ".04em" }}>→ Open</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
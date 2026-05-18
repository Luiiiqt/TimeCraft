import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

const SCHOOL_YEARS = ["2024-2025", "2025-2026", "2026-2027"];
const SEMESTER_OPTIONS = [
  { value: "FIRST",  label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "SUMMER", label: "Summer" },
];

function getCurrentTerm() {
  const m = new Date().getMonth() + 1;
  const y = new Date().getFullYear();
  return { semester: m >= 6 && m <= 10 ? "FIRST" : "SECOND", schoolYear: `${y}-${y + 1}` };
}

function StatCard({ label, value, color, icon, onClick, sublabel }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered && onClick ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered && onClick ? color + "50" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 16, padding: "clamp(14px,3vw,22px) clamp(16px,3.5vw,24px)",
        cursor: onClick ? "pointer" : "default", transition: "all 0.25s ease",
        transform: hovered && onClick ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered && onClick ? `0 16px 40px ${color}18` : "none",
        position: "relative", overflow: "hidden", flex: "1 1 140px", minWidth: 130,
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}80, transparent)`, borderRadius: "16px 16px 0 0" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: color + "18", border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{icon}</div>
        {onClick && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Mono', monospace" }}>→</span>}
      </div>
      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(22px,5vw,32px)", fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 5 }}>{value}</div>
      <div style={{ fontSize: "clamp(10px,2vw,12px)", color: "rgba(255,255,255,0.4)", fontWeight: 500, letterSpacing: "0.04em", lineHeight: 1.4 }}>{label}</div>
      {sublabel && <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>{sublabel}</div>}
    </div>
  );
}

function QuickActionCard({ icon, title, desc, badge, onClick, color = "#22C55E" }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 16, padding: "clamp(16px,3vw,22px) clamp(16px,3vw,24px)",
        cursor: "pointer", transition: "all 0.25s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: color + "18", border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, transition: "transform 0.25s ease", transform: hovered ? "scale(1.08)" : "scale(1)" }}>{icon}</div>
        {badge && (
          <span style={{ fontSize: 10, background: "#F59E0B20", color: "#F59E0B", border: "1px solid #F59E0B40", padding: "2px 8px", borderRadius: 6, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{badge}</span>
        )}
      </div>
      <div style={{ fontSize: "clamp(13px,2.5vw,15px)", fontWeight: 700, color: "#F1F5F9", marginBottom: 5, fontFamily: "'Sora', sans-serif", letterSpacing: "-0.01em" }}>{title}</div>
      <div style={{ fontSize: "clamp(11px,2vw,13px)", color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>{desc}</div>
    </div>
  );
}

export default function PHDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [term, setTerm] = useState(getCurrentTerm());
  const [courses, setCourses] = useState([]);
  const [grouped, setGrouped] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/program-head/my-courses").then(r => setCourses(r.data?.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/program-head/preferences/grouped?semester=${term.semester}&schoolYear=${term.schoolYear}`),
      api.get(`/program-head/assignments?semester=${term.semester}&schoolYear=${term.schoolYear}`),
    ]).then(([gRes, aRes]) => {
      setGrouped(gRes.data?.data ?? []);
      setAssignments(aRes.data?.data ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [term]);

  const totalSubjects = grouped.length;
  const finalized     = grouped.filter(g => g.assigned).length;
  const pending       = totalSubjects - finalized;
  const completionPct = totalSubjects > 0 ? Math.round((finalized / totalSubjects) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#060D1A", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        select { color-scheme: dark; }

        .ph-page { padding: clamp(24px,5vw,40px) clamp(16px,5vw,40px) 60px; }
        .ph-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
        .ph-term-selects { display: flex; gap: 8px; }
        .ph-stats-row { display: flex; gap: 12px; margin-bottom: 28px; flex-wrap: wrap; }
        .ph-quick-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .ph-courses-wrap { display: flex; gap: 10px; flex-wrap: wrap; }

        @media (max-width: 700px) {
          .ph-header { flex-direction: column; }
          .ph-term-selects { flex-direction: column; width: 100%; }
          .ph-term-selects select { width: 100%; }
          .ph-stats-row { gap: 8px; }
          .ph-quick-grid { grid-template-columns: 1fr; gap: 10px; }
        }

        @media (min-width: 701px) and (max-width: 950px) {
          .ph-quick-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
        }
      `}</style>

      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "30%", width: "clamp(300px,45vw,600px)", height: "clamp(300px,45vw,600px)", borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "-5%", width: "clamp(200px,30vw,400px)", height: "clamp(200px,30vw,400px)", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "60px 60px", maskImage: "radial-gradient(ellipse at 60% 20%, black 20%, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse at 60% 20%, black 20%, transparent 70%)" }} />
      </div>

      <div className="ph-page" style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <div className="ph-header">
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 100, padding: "4px 14px", marginBottom: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#4ADE80", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Program Head Portal</span>
            </div>
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(1.4rem,5vw,2rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 6, lineHeight: 1.2 }}>
              Welcome back, {user?.fullName?.split(" ")[0] ?? "there"}.
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "clamp(12px,2.5vw,14px)", lineHeight: 1.6 }}>
              Manage subject-teacher assignments across your courses.
            </p>
          </div>

          <div className="ph-term-selects">
            {[
              { value: term.semester, opts: SEMESTER_OPTIONS, key: "semester" },
              { value: term.schoolYear, opts: SCHOOL_YEARS.map(y => ({ value: y, label: y })), key: "schoolYear" },
            ].map(sel => (
              <select key={sel.key} value={sel.value}
                onChange={e => setTerm(t => ({ ...t, [sel.key]: e.target.value }))}
                style={{ padding: "8px 12px", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 9, background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", cursor: "pointer" }}>
                {sel.opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ))}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="ph-stats-row">
          <StatCard label="Managed Courses"    value={courses.length} color="#3B82F6" icon="📋" />
          <StatCard label="Subjects w/ Votes"  value={totalSubjects}  color="#8B5CF6" icon="🗳️" onClick={() => navigate("/ph/preferences")} />
          <StatCard label="Pending Assignment" value={pending}        color="#F59E0B" icon="⏳" onClick={() => navigate("/ph/preferences")} sublabel={pending > 0 ? "Needs attention" : undefined} />
          <StatCard label="Finalized"          value={finalized}      color="#22C55E" icon="✅" onClick={() => navigate("/ph/preferences")} sublabel={totalSubjects > 0 ? `${completionPct}% complete` : undefined} />
        </div>

        {/* ── Progress bar ── */}
        {totalSubjects > 0 && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: "clamp(11px,2.5vw,13px)", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Assignment progress</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#22C55E", fontWeight: 700 }}>{finalized}/{totalSubjects}</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${completionPct}%`, background: "linear-gradient(90deg, #22C55E, #4ADE80)", borderRadius: 99, transition: "width 0.6s ease" }} />
            </div>
          </div>
        )}

        {/* ── Courses ── */}
        {courses.length > 0 && (
          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 20px", marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Your Courses</div>
            <div className="ph-courses-wrap">
              {courses.map(c => (
                <div key={c.id} style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", fontSize: "clamp(11px,2vw,13px)", fontWeight: 600, color: "#93C5FD", fontFamily: "'DM Mono', monospace" }}>
                  {c.code} <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>—</span> {c.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick actions ── */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 14 }}>— Quick Actions —</div>
          <div className="ph-quick-grid">
            <QuickActionCard icon="📚" title="View Subjects"   color="#3B82F6" desc="Browse the full curriculum by year level and semester." onClick={() => navigate("/ph/subjects")} />
            <QuickActionCard icon="📅" title="View Schedule"   color="#22C55E" desc="See the published timetable for your courses." onClick={() => navigate("/ph/schedule")} />
            <QuickActionCard icon="🗳️" title="Assign Teachers" color="#8B5CF6" desc="Review teacher votes and finalize subject assignments." onClick={() => navigate("/ph/preferences")} badge={pending > 0 ? `${pending} pending` : undefined} />
          </div>
        </div>

      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes slideUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse-glow { 0%,100%{ opacity:0.5; transform:scale(1); } 50%{ opacity:1; transform:scale(1.04); } }

  /* ── Base card ── */
  .tc-card {
    background: rgba(15,23,42,0.7);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.07);
    transition: border-color .25s ease, box-shadow .25s ease;
  }
  .tc-card:hover { border-color: rgba(255,255,255,0.13); }

  /* ── Stat card ── */
  .tc-stat-card {
    background: rgba(15,23,42,0.7);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.07);
    padding: 20px 20px;
    transition: all .25s ease;
  }
  .tc-stat-card:hover { transform: translateY(-2px); }

  /* ── Inputs ── */
  .tc-input {
    padding: 9px 12px;
    border-radius: 9px;
    border: 1.5px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: #F1F5F9;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    transition: border-color .2s;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }
  .tc-input:focus { border-color: rgba(34,197,94,0.5); }
  .tc-input::-webkit-inner-spin-button { opacity: .4; }

  .tc-select {
    padding: 9px 30px 9px 12px;
    border-radius: 9px;
    border: 1.5px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: #F1F5F9;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.4)' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }
  .tc-select:focus { border-color: rgba(34,197,94,0.5); }
  .tc-select option { background: #0f172a; color: #F1F5F9; }

  /* ── Primary button ── */
  .tc-btn-primary {
    padding: 10px 22px;
    border-radius: 9px;
    border: none;
    background: linear-gradient(135deg,#22C55E,#16A34A);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all .2s ease;
    box-shadow: 0 4px 16px rgba(34,197,94,0.3);
    touch-action: manipulation;
    min-height: 42px;
    white-space: nowrap;
  }
  .tc-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(34,197,94,0.45); }
  .tc-btn-primary:active { transform: translateY(0); }
  .tc-btn-primary:disabled { background: #374151; box-shadow: none; cursor: not-allowed; transform: none; }

  /* ── Quick link card ── */
  .tc-quick-link {
    display: block;
    border-radius: 16px;
    padding: 20px 18px;
    border: 1px solid rgba(255,255,255,0.07);
    text-decoration: none;
    background: rgba(15,23,42,0.6);
    backdrop-filter: blur(12px);
    transition: all .25s ease;
    position: relative;
    overflow: hidden;
    touch-action: manipulation;
  }
  .tc-quick-link::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity .25s ease;
  }
  .tc-quick-link:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.15); }
  .tc-quick-link:hover::before { opacity: 1; }
  .tc-quick-link:active { transform: translateY(-1px); }

  /* ── Responsive stats grid ── */
  .tc-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 28px;
    animation: slideUp .5s ease .08s both;
  }

  /* ── Quick links grid ── */
  .tc-quick-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  /* ── Section form row ── */
  .tc-section-row {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    align-items: flex-end;
  }

  /* ── Label ── */
  .tc-field-label {
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,255,255,0.4);
    display: block;
    margin-bottom: 5px;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  /* ── Tablet ── */
  @media (max-width: 900px) {
    .tc-stats-grid { grid-template-columns: repeat(2, 1fr); }
    .tc-quick-grid  { grid-template-columns: repeat(2, 1fr); }
  }

  /* ── Mobile ── */
  @media (max-width: 600px) {
    .tc-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .tc-quick-grid  { grid-template-columns: 1fr 1fr; gap: 10px; }
    .tc-section-row { gap: 10px; }
    .tc-section-row .tc-btn-primary { width: 100%; justify-content: center; }
    .tc-input { font-size: 16px !important; } /* prevent iOS zoom */
  }

  /* ── Very small ── */
  @media (max-width: 420px) {
    .tc-quick-grid { grid-template-columns: 1fr; }
    .tc-stats-grid { grid-template-columns: 1fr 1fr; }
  }
`;

function getDefaultTerm() {
  const now = new Date(); const month = now.getMonth() + 1; const year = now.getFullYear();
  const semester = month >= 6 && month <= 10 ? "FIRST" : "SECOND";
  return { semester, schoolYear: `${year}-${year + 1}` };
}
const { semester: SEMESTER, schoolYear: SCHOOL_YEAR } = getDefaultTerm();

const QUICK_LINKS = [
  { to: "/dean/assignments",  icon: "📋", label: "Manage Subject Assignments", color: "#3B82F6" },
  { to: "/dean/preferences",  icon: "✅", label: "Review Teacher Preferences",  color: "#22C55E" },
  { to: "/dean/generate",     icon: "⚡", label: "Generate Schedule",            color: "#8B5CF6" },
  { to: "/dean/subjects",     icon: "📚", label: "Manage Subjects",              color: "#06B6D4" },
  { to: "/dean/curriculum",   icon: "🗂️",  label: "Import Curriculum",            color: "#F59E0B" },
  { to: "/dean/irregular",    icon: "👤", label: "Irregular Students",           color: "#EC4899" },
];

export default function DeanDashboard() {
  const { user } = useAuth();
  const [assignments,      setAssignments]      = useState([]);
  const [pending,          setPending]          = useState([]);
  const [pendingIrregular, setPendingIrregular] = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [courses,          setCourses]          = useState([]);
  
  const [enrollForm,    setEnrollForm]    = useState({ courseId: "", yearLevel: 1, enrolledCount: "" });
  const [enrollSaving,  setEnrollSaving]  = useState(false);
  const [enrollMsg,     setEnrollMsg]     = useState("");

  useEffect(() => {
    Promise.all([
      api.get(`/dean/assignments?semester=${SEMESTER}&schoolYear=${SCHOOL_YEAR}`),
      api.get(`/dean/preferences?semester=${SEMESTER}&schoolYear=${SCHOOL_YEAR}`),
      api.get(`/dean/my-courses`),
      api.get(`/students/pending-irregular`),
    ]).then(([aRes, pRes, cRes, iRes]) => {
      setAssignments(aRes.data?.data ?? []);
      setPending((pRes.data?.data ?? []).filter(p => p.status === "PENDING"));
      setPendingIrregular(iRes.data?.data ?? []);
      const courseList = cRes.data?.data ?? [];
      setCourses(courseList);
      if (courseList.length > 0) {
        setEnrollForm(f => ({ ...f, courseId: courseList[0].id }));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const saveEnrollment = async () => {
    if (!enrollForm.courseId || enrollForm.enrolledCount === "") return;
    setEnrollSaving(true); setEnrollMsg("");
    try {
      await api.post(`/dean/enrollment`, {
        courseId: Number(enrollForm.courseId),
        yearLevel: Number(enrollForm.yearLevel),
        enrolledCount: Number(enrollForm.enrolledCount),
        semester: SEMESTER,
        schoolYear: SCHOOL_YEAR,
      });
      const count = Number(enrollForm.enrolledCount);
      setEnrollMsg(
        count > 40
          ? `✓ ${count} students saved — will be split into Group 1 & Group 2`
          : `✓ ${count} students enrolled for Year ${enrollForm.yearLevel}`
      );
    } catch (e) { setEnrollMsg("✗ " + (e.response?.data?.message ?? "Failed to save")); }
    finally { setEnrollSaving(false); }
  };

  

  const finalized = assignments.filter(a => a.finalized).length;
  const semLabel = SEMESTER === "FIRST" ? "1st" : SEMESTER === "SECOND" ? "2nd" : "Summer";

  const pagePad = {
    padding: "clamp(1rem, 4vw, 2rem) clamp(1rem, 4vw, 2.5rem)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060D1A", color: "#F1F5F9", fontFamily: "'DM Sans',sans-serif", ...pagePad }}>
      <style>{STYLES}</style>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "30%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(34,197,94,0.07) 0%,transparent 70%)", filter: "blur(60px)", animation: "pulse-glow 8s ease infinite" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.05) 0%,transparent 70%)", filter: "blur(60px)", animation: "pulse-glow 11s ease infinite 3s" }} />
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: "clamp(20px, 4vw, 32px)", animation: "slideUp .5s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 8px #22C55E" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#22C55E", letterSpacing: ".12em", textTransform: "uppercase", fontFamily: "'DM Mono',monospace" }}>Dean Portal</span>
          </div>
          <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 800, color: "#fff", letterSpacing: "-.03em", fontFamily: "'Sora',sans-serif", lineHeight: 1.2 }}>
            Welcome back{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "clamp(12px, 3vw, 14px)", marginTop: 4 }}>
            {user?.departmentName} · {semLabel} Semester {SCHOOL_YEAR}
          </p>
        </div>

        {/* Stats row */}
        <div className="tc-stats-grid">
          {[
            { label: "Total Assignments",   value: loading ? "…" : assignments.length,       color: "#3B82F6", glow: "rgba(59,130,246,0.15)" },
            { label: "Finalized",           value: loading ? "…" : finalized,                color: "#22C55E", glow: "rgba(34,197,94,0.15)" },
            { label: "Pending Preferences", value: loading ? "…" : pending.length,           color: "#F59E0B", glow: "rgba(245,158,11,0.12)" },
            { label: "Pending Irregular",   value: loading ? "…" : pendingIrregular.length,  color: "#EC4899", glow: "rgba(236,72,153,0.12)" },
          ].map(s => (
            <div key={s.label} className="tc-stat-card"
              style={{ boxShadow: s.value && s.value !== "…" && Number(s.value) > 0 ? `0 0 24px ${s.glow}` : "none" }}>
              <div style={{ fontSize: "clamp(24px, 6vw, 32px)", fontWeight: 800, color: s.color, fontFamily: "'Sora',sans-serif", letterSpacing: "-.03em", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "clamp(9px, 2vw, 11px)", color: "rgba(255,255,255,0.35)", marginTop: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        

        {/* Enrollment Input */}
        <div className="tc-card" style={{ padding: "20px 22px", marginBottom: "clamp(18px, 3vw, 28px)", animation: "slideUp .5s ease .17s both" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4, fontFamily: "'Sora',sans-serif" }}>Student Enrollment</h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 18, lineHeight: 1.6 }}>
            Enter the number of enrolled students per section. Sections exceeding 40 will automatically be split into Group 1 and Group 2.
          </p>

          <div className="tc-section-row">
            {courses.length > 1 && (
              <div style={{ flex: "0 0 auto" }}>
                <label className="tc-field-label">Course</label>
                <select className="tc-select" value={enrollForm.courseId}
                  onChange={e => setEnrollForm(f => ({ ...f, courseId: e.target.value }))}>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="tc-field-label">Year Level</label>
              <select className="tc-select" value={enrollForm.yearLevel}
                onChange={e => setEnrollForm(f => ({ ...f, yearLevel: e.target.value }))}>
                {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div>
              <label className="tc-field-label">No. of Students</label>
              <input
                type="number"
                className="tc-input"
                min={0} max={200}
                placeholder="e.g. 45"
                value={enrollForm.enrolledCount}
                onChange={e => setEnrollForm(f => ({ ...f, enrolledCount: e.target.value }))}
                style={{ width: 110 }}
              />
            </div>
            <button className="tc-btn-primary" onClick={saveEnrollment} disabled={enrollSaving || enrollForm.courseId === "" || enrollForm.enrolledCount === ""}>
              {enrollSaving ? "Saving…" : "Save Enrollment"}
            </button>
          </div>

          {Number(enrollForm.enrolledCount) > 40 && (
            <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", fontSize: 12, color: "#FCD34D", fontFamily: "'DM Mono',monospace" }}>
              ⚠ Enrollment exceeds 40 — Laboratory classes will be split into Group 1 and Group 2. Lecture classes remain combined. BSCS+BSIT merged subjects are unaffected.
            </div>
          )}

          {enrollMsg && (
            <p style={{ fontSize: 12, marginTop: 12, color: enrollMsg.startsWith("✓") ? "#4ADE80" : "#f87171", fontFamily: "'DM Mono',monospace" }}>
              {enrollMsg}
            </p>
          )}
        </div>

        {/* Quick links */}
        <div style={{ animation: "slideUp .5s ease .2s both" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 14, fontFamily: "'DM Mono',monospace" }}>Quick Access</div>
          <div className="tc-quick-grid">
            {QUICK_LINKS.map((l, i) => (
              <Link key={l.to} to={l.to} className="tc-quick-link"
                style={{ animationDelay: `${.22 + i * .06}s`, animation: "slideUp .4s ease both" }}>
                {/* Top accent bar */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${l.color}80,transparent)`, borderRadius: "16px 16px 0 0" }} />
                <div style={{ fontSize: "clamp(20px, 4vw, 26px)", marginBottom: 10 }}>{l.icon}</div>
                <div style={{ fontSize: "clamp(12px, 2.5vw, 13px)", fontWeight: 700, color: "#F1F5F9", letterSpacing: "-.01em", fontFamily: "'Sora',sans-serif", lineHeight: 1.3 }}>{l.label}</div>
                <div style={{ fontSize: 11, color: l.color, marginTop: 8, fontWeight: 700, letterSpacing: ".04em" }}>→ Open</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
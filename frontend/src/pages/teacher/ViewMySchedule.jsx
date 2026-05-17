import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import useSchedule from "../../hooks/useSchedule";
import api from "../../services/api";
import TimetableGrid from "../../components/schedule/TimetableGrid";

const SEMESTERS = [
  { value: "FIRST",  label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "SUMMER", label: "Summer" },
];

function getDefaultTerm() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return { semester: month >= 6 && month <= 10 ? "FIRST" : "SECOND", schoolYear: `${year}-${year + 1}` };
}

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes pulse-glow  { 0%,100%{opacity:0.5;} 50%{opacity:1;} }
  @keyframes blink       { 0%,100%{opacity:1;} 50%{opacity:0;} }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }

  .tc-select {
    padding: 8px 28px 8px 13px;
    border-radius: 9px;
    font-size: 12px;
    font-weight: 600;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.75);
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }
  .tc-select:focus { border-color: rgba(59,130,246,0.4); background: rgba(255,255,255,0.08); }
  .tc-select option { background: #0F1A2E; color: #fff; }

  .tc-filter-label {
    font-size: 10px;
    font-weight: 700;
    color: rgba(255,255,255,0.25);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-family: 'DM Mono', monospace;
    display: block;
    margin-bottom: 5px;
  }

  .tc-print-btn {
    padding: 8px 18px;
    border-radius: 9px;
    font-size: 12px;
    font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    border: 1px solid rgba(34,197,94,0.3);
    background: rgba(34,197,94,0.1);
    color: #4ADE80;
    transition: all 0.2s;
    align-self: flex-end;
  }
  .tc-print-btn:hover {
    background: rgba(34,197,94,0.18);
    border-color: rgba(34,197,94,0.5);
    box-shadow: 0 4px 16px rgba(34,197,94,0.2);
  }
`;

export default function ViewMySchedule() {
  const { user } = useAuth();
  const { schedules, loading, error, fetchPublishedByTeacher } = useSchedule();
  const defaults = getDefaultTerm();

  const [term, setTerm] = useState(defaults);
  const [teacherId, setTeacherId] = useState(null);

  useEffect(() => {
    api.get("/teachers/me")
      .then(r => { const data = r.data?.data ?? r.data; setTeacherId(data?.id ?? user?.userId); })
      .catch(() => setTeacherId(user?.userId));
  }, [user]);

  useEffect(() => {
    if (teacherId) fetchPublishedByTeacher(teacherId, term.semester, term.schoolYear);
  }, [teacherId, term.semester, term.schoolYear, fetchPublishedByTeacher]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => { const y = currentYear - 2 + i; return `${y}-${y + 1}`; });
  const semLabel = term.semester === "FIRST" ? "1st" : term.semester === "SECOND" ? "2nd" : "Summer";

  return (
    <div style={{ minHeight: "100vh", background: "#060D1A", color: "#fff", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{GLOBAL_CSS}</style>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "5%", left: "15%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,0.07) 0%,transparent 70%)", filter: "blur(60px)", animation: "pulse-glow 10s ease infinite" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(34,197,94,0.05) 0%,transparent 70%)", filter: "blur(60px)", animation: "pulse-glow 8s ease infinite 3s" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)", backgroundSize: "60px 60px", maskImage: "radial-gradient(ellipse at 50% 20%,black 25%,transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 20%,black 25%,transparent 75%)" }} />
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 32px 60px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 30, animation: "fadeSlideUp 0.5s ease both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 100, padding: "4px 14px", marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6", display: "inline-block", animation: "blink 2s ease infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#93C5FD", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono',monospace" }}>
              My Teaching Schedule
            </span>
          </div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 6 }}>
            {semLabel} Semester Timetable
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
            {user?.fullName} · {user?.departmentName || "—"}
          </p>
        </div>

        {/* Filters bar */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 24, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 20px", animation: "fadeSlideUp 0.5s ease 0.08s both" }}>
          <div>
            <label className="tc-filter-label">Semester</label>
            <select className="tc-select" value={term.semester} onChange={e => setTerm(t => ({ ...t, semester: e.target.value }))}>
              {SEMESTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="tc-filter-label">School Year</label>
            <select className="tc-select" value={term.schoolYear} onChange={e => setTerm(t => ({ ...t, schoolYear: e.target.value }))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Schedule summary badges */}
          {!loading && schedules.length > 0 && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" }}>
              <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", color: "#93C5FD", borderRadius: 20, padding: "4px 12px", fontWeight: 700 }}>
                {new Set(schedules.map(s => s.subjectId)).size} subjects
              </span>
              <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.22)", color: "#4ADE80", borderRadius: 20, padding: "4px 12px", fontWeight: 700 }}>
                {schedules.length} sessions
              </span>
            </div>
          )}

          <button className="tc-print-btn" onClick={() => window.print()}>🖨 Print</button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "11px 16px", marginBottom: 20, color: "#FCA5A5", fontSize: 13, display: "flex", gap: 8, alignItems: "center", animation: "fadeSlideUp 0.3s ease both" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && schedules.length === 0 && (
          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "72px 24px", textAlign: "center", animation: "fadeSlideUp 0.5s ease 0.1s both" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 18, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>No schedule found</div>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 14 }}>No published schedule for {semLabel} Semester {term.schoolYear}.</p>
          </div>
        )}

        {/* Timetable */}
        {(loading || schedules.length > 0) && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, overflow: "hidden", animation: "fadeSlideUp 0.5s ease 0.12s both" }}>
            <TimetableGrid schedules={schedules} loading={loading} />
          </div>
        )}

      </div>
    </div>
  );
}
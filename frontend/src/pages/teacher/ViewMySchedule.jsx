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
  return {
    semester: month >= 6 && month <= 10 ? "FIRST" : "SECOND",
    schoolYear: `${year}-${year + 1}`,
  };
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes pulse-glow  { 0%,100%{opacity:.5} 50%{opacity:1} }
  @keyframes blink       { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

  /* ── Select ── */
  .vms-select {
    padding: 8px 28px 8px 13px;
    border-radius: 9px; font-size: 12px; font-weight: 600;
    background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12);
    color: rgba(255,255,255,.75); font-family: 'DM Sans', sans-serif;
    cursor: pointer; outline: none; transition: border-color .2s, background .2s;
    appearance: none; width: 100%;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center;
  }
  .vms-select:focus { border-color: rgba(59,130,246,.4); background: rgba(255,255,255,.08); }
  .vms-select option { background: #0F1A2E; color: #fff; }

  .vms-filter-label {
    font-size: 10px; font-weight: 700; color: rgba(255,255,255,.25);
    letter-spacing: .12em; text-transform: uppercase;
    font-family: 'DM Mono', monospace; display: block; margin-bottom: 5px;
  }

  .vms-print-btn {
    padding: 8px 18px; border-radius: 9px; font-size: 12px; font-weight: 700;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    border: 1px solid rgba(34,197,94,.3); background: rgba(34,197,94,.1); color: #4ADE80;
    transition: all .2s; white-space: nowrap;
  }
  .vms-print-btn:hover { background: rgba(34,197,94,.18); border-color: rgba(34,197,94,.5); box-shadow: 0 4px 16px rgba(34,197,94,.2); }

  /* ── Layout ── */
  .vms-page {
    min-height: 100vh; background: #060D1A; color: #fff;
    font-family: 'DM Sans', sans-serif;
  }

  .vms-inner {
    max-width: 1200px; margin: 0 auto;
    padding: 40px 32px 60px;
    position: relative; z-index: 1;
  }
  @media (max-width: 900px) { .vms-inner { padding: 32px 24px 48px; } }
  @media (max-width: 640px) { .vms-inner { padding: 24px 16px 40px; } }

  /* ── Header ── */
  .vms-h1 {
    font-family: 'Sora', sans-serif;
    font-size: clamp(1.5rem, 4vw, 2rem);
    font-weight: 800; letter-spacing: -.03em; color: #fff; margin-bottom: 6px;
  }
  .vms-sub { color: rgba(255,255,255,.35); font-size: clamp(12px, 1.8vw, 14px); }

  /* ── Filters bar ── */
  .vms-filters {
    display: flex; gap: 14px; flex-wrap: wrap; align-items: flex-end;
    margin-bottom: 24px;
    background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.08);
    border-radius: 14px; padding: 16px 20px;
    animation: fadeSlideUp .5s ease .08s both;
  }
  @media (max-width: 640px) {
    .vms-filters { padding: 14px 16px; gap: 12px; border-radius: 12px; }
  }

  /* Filter fields row */
  .vms-filter-fields {
    display: flex; gap: 14px; flex-wrap: wrap; align-items: flex-end; flex: 1;
  }
  @media (max-width: 480px) {
    .vms-filter-fields { gap: 10px; }
    .vms-filter-fields > div { flex: 1; min-width: 120px; }
  }

  /* Badges + print row */
  .vms-filters-right {
    display: flex; gap: 8px; align-items: center; margin-left: auto; flex-wrap: wrap;
  }
  @media (max-width: 640px) {
    .vms-filters-right { margin-left: 0; width: 100%; justify-content: space-between; }
    .vms-print-btn { flex: 1; text-align: center; }
  }
  @media (max-width: 380px) {
    .vms-filters-right { flex-direction: column; align-items: stretch; }
    .vms-badges { display: flex; gap: 8px; }
  }

  .vms-badge-blue {
    font-size: 11px; font-family: 'DM Mono', monospace;
    background: rgba(59,130,246,.12); border: 1px solid rgba(59,130,246,.25);
    color: #93C5FD; border-radius: 20px; padding: 4px 12px; font-weight: 700;
    white-space: nowrap;
  }
  .vms-badge-green {
    font-size: 11px; font-family: 'DM Mono', monospace;
    background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.22);
    color: #4ADE80; border-radius: 20px; padding: 4px 12px; font-weight: 700;
    white-space: nowrap;
  }

  /* ── Timetable container ── */
  .vms-timetable-wrap {
    background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.07);
    border-radius: 18px; overflow: hidden;
    animation: fadeSlideUp .5s ease .12s both;
    overflow-x: auto; /* allow horizontal scroll on small screens */
    -webkit-overflow-scrolling: touch;
  }
  @media (max-width: 640px) { .vms-timetable-wrap { border-radius: 12px; } }

  /* ── Empty state ── */
  .vms-empty {
    background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.08);
    border-radius: 18px; padding: 72px 24px; text-align: center;
    animation: fadeSlideUp .5s ease .1s both;
  }
  @media (max-width: 640px) { .vms-empty { padding: 48px 20px; border-radius: 14px; } }

  /* ── Error ── */
  .vms-error {
    background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.25);
    border-radius: 10px; padding: 11px 16px; margin-bottom: 20px;
    color: #FCA5A5; font-size: 13px; display: flex; gap: 8px; align-items: center;
    animation: fadeSlideUp .3s ease both; flex-wrap: wrap;
  }

  /* ── Eyebrow pill ── */
  .vms-pill {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.25);
    border-radius: 100px; padding: 4px 14px; margin-bottom: 16px;
  }

  @media print {
    .vms-filters, .vms-pill { display: none !important; }
    .vms-page { background: #fff !important; color: #000 !important; }
    .vms-timetable-wrap { border: none !important; overflow: visible !important; }
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
    <div className="vms-page">
      <style>{CSS}</style>

      {/* Ambient blobs */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"5%", left:"15%", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle,rgba(59,130,246,.07) 0%,transparent 70%)", filter:"blur(60px)", animation:"pulse-glow 10s ease infinite" }} />
        <div style={{ position:"absolute", bottom:"15%", right:"5%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(34,197,94,.05) 0%,transparent 70%)", filter:"blur(60px)", animation:"pulse-glow 8s ease infinite 3s" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)", backgroundSize:"60px 60px", maskImage:"radial-gradient(ellipse at 50% 20%,black 25%,transparent 75%)", WebkitMaskImage:"radial-gradient(ellipse at 50% 20%,black 25%,transparent 75%)" }} />
      </div>

      <div className="vms-inner">

        {/* Header */}
        <div style={{ marginBottom:30, animation:"fadeSlideUp .5s ease both" }}>
          <div className="vms-pill">
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#3B82F6", display:"inline-block", animation:"blink 2s ease infinite" }} />
            <span style={{ fontSize:10, fontWeight:700, color:"#93C5FD", letterSpacing:".12em", textTransform:"uppercase", fontFamily:"'DM Mono',monospace" }}>
              My Teaching Schedule
            </span>
          </div>
          <h1 className="vms-h1">{semLabel} Semester Timetable</h1>
          <p className="vms-sub">{user?.fullName} · {user?.departmentName || "—"}</p>
        </div>

        {/* Filters bar */}
        <div className="vms-filters">
          <div className="vms-filter-fields">
            <div>
              <label className="vms-filter-label">Semester</label>
              <select className="vms-select" value={term.semester} onChange={e=>setTerm(t=>({...t,semester:e.target.value}))}>
                {SEMESTERS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="vms-filter-label">School Year</label>
              <select className="vms-select" value={term.schoolYear} onChange={e=>setTerm(t=>({...t,schoolYear:e.target.value}))}>
                {years.map(y=><option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="vms-filters-right">
            {!loading && schedules.length > 0 && (
              <div className="vms-badges" style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span className="vms-badge-blue">{new Set(schedules.map(s=>s.subjectId)).size} subjects</span>
                <span className="vms-badge-green">{schedules.length} sessions</span>
              </div>
            )}
            <button className="vms-print-btn" onClick={()=>window.print()}>🖨 Print</button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="vms-error">⚠️ {error}</div>
        )}

        {/* Empty state */}
        {!loading && schedules.length === 0 && (
          <div className="vms-empty">
            <div style={{ fontSize:"clamp(36px,8vw,48px)", marginBottom:16 }}>📭</div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:"clamp(15px,3vw,18px)", color:"rgba(255,255,255,.5)", marginBottom:8 }}>No schedule found</div>
            <p style={{ color:"rgba(255,255,255,.25)", fontSize:"clamp(12px,2vw,14px)" }}>No published schedule for {semLabel} Semester {term.schoolYear}.</p>
          </div>
        )}

        {/* Timetable */}
        {(loading || schedules.length > 0) && (
          <div className="vms-timetable-wrap">
            <TimetableGrid schedules={schedules} loading={loading} />
          </div>
        )}

      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import useSchedule from "../../hooks/useSchedule";
import TimetableGrid from "../../components/schedule/TimetableGrid";

const SEMESTERS = [
  { value: "FIRST",  label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "SUMMER", label: "Summer" },
];

function getDefaultTerm() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();
  return {
    semester:   month >= 6 && month <= 10 ? "FIRST" : "SECOND",
    schoolYear: `${year}-${year + 1}`,
  };
}

const selStyle = {
  padding: "7px 12px", borderRadius: 8, border: "1.5px solid #d1d5db",
  fontSize: 13, color: "#111827", background: "#fff",
  fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
};
const lbl = { fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4, letterSpacing: "0.05em" };

export default function ViewTimetable() {
  const { user } = useAuth();
  const { schedules, loading, error, fetchMySchedule } = useSchedule();
  const defaults = getDefaultTerm();

  const [term, setTerm] = useState(defaults);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - 2 + i;
    return `${y}-${y + 1}`;
  });

  useEffect(() => {
    fetchMySchedule(
      term.semester,
      term.schoolYear,
      user?.sectionId ?? null,
      user?.isIrregular ? {
        courseId:   user?.courseId,
        yearLevel:  user?.yearLevel,
        section:    user?.section,
      } : null
    );
  }, [term.semester, term.schoolYear, user?.sectionId, fetchMySchedule]);

  return (
    <div style={{ padding: "1.5rem 1.5rem", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: 4 }}>
        My Class Schedule
      </h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
        {user?.courseCode} · Year {user?.yearLevel}
        {user?.isIrregular ? " · Irregular" : user?.section ? ` · Section ${user.section}` : ""}
      </p>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <label style={lbl}>SEMESTER</label>
          <select value={term.semester} onChange={e => setTerm(t => ({ ...t, semester: e.target.value }))} style={selStyle}>
            {SEMESTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>SCHOOL YEAR</label>
          <select value={term.schoolYear} onChange={e => setTerm(t => ({ ...t, schoolYear: e.target.value }))} style={selStyle}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button
          onClick={() => window.print()}
          style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, background: "#1B5E20", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, alignSelf: "flex-end" }}
        >
          🖨️ Print
        </button>
      </div>

      {error && (
        <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "#B91C1C", fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}

      {!loading && schedules.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p style={{ color: "#9ca3af", fontSize: 14 }}>No schedule found for this term.</p>
        </div>
      )}

      {(loading || schedules.length > 0) && (
        <TimetableGrid schedules={schedules} loading={loading} />
      )}
    </div>
  );
}
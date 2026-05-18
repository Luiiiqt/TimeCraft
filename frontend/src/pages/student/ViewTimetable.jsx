import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import useSchedule from "../../hooks/useSchedule";
import TimetableGrid from "../../components/schedule/TimetableGrid";
import api from "../../services/api";

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

  const [term, setTerm]       = useState(defaults);
  const [mode, setMode]       = useState("mine");   // "mine" | "browse"
  const [courses, setCourses] = useState([]);
  const [browseCourseId, setBrowseCourseId] = useState("");
  const [browseYearLevel, setBrowseYearLevel] = useState("");
  const [browseSchedules, setBrowseSchedules] = useState([]);
  const [browseLoading, setBrowseLoading]     = useState(false);
  const [browseError, setBrowseError]         = useState(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - 2 + i;
    return `${y}-${y + 1}`;
  });

  // Load courses once for browse mode
  useEffect(() => {
    api.get("/courses").then(r => setCourses(r.data?.data ?? r.data ?? [])).catch(() => {});
  }, []);

  // My schedule
  useEffect(() => {
    if (mode !== "mine") return;
    fetchMySchedule(
      term.semester,
      term.schoolYear,
      user?.sectionId ?? null,
      user?.isIrregular ? {
        courseId:  user?.courseId,
        yearLevel: user?.yearLevel,
        section:   user?.section,
      } : null
    );
  }, [mode, term.semester, term.schoolYear, user?.sectionId, fetchMySchedule]);

  // Browse schedules by course + year level
  useEffect(() => {
    if (mode !== "browse" || !browseCourseId) return;
    setBrowseLoading(true); setBrowseError(null);
    api.get("/schedules", { params: {
      courseId:   browseCourseId,
      semester:   term.semester,
      schoolYear: term.schoolYear,
    }})
      .then(r => {
        let data = r.data?.data ?? r.data ?? [];
        if (browseYearLevel) {
          data = data.filter(s => String(s.yearLevel) === String(browseYearLevel));
        }
        setBrowseSchedules(data);
      })
      .catch(e => setBrowseError(e?.response?.data?.message ?? "Failed to load schedules."))
      .finally(() => setBrowseLoading(false));
  }, [mode, browseCourseId, browseYearLevel, term.semester, term.schoolYear]);

  const isLoading   = mode === "mine" ? loading      : browseLoading;
  const isError     = mode === "mine" ? error        : browseError;
  const displayList = mode === "mine" ? schedules    : browseSchedules;

  return (
    <div style={{ padding: "1.5rem", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: 4 }}>
          {mode === "mine" ? "My Class Schedule" : "Browse Schedules"}
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14 }}>
          {mode === "mine"
            ? `${user?.courseCode ?? ""} · Year ${user?.yearLevel ?? ""}${user?.isIrregular ? " · Irregular" : user?.section ? ` · Section ${user.section}` : ""}`
            : "View the published schedule of any course."}
        </p>
      </div>

      {/* ── Mode toggle ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "#f3f4f6", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {[{ key: "mine", label: "📅 My Schedule" }, { key: "browse", label: "🔍 Browse All" }].map(m => (
          <button key={m.key} onClick={() => setMode(m.key)} style={{
            padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            background: mode === m.key ? "#fff" : "transparent",
            color: mode === m.key ? "#111827" : "#6b7280",
            boxShadow: mode === m.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.15s",
          }}>{m.label}</button>
        ))}
      </div>

      {/* ── Filters ── */}
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

        {/* Course + Year Level dropdowns — browse mode only */}
        {mode === "browse" && (
          <>
            <div>
              <label style={lbl}>COURSE</label>
              <select value={browseCourseId} onChange={e => { setBrowseCourseId(e.target.value); setBrowseYearLevel(""); setBrowseSchedules([]); }} style={{ ...selStyle, minWidth: 220 }}>
                <option value="">Select a course…</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name ?? c.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>YEAR LEVEL</label>
              <select value={browseYearLevel} onChange={e => setBrowseYearLevel(e.target.value)} style={selStyle} disabled={!browseCourseId}>
                <option value="">All Years</option>
                {[1, 2, 3, 4].map(y => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {mode === "mine" && (
          <button onClick={() => window.print()} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, background: "#1B5E20", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, alignSelf: "flex-end" }}>
            🖨️ Print
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {isError && (
        <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "#B91C1C", fontSize: 14 }}>
          ⚠️ {isError}
        </div>
      )}

      {/* ── Empty states ── */}
      {mode === "browse" && !browseCourseId && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
          <p style={{ color: "#9ca3af", fontSize: 14 }}>Select a course to view its schedule.</p>
        </div>
      )}

      {!isLoading && browseCourseId && displayList.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p style={{ color: "#9ca3af", fontSize: 14 }}>No schedule found for this term.</p>
        </div>
      )}

      {!isLoading && mode === "mine" && displayList.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p style={{ color: "#9ca3af", fontSize: 14 }}>No schedule found for this term.</p>
        </div>
      )}

      {(isLoading || displayList.length > 0) && (
        <TimetableGrid schedules={displayList} loading={isLoading} />
      )}
    </div>
  );
}
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

const timetableStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  /* Page wrapper */
  .tt-page { padding: 20px 16px 40px; font-family: 'DM Sans', sans-serif; }

  /* Mode toggle pill */
  .mode-toggle { display: flex; gap: 6px; background: #f3f4f6; border-radius: 10px; padding: 4px; width: fit-content; margin-bottom: 18px; }
  .mode-btn { padding: 7px 14px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }

  /* Filters bar */
  .filters-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; margin-bottom: 18px; }
  .filter-item { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 130px; max-width: 260px; }
  .filter-label { font-size: 10px; font-weight: 700; color: #6b7280; letter-spacing: 0.05em; text-transform: uppercase; font-family: 'DM Mono', monospace; }
  .filter-select {
    padding: 8px 10px; border-radius: 8px; border: 1.5px solid #d1d5db;
    font-size: 13px; color: #111827; background: #fff;
    font-family: 'DM Sans', sans-serif; cursor: pointer; width: 100%;
  }
  .filter-select:focus { outline: none; border-color: #6b7280; }

  /* Print button */
  .print-btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; background: #1B5E20; color: #fff; border: none; cursor: pointer; font-weight: 600; align-self: flex-end; white-space: nowrap; font-family: 'DM Sans', sans-serif; }

  /* Error alert */
  .tt-error { background: #FEE2E2; border: 1px solid #FCA5A5; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; color: #B91C1C; font-size: 13px; }

  /* Empty states */
  .tt-empty { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 40px 24px; text-align: center; }
  .tt-empty-icon { font-size: 36px; margin-bottom: 10px; }
  .tt-empty-text { color: #9ca3af; font-size: 14px; }

  /* Header */
  .tt-header { margin-bottom: 18px; }
  .tt-title { font-size: clamp(1.3rem, 5vw, 1.75rem); font-weight: 700; color: #111827; margin-bottom: 4px; }
  .tt-subtitle { color: #6b7280; font-size: clamp(12px, 2vw, 14px); }

  @media (min-width: 480px) {
    .tt-page { padding: 24px 20px 40px; }
    .filter-item { min-width: 150px; }
  }
  @media (min-width: 700px) {
    .tt-page { padding: 28px 28px 40px; }
  }
  @media (min-width: 900px) {
    .tt-page { padding: 32px 32px 48px; }
    .filter-item { flex: 0 1 auto; min-width: 160px; }
  }

  @media (max-width: 479px) {
    .mode-btn { padding: 6px 10px; font-size: 12px; }
    .filter-item { min-width: 100%; max-width: 100%; }
    .print-btn { width: 100%; text-align: center; }
  }
`;

export default function ViewTimetable() {
  const { user } = useAuth();
  const { schedules, loading, error, fetchMySchedule } = useSchedule();
  const defaults = getDefaultTerm();

  const [term, setTerm]       = useState(defaults);
  const [mode, setMode]       = useState("mine");
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

  useEffect(() => {
    api.get("/courses").then(r => setCourses(r.data?.data ?? r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (mode !== "mine") return;
    fetchMySchedule(
      term.semester,
      term.schoolYear,
      user?.sectionId ?? null,
      {
        courseId:  user?.courseId,
        yearLevel: user?.yearLevel,
        section:   user?.section,
      }
    );
  }, [mode, term.semester, term.schoolYear, user?.sectionId, fetchMySchedule]);

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
    <div className="tt-page">
      <style>{timetableStyles}</style>

      {/* ── Header ── */}
      <div className="tt-header">
        <h1 className="tt-title">
          {mode === "mine" ? "My Class Schedule" : "Browse Schedules"}
        </h1>
        <p className="tt-subtitle">
          {mode === "mine"
            ? `${user?.courseCode ?? ""} · Year ${user?.yearLevel ?? ""}${user?.isIrregular ? " · Irregular" : user?.section ? ` · Section ${user.section}` : ""}`
            : "View the published schedule of any course."}
        </p>
      </div>

      {/* ── Mode toggle ── */}
      <div className="mode-toggle">
        {[{ key: "mine", label: "📅 My Schedule" }, { key: "browse", label: "🔍 Browse All" }].map(m => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className="mode-btn"
            style={{
              background: mode === m.key ? "#fff" : "transparent",
              color: mode === m.key ? "#111827" : "#6b7280",
              boxShadow: mode === m.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            }}
          >{m.label}</button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="filters-bar">
        <div className="filter-item">
          <label className="filter-label">Semester</label>
          <select
            value={term.semester}
            onChange={e => setTerm(t => ({ ...t, semester: e.target.value }))}
            className="filter-select"
          >
            {SEMESTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="filter-item">
          <label className="filter-label">School Year</label>
          <select
            value={term.schoolYear}
            onChange={e => setTerm(t => ({ ...t, schoolYear: e.target.value }))}
            className="filter-select"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {mode === "browse" && (
          <>
            <div className="filter-item" style={{ maxWidth: 260 }}>
              <label className="filter-label">Course</label>
              <select
                value={browseCourseId}
                onChange={e => { setBrowseCourseId(e.target.value); setBrowseYearLevel(""); setBrowseSchedules([]); }}
                className="filter-select"
              >
                <option value="">Select a course…</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name ?? c.code}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label className="filter-label">Year Level</label>
              <select
                value={browseYearLevel}
                onChange={e => setBrowseYearLevel(e.target.value)}
                className="filter-select"
                disabled={!browseCourseId}
              >
                <option value="">All Years</option>
                {[1, 2, 3, 4].map(y => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {mode === "mine" && (
          <button onClick={() => window.print()} className="print-btn">
            🖨️ Print
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {isError && (
        <div className="tt-error">⚠️ {isError}</div>
      )}

      {/* ── Empty states ── */}
      {mode === "browse" && !browseCourseId && (
        <div className="tt-empty">
          <div className="tt-empty-icon">🎓</div>
          <p className="tt-empty-text">Select a course to view its schedule.</p>
        </div>
      )}

      {!isLoading && browseCourseId && displayList.length === 0 && (
        <div className="tt-empty">
          <div className="tt-empty-icon">📭</div>
          <p className="tt-empty-text">No schedule found for this term.</p>
        </div>
      )}

      {!isLoading && mode === "mine" && displayList.length === 0 && (
        <div className="tt-empty">
          <div className="tt-empty-icon">📭</div>
          <p className="tt-empty-text">No schedule found for this term.</p>
        </div>
      )}

      {(isLoading || displayList.length > 0) && (
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <TimetableGrid schedules={displayList} loading={isLoading} />
        </div>
      )}
    </div>
  );
}
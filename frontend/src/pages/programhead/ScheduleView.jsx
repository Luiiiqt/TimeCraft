import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import TimetableGrid from "../../components/schedule/TimetableGrid";

const SEMESTERS = [
  { value: "FIRST",  label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "SUMMER", label: "Summer" },
];
const SCHOOL_YEARS = ["2024-2025", "2025-2026", "2026-2027"];

function getDefaultTerm() {
  const m = new Date().getMonth() + 1;
  const y = new Date().getFullYear();
  return {
    semester: m >= 6 && m <= 10 ? "FIRST" : "SECOND",
    schoolYear: `${y}-${y + 1}`,
  };
}

export default function PHScheduleView() {
  const [params] = useSearchParams();
  const defaults = getDefaultTerm();

  const [courses,          setCourses]          = useState([]);
  const [activeCourseId,   setActiveCourseId]   = useState(params.get("courseId") ? Number(params.get("courseId")) : null);
  const [activeSemester,   setActiveSemester]   = useState(params.get("semester")   || defaults.semester);
  const [activeSchoolYear, setActiveSchoolYear] = useState(params.get("schoolYear") || defaults.schoolYear);
  const [sections,         setSections]         = useState([]);
  const [sectionId,        setSectionId]        = useState(null);
  const [schedules,        setSchedules]        = useState([]);
  const [loading,          setLoading]          = useState(false);

  useEffect(() => {
    const isGE = window.location.pathname.startsWith("/ge");
    const endpoint = isGE ? "/courses" : "/program-head/my-courses";
    api.get(endpoint)
      .then(r => {
        const list = r.data?.data ?? [];
        setCourses(list);
        if (!activeCourseId && list.length > 0) setActiveCourseId(list[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeCourseId) return;
    api.get(`/sections`, { params: { courseId: activeCourseId, semester: activeSemester, schoolYear: activeSchoolYear } })
      .then(r => {
        const list = r.data?.data ?? [];
        setSections(list);
        setSectionId(list.length > 0 ? list[0].id : null);
      })
      .catch(() => setSections([]));
  }, [activeCourseId, activeSemester, activeSchoolYear]);

  useEffect(() => {
    if (!sectionId) return;
    setLoading(true);
    api.get(`/schedules/published/section/${sectionId}`, { params: { semester: activeSemester, schoolYear: activeSchoolYear } })
      .then(r => setSchedules(r.data?.data ?? []))
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false));
  }, [sectionId, activeSemester, activeSchoolYear]);

  return (
    <div className="phsv-root">
      <style>{`
        .phsv-root {
          padding: clamp(1rem, 4vw, 1.5rem);
          font-family: 'DM Sans', sans-serif;
          box-sizing: border-box;
        }

        .phsv-title {
          font-size: clamp(1.25rem, 4vw, 1.75rem);
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }

        .phsv-subtitle {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        /* Filters */
        .phsv-filters {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: flex-end;
          margin-bottom: 20px;
        }

        .phsv-filter-group {
          display: flex;
          flex-direction: column;
          min-width: 130px;
          flex: 1 1 130px;
          max-width: 220px;
        }

        .phsv-filter-group label {
          font-size: 10px;
          font-weight: 700;
          color: #6b7280;
          margin-bottom: 4px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .phsv-filter-group select {
          padding: 7px 12px;
          border-radius: 8px;
          border: 1.5px solid #d1d5db;
          font-size: 13px;
          color: #111827;
          background: #fff;
          width: 100%;
        }

        .phsv-filter-group select:focus {
          outline: none;
          border-color: #1565C0;
        }

        /* Empty state */
        .phsv-empty {
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          padding: clamp(32px, 6vw, 48px);
          text-align: center;
        }

        .phsv-empty-icon { font-size: clamp(32px, 6vw, 40px); margin-bottom: 12px; }
        .phsv-empty-text { color: #9ca3af; font-size: 14px; }

        /* Tablet (≤768px) */
        @media (max-width: 768px) {
          .phsv-filter-group {
            max-width: none;
            min-width: 110px;
          }

          .phsv-filters {
            gap: 8px;
          }
        }

        /* Mobile (≤480px) */
        @media (max-width: 480px) {
          .phsv-filters {
            flex-direction: column;
            align-items: stretch;
          }

          .phsv-filter-group {
            max-width: 100%;
            flex: 1 1 auto;
          }
        }
      `}</style>

      <h1 className="phsv-title">Schedule View</h1>
      <p className="phsv-subtitle">View the timetable for your managed courses.</p>

      {/* Filters */}
      <div className="phsv-filters">
        {courses.length > 0 && (
          <div className="phsv-filter-group">
            <label>Course</label>
            <select value={activeCourseId ?? ""} onChange={e => setActiveCourseId(Number(e.target.value))}>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
        )}
        <div className="phsv-filter-group">
          <label>Semester</label>
          <select value={activeSemester} onChange={e => { setActiveSemester(e.target.value); setSectionId(null); }}>
            {SEMESTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="phsv-filter-group">
          <label>School Year</label>
          <select value={activeSchoolYear} onChange={e => { setActiveSchoolYear(e.target.value); setSectionId(null); }}>
            {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {sections.length > 0 && (
          <div className="phsv-filter-group">
            <label>Section</label>
            <select value={sectionId ?? ""} onChange={e => setSectionId(Number(e.target.value))}>
              {sections.map(s => <option key={s.id} value={s.id}>Year {s.yearLevel}-{s.sectionName}</option>)}
            </select>
          </div>
        )}
      </div>

      {!loading && schedules.length === 0 && (
        <div className="phsv-empty">
          <div className="phsv-empty-icon">📭</div>
          <p className="phsv-empty-text">No schedule found for this section and term.</p>
        </div>
      )}

      {(loading || schedules.length > 0) && (
        <TimetableGrid schedules={schedules} loading={loading} />
      )}
    </div>
  );
}
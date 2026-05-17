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

const lbl = { fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4, letterSpacing: "0.05em" };
const sel = { padding: "7px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 13, color: "#111827", background: "#fff" };

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
    <div style={{ padding: "1.5rem 1.5rem", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: 4 }}>
        Schedule View
      </h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
        View the timetable for your managed courses.
      </p>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 20 }}>
        {courses.length > 0 && (
          <div>
            <label style={lbl}>COURSE</label>
            <select value={activeCourseId ?? ""} onChange={e => setActiveCourseId(Number(e.target.value))} style={sel}>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label style={lbl}>SEMESTER</label>
          <select value={activeSemester} onChange={e => { setActiveSemester(e.target.value); setSectionId(null); }} style={sel}>
            {SEMESTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>SCHOOL YEAR</label>
          <select value={activeSchoolYear} onChange={e => { setActiveSchoolYear(e.target.value); setSectionId(null); }} style={sel}>
            {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {sections.length > 0 && (
          <div>
            <label style={lbl}>SECTION</label>
            <select value={sectionId ?? ""} onChange={e => setSectionId(Number(e.target.value))} style={sel}>
              {sections.map(s => <option key={s.id} value={s.id}>Year {s.yearLevel}-{s.sectionName}</option>)}
            </select>
          </div>
        )}
      </div>

      {!loading && schedules.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p style={{ color: "#9ca3af", fontSize: 14 }}>No schedule found for this section and term.</p>
        </div>
      )}

      {(loading || schedules.length > 0) && (
        <TimetableGrid schedules={schedules} loading={loading} />
      )}
    </div>
  );
}
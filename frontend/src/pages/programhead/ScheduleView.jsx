import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import TimetableGrid from "../../components/schedule/TimetableGrid";

export default function ScheduleView() {
  const [params] = useSearchParams();
  const courseId   = params.get("courseId");
  const semester   = params.get("semester");
  const schoolYear = params.get("schoolYear");

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading]     = useState(true);

  // DEBUG — remove after fixing
  console.log("PARAMS:", { courseId, semester, schoolYear });
  console.log("SAMPLE SCHEDULE:", schedules[0]);
  const [sections, setSections]   = useState([]);
  const [sectionId, setSectionId] = useState(null);

  useEffect(() => {
    if (!courseId || !semester || !schoolYear) return;
    api.get(`/sections?courseId=${courseId}`)
      .then(r => {
        const list = r.data?.data ?? [];
        setSections(list);
        if (list.length > 0) setSectionId(list[0].id);
      })
      .catch(() => setLoading(false));
  }, [courseId, semester, schoolYear]);

  useEffect(() => {
    if (!sectionId) return;
    setLoading(true);
    api.get(`/schedules/section/${sectionId}?semester=${semester}&schoolYear=${schoolYear}`)
      .then(r => { setSchedules(r.data?.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sectionId, semester, schoolYear]);

  return (
    <div style={{ padding: "2rem 2.5rem", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: 4 }}>
        Generated Schedule
      </h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
        {semester} · {schoolYear}
      </p>

      {sections.length > 1 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginRight: 8 }}>SECTION</label>
          <select value={sectionId ?? ""} onChange={e => setSectionId(Number(e.target.value))}
            style={{ padding: "6px 12px", borderRadius: 7, border: "1.5px solid #d1d5db", fontSize: 13 }}>
            {sections.map(s => (
              <option key={s.id} value={s.id}>Year {s.yearLevel}-{s.sectionName}</option>
            ))}
          </select>
        </div>
      )}

      <TimetableGrid schedules={schedules} loading={loading} />
    </div>
  );
}
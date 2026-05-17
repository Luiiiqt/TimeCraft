import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import TimetableGrid from "../../components/schedule/TimetableGrid";

export default function ScheduleView() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  function getDefaultTerm() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const semester = month >= 6 && month <= 10 ? "FIRST" : "SECOND";
    return { semester, schoolYear: `${year}-${year + 1}` };
  }
  const defaults = getDefaultTerm();

  const courseId = params.get("courseId");

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [activeCourseId, setActiveCourseId] = useState(courseId ? Number(courseId) : null);
  const [activeSemester, setActiveSemester] = useState(
    params.get("semester") || defaults.semester
  );
  const [activeSchoolYear, setActiveSchoolYear] = useState(
    params.get("schoolYear") || defaults.schoolYear
  );

  useEffect(() => {
    api.get("/dean/my-courses")
      .then(r => {
        const list = r.data?.data ?? [];
        setCourses(list);
        if (!activeCourseId && list.length > 0) setActiveCourseId(list[0].id);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (!activeCourseId || !activeSemester || !activeSchoolYear) return;
    // Clear immediately so old schedules don't show while loading
    setSchedules([]);
    setSections([]);
    setSectionId(null);
    api.get(`/sections`, { params: { courseId: activeCourseId, semester: activeSemester, schoolYear: activeSchoolYear } })
      .then(r => {
        const list = r.data?.data ?? [];
        const filtered = list.filter(s =>
          (s.schoolYear === activeSchoolYear || !s.schoolYear) &&
          s.courseId === activeCourseId
        );
        const final = filtered.length > 0 ? filtered : list.filter(s => s.courseId === activeCourseId);
        setSections(final);
        const sorted = [...final].sort((a, b) => a.yearLevel - b.yearLevel);
        const firstWithSchedules = sorted.find(s => s.hasSchedules) ?? sorted[0];
        setSectionId(firstWithSchedules ? firstWithSchedules.id : null);
      })
      .catch(() => { setLoading(false); setSchedules([]); });
  }, [activeCourseId, activeSemester, activeSchoolYear]);

  useEffect(() => {
    if (!sectionId) { setSchedules([]); setLoading(false); return; }
    setLoading(true);
    api.get(`/schedules/section/${sectionId}`, { params: { semester: activeSemester, schoolYear: activeSchoolYear } })
      .then(r => {
        const all = r.data?.data ?? []
        const currentSection = sections.find(s => s.id === sectionId)
        const currentCourseCode = currentSection?.courseCode ?? currentSection?.course?.code ?? ''
        // Only show entries for this section, plus shared BSCS rows if viewing BSIT
        const filtered = all.filter(s =>
          s.sectionId === sectionId ||
          (currentCourseCode === 'BSIT' && s.courseCode === 'BSCS')
        )
        setSchedules(filtered)
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sectionId, activeSemester, activeSchoolYear, sections]);

  return (
    <div style={{ padding: "1.5rem 1.5rem", fontFamily: "'DM Sans', sans-serif", maxWidth: "100%", boxSizing: "border-box" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: 4 }}>
        Generated Schedule
      </h1>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 3 }}>SEMESTER</label>
          <select value={activeSemester} onChange={e => { setActiveSemester(e.target.value); setSectionId(null); }}
            style={{ padding: "6px 12px", borderRadius: 7, border: "1.5px solid #d1d5db", fontSize: 13 }}>
            <option value="FIRST">1st Semester</option>
            <option value="SECOND">2nd Semester</option>
            <option value="SUMMER">Summer</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 3 }}>SCHOOL YEAR</label>
          <select value={activeSchoolYear} onChange={e => { setActiveSchoolYear(e.target.value); setSectionId(null); }}
            style={{ padding: "6px 12px", borderRadius: 7, border: "1.5px solid #d1d5db", fontSize: 13 }}>
            {["2024-2025", "2025-2026", "2026-2027", "2027-2028"].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        {courses.length > 1 && (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginRight: 8 }}>COURSE</label>
            <select value={activeCourseId ?? ""} onChange={e => { setActiveCourseId(Number(e.target.value)); setSectionId(null); setSections([]); }}
              style={{ padding: "6px 12px", borderRadius: 7, border: "1.5px solid #d1d5db", fontSize: 13 }}>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
          </div>
        )}
        {sections.length > 0 && (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginRight: 8 }}>SECTION</label>
            <select value={sectionId ?? ""} onChange={e => setSectionId(Number(e.target.value))}
              style={{ padding: "6px 12px", borderRadius: 7, border: "1.5px solid #d1d5db", fontSize: 13 }}>
              {sections.map(s => (
                <option key={s.id} value={s.id}>Year {s.yearLevel} — {s.sectionName}</option>
              ))}
            </select>
          </div>
        )}
          {schedules.length > 0 && schedules.every(s => s.status !== "CONFLICTED") && schedules.some(s => s.status === "DRAFT") && (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={publishing}
            style={{
              padding: "7px 18px", borderRadius: 8, fontSize: 13,
              background: publishing ? "#9ca3af" : "#1565C0", color: "#fff",
              border: "none", cursor: publishing ? "not-allowed" : "pointer", fontWeight: 600,
            }}>
            {publishing ? "Publishing…" : "🚀 Publish Schedule"}
          </button>
        )}
        {publishMsg && (
          <span style={{ fontSize: 13, fontWeight: 600, color: publishMsg.type === "success" ? "#15803d" : "#dc2626" }}>
            {publishMsg.text}
          </span>
        )}
        <button
          onClick={() => navigate(`/dean/schedule-print?courseId=${activeCourseId}&semester=${activeSemester}&schoolYear=${activeSchoolYear}`)}
          style={{
            padding: "7px 16px", borderRadius: 8, fontSize: 13,
            background: "#1B5E20", color: "#fff", border: "none",
            cursor: "pointer", fontWeight: 600,
          }}>
          Open Printable View
        </button>
      </div>

      {/* ── Publish confirm modal ── */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: 14, padding: '28px 32px',
            maxWidth: 420, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              Publish Schedule
            </div>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 1.6 }}>
              Are you sure you want to publish all schedules for this term?
              <br /><strong style={{ color: '#B91C1C' }}>This cannot be undone.</strong>
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '9px 20px', borderRadius: 8, fontSize: 13,
                  background: '#F9FAFB', color: '#374151',
                  border: '1.5px solid #D1D5DB', cursor: 'pointer', fontWeight: 600,
                }}>
                Cancel
              </button>
              <button
                disabled={publishing}
                onClick={async () => {
                  setShowConfirm(false);
                  setPublishing(true);
                  setPublishMsg(null);
                  try {
                    await api.put("/schedules/publish-all", null, {
                      params: { semester: activeSemester, schoolYear: activeSchoolYear }
                    });
                    setPublishMsg({ type: "success", text: "Schedule published successfully!" });
                    const r = await api.get(`/schedules/section/${sectionId}`, { params: { semester: activeSemester, schoolYear: activeSchoolYear } });
                    setSchedules(r.data?.data ?? []);
                  } catch (e) {
                    setPublishMsg({ type: "error", text: e?.response?.data?.message ?? "Publish failed." });
                  } finally {
                    setPublishing(false);
                  }
                }}
                style={{
                  padding: '9px 20px', borderRadius: 8, fontSize: 13,
                  background: '#1565C0', color: '#fff',
                  border: 'none', cursor: 'pointer', fontWeight: 600,
                }}>
                Yes, Publish
              </button>
            </div>
          </div>
        </div>
      )}

      <TimetableGrid schedules={schedules} loading={loading} />
    </div>

  );


}
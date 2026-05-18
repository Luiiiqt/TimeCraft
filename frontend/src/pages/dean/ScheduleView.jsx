import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import TimetableGrid from "../../components/schedule/TimetableGrid";

export default function ScheduleView() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  function getDefaultTerm() {
    const now = new Date(), month = now.getMonth() + 1, year = now.getFullYear();
    return { semester: month >= 6 && month <= 10 ? "FIRST" : "SECOND", schoolYear: `${year}-${year + 1}` };
  }
  const defaults = getDefaultTerm();
  const courseId = params.get("courseId");

  const [schedules,        setSchedules]        = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [publishing,       setPublishing]       = useState(false);
  const [publishMsg,       setPublishMsg]       = useState(null);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [sections,         setSections]         = useState([]);
  const [sectionId,        setSectionId]        = useState(null);
  const [courses,          setCourses]          = useState([]);
  const [activeCourseId,   setActiveCourseId]   = useState(courseId ? Number(courseId) : null);
  const [activeSemester,   setActiveSemester]   = useState(params.get("semester")   || defaults.semester);
  const [activeSchoolYear, setActiveSchoolYear] = useState(params.get("schoolYear") || defaults.schoolYear);

  useEffect(() => {
    api.get("/dean/my-courses").then(r => {
      const list = r.data?.data ?? [];
      setCourses(list);
      if (!activeCourseId && list.length > 0) setActiveCourseId(list[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeCourseId || !activeSemester || !activeSchoolYear) return;
    setSchedules([]); setSections([]); setSectionId(null);
    api.get(`/sections`, { params: { courseId: activeCourseId, semester: activeSemester, schoolYear: activeSchoolYear } })
      .then(r => {
        const list = r.data?.data ?? [];
        const filtered = list.filter(s => (s.schoolYear === activeSchoolYear || !s.schoolYear) && s.courseId === activeCourseId);
        const final = filtered.length > 0 ? filtered : list.filter(s => s.courseId === activeCourseId);
        setSections(final);
        const sorted = [...final].sort((a, b) => a.yearLevel - b.yearLevel);
        const firstWithSchedules = sorted.find(s => s.hasSchedules) ?? sorted[0];
        setSectionId(firstWithSchedules ? firstWithSchedules.id : null);
      }).catch(() => { setLoading(false); setSchedules([]); });
  }, [activeCourseId, activeSemester, activeSchoolYear]);

  useEffect(() => {
    if (!sectionId) { setSchedules([]); setLoading(false); return; }
    setLoading(true);
    api.get(`/schedules/section/${sectionId}`, { params: { semester: activeSemester, schoolYear: activeSchoolYear } })
      .then(r => {
        const all = r.data?.data ?? [];
        const currentSection = sections.find(s => s.id === sectionId);
        const currentCourseCode = currentSection?.courseCode ?? currentSection?.course?.code ?? '';
        const filtered = all.filter(s => s.sectionId === sectionId || (currentCourseCode === 'BSIT' && s.courseCode === 'BSCS'));
        setSchedules(filtered); setLoading(false);
      }).catch(() => setLoading(false));
  }, [sectionId, activeSemester, activeSchoolYear, sections]);

  const canPublish = schedules.length > 0 && schedules.every(s => s.status !== "CONFLICTED") && schedules.some(s => s.status === "DRAFT");

  return (
    <div className="sv-root">
      <style>{`
        .sv-root {
          padding: clamp(1rem, 4vw, 1.5rem);
          font-family: 'DM Sans', sans-serif;
          max-width: 100%;
          box-sizing: border-box;
        }

        .sv-title {
          font-size: clamp(1.25rem, 4vw, 1.75rem);
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }

        /* ── Filter bar ── */
        .sv-filters-row {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .sv-filter-group {
          display: flex;
          flex-direction: column;
          min-width: 130px;
          flex: 1 1 130px;
          max-width: 220px;
        }

        .sv-filter-group label {
          font-size: 10px;
          font-weight: 700;
          color: #6b7280;
          margin-bottom: 4px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .sv-filter-group select {
          padding: 7px 10px;
          border-radius: 8px;
          border: 1.5px solid #d1d5db;
          font-size: 13px;
          color: #111827;
          background: #fff;
          width: 100%;
          appearance: auto;
        }

        .sv-filter-group select:focus {
          outline: none;
          border-color: #1565C0;
        }

        /* ── Controls row ── */
        .sv-controls-row {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .sv-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          border: none;
          line-height: 1.4;
          flex-shrink: 0;
          transition: opacity 0.15s, transform 0.1s;
        }

        .sv-btn:active { transform: scale(0.97); }

        .sv-publish-msg {
          font-size: 13px;
          font-weight: 600;
          align-self: center;
        }

        /* ── Confirm modal ── */
        .sv-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .sv-modal-box {
          background: #fff;
          border-radius: 14px;
          padding: clamp(20px, 5vw, 28px) clamp(20px, 5vw, 32px);
          max-width: 420px;
          width: 100%;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        }

        .sv-modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }

        .sv-modal-body {
          font-size: 14px;
          color: #6B7280;
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .sv-modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .sv-modal-actions button {
          padding: 9px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        /* ── Responsive breakpoints ── */

        /* Tablet (≤768px) */
        @media (max-width: 768px) {
          .sv-filters-row,
          .sv-controls-row {
            gap: 8px;
          }

          .sv-filter-group {
            min-width: 110px;
            max-width: none;
          }

          .sv-btn {
            font-size: 12px;
            padding: 7px 13px;
          }
        }

        /* Mobile (≤480px) */
        @media (max-width: 480px) {
          .sv-filters-row,
          .sv-controls-row {
            flex-direction: column;
            align-items: stretch;
          }

          .sv-filter-group {
            max-width: 100%;
            flex: 1 1 auto;
          }

          .sv-filter-group select {
            width: 100%;
          }

          .sv-btn {
            width: 100%;
            text-align: center;
            font-size: 13px;
            padding: 10px 16px;
          }

          .sv-publish-msg {
            text-align: center;
          }

          .sv-modal-actions {
            flex-direction: column-reverse;
          }

          .sv-modal-actions button {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>

      <h1 className="sv-title">Generated Schedule</h1>

      {/* Semester + Year filters */}
      <div className="sv-filters-row">
        <div className="sv-filter-group">
          <label>Semester</label>
          <select value={activeSemester} onChange={e => { setActiveSemester(e.target.value); setSectionId(null); }}>
            <option value="FIRST">1st Semester</option>
            <option value="SECOND">2nd Semester</option>
            <option value="SUMMER">Summer</option>
          </select>
        </div>
        <div className="sv-filter-group">
          <label>School Year</label>
          <select value={activeSchoolYear} onChange={e => { setActiveSchoolYear(e.target.value); setSectionId(null); }}>
            {["2024-2025", "2025-2026", "2026-2027", "2027-2028"].map(y =>
              <option key={y} value={y}>{y}</option>
            )}
          </select>
        </div>
      </div>

      {/* Course + Section + Actions */}
      <div className="sv-controls-row">
        {courses.length > 1 && (
          <div className="sv-filter-group">
            <label>Course</label>
            <select value={activeCourseId ?? ""} onChange={e => { setActiveCourseId(Number(e.target.value)); setSectionId(null); setSections([]); }}>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
          </div>
        )}
        {sections.length > 0 && (
          <div className="sv-filter-group">
            <label>Section</label>
            <select value={sectionId ?? ""} onChange={e => setSectionId(Number(e.target.value))}>
              {sections.map(s => <option key={s.id} value={s.id}>Year {s.yearLevel} — {s.sectionName}</option>)}
            </select>
          </div>
        )}

        {canPublish && (
          <button
            className="sv-btn"
            onClick={() => setShowConfirm(true)}
            disabled={publishing}
            style={{ background: publishing ? "#9ca3af" : "#1565C0", color: "#fff" }}
          >
            {publishing ? "Publishing…" : "🚀 Publish Schedule"}
          </button>
        )}

        <button
          className="sv-btn"
          onClick={() => navigate(`/dean/schedule-print?courseId=${activeCourseId}&semester=${activeSemester}&schoolYear=${activeSchoolYear}`)}
          style={{ background: "#1B5E20", color: "#fff" }}
        >
          🖨 Printable View
        </button>

        {publishMsg && (
          <span className="sv-publish-msg" style={{ color: publishMsg.type === "success" ? "#15803d" : "#dc2626" }}>
            {publishMsg.text}
          </span>
        )}
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="sv-modal-overlay">
          <div className="sv-modal-box">
            <div className="sv-modal-title">Publish Schedule</div>
            <p className="sv-modal-body">
              Are you sure you want to publish all schedules for this term?<br />
              <strong style={{ color: '#B91C1C' }}>This cannot be undone.</strong>
            </p>
            <div className="sv-modal-actions">
              <button
                onClick={() => setShowConfirm(false)}
                style={{ background: '#F9FAFB', color: '#374151', border: '1.5px solid #D1D5DB' }}
              >
                Cancel
              </button>
              <button
                disabled={publishing}
                onClick={async () => {
                  setShowConfirm(false); setPublishing(true); setPublishMsg(null);
                  try {
                    await api.put("/schedules/publish-all", null, { params: { semester: activeSemester, schoolYear: activeSchoolYear } });
                    setPublishMsg({ type: "success", text: "Schedule published successfully!" });
                    const r = await api.get(`/schedules/section/${sectionId}`, { params: { semester: activeSemester, schoolYear: activeSchoolYear } });
                    setSchedules(r.data?.data ?? []);
                  } catch (e) {
                    setPublishMsg({ type: "error", text: e?.response?.data?.message ?? "Publish failed." });
                  } finally { setPublishing(false); }
                }}
                style={{ background: '#1565C0', color: '#fff', border: 'none' }}
              >
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
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

const SEMESTER_OPTIONS = [
  { value: "FIRST", label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "SUMMER", label: "Summer" },
];
const SCHOOL_YEARS = ["2024-2025", "2025-2026", "2026-2027"];

export default function ProgramHeadGenerateSchedule() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    semester: "FIRST",
    schoolYear: "2024-2025",
    autoPublish: false,
    courseId: null,
  });
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.get("/dean/my-courses")
      .then(r => {
        const list = r.data?.data ?? [];
        setCourses(list);
        if (list.length > 0) setForm(f => ({ ...f, courseId: list[0].id }));
      })
      .catch(() => { });
  }, []);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [readiness, setReadiness] = useState([]);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockChecking, setLockChecking] = useState(false);
  const [sectionConfigs, setSectionConfigs] = useState({ 1: 1, 2: 1, 3: 1, 4: 1 });
  const [savingConfig, setSavingConfig] = useState(false);

  const checkLock = async (courseId, semester, schoolYear) => {
    if (!courseId) return;
    setLockChecking(true);
    try {
      const res = await api.get(`/schedules/is-locked?courseId=${courseId}&semester=${semester}&schoolYear=${schoolYear}`);
      setIsLocked(res.data?.data ?? false);
    } catch { setIsLocked(false); }
    finally { setLockChecking(false); }
  };

  const checkReadiness = async (semester, schoolYear) => {
    setReadinessLoading(true);
    try {
      const res = await api.get(`/dean/readiness?semester=${semester}&schoolYear=${schoolYear}`);
      setReadiness(res.data?.data ?? []);
    } catch { setReadiness([]); }
    finally { setReadinessLoading(false); }
  };

  useEffect(() => {
    if (form.courseId) {
      checkLock(form.courseId, form.semester, form.schoolYear);
      checkReadiness(form.semester, form.schoolYear);
      api.get(`/sections/config?courseId=${form.courseId}&semester=${form.semester}&schoolYear=${form.schoolYear}`)
        .then(r => {
          const list = r.data?.data ?? [];
          const map = { 1: 1, 2: 1, 3: 1, 4: 1 };
          list.forEach(c => { map[c.yearLevel] = c.sectionCount; });
          setSectionConfigs(map);
        })
        .catch(() => { });
    }
  }, [form.courseId, form.semester, form.schoolYear]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : name === "courseId" ? Number(value) : value }));
    setResult(null); setError(""); setConfirmed(false);
  };

  const handleGenerate = async () => {
    setError(""); setResult(null); setLoading(true);
    try {
      const res = await api.post(`/schedules/generate`, {
        semester: form.semester,
        schoolYear: form.schoolYear,
        autoPublish: form.autoPublish,
        clearDraftsFirst: true,
      });
      setResult(res.data?.data ?? res.data);
    } catch (e) {
      setError(e.response?.data?.message ?? "Schedule generation failed.");
    } finally {
      setLoading(false);
      setConfirmed(false);
    }
  };

  const handleSaveConfigs = async () => {
    setSavingConfig(true);
    try {
      for (const course of courses) {
        for (const yearLevel of [1, 2, 3, 4]) {
          await api.post("/sections/config", {
            courseId: course.id,
          yearLevel,
          sectionCount: sectionConfigs[yearLevel],
            semester: form.semester,
            schoolYear: form.schoolYear,
          });
        }
      }
    } catch (e) {
      setError(e.response?.data?.message ?? "Failed to save section config.");
    } finally {
      setSavingConfig(false);
    }
  };

  const semLabel = SEMESTER_OPTIONS.find(s => s.value === form.semester)?.label;

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 900, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: 4 }}>
        Generate Schedule
      </h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 8 }}>
        {user?.departmentName} · Only finalized assignments will be used.
      </p>

      {/* Readiness report */}
      {readinessLoading ? (
        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 16px", marginBottom: 24, fontSize: 13, color: "#6b7280" }}>
          Checking readiness…
        </div>
      ) : readiness.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {readiness.map(r => (
            <div key={r.courseId} style={{
              background: r.ready ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${r.ready ? "#bbf7d0" : "#fecaca"}`,
              borderRadius: 10, padding: "10px 16px", marginBottom: 8,
              fontSize: 13, color: r.ready ? "#14532d" : "#7f1d1d",
              display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <span>{r.ready ? "✅" : "❌"}</span>
              <div>
                <strong>{r.courseCode}</strong> — {r.courseName}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Config panel */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "22px 24px", border: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 18 }}>Term Configuration</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Semester</label>
              <select name="semester" value={form.semester} onChange={handleChange}
                style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
                {SEMESTER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>School Year</label>
              <select name="schoolYear" value={form.schoolYear} onChange={handleChange}
                style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
                {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Sections per Year Level</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[1, 2, 3, 4].map(y => (
                  <div key={y} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <label style={{ fontSize: 12, color: "#6b7280", width: 40 }}>Yr {y}</label>
                    <input type="number" min={1} max={10} value={sectionConfigs[y]}
                      onChange={e => setSectionConfigs(p => ({ ...p, [y]: Number(e.target.value) }))}
                      style={{ width: "100%", padding: "6px 8px", border: "1.5px solid #d1d5db", borderRadius: 7, fontSize: 13 }} />
                  </div>
                ))}
              </div>
              <button onClick={handleSaveConfigs} disabled={savingConfig}
                style={{ marginTop: 8, width: "100%", padding: "7px", background: savingConfig ? "#93c5fd" : "#0e9f6e", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {savingConfig ? "Saving…" : "Save Section Config"}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" id="autoPublish" name="autoPublish"
                checked={form.autoPublish} onChange={handleChange}
                style={{ width: 15, height: 15, accentColor: "#7c3aed" }} />
              <label htmlFor="autoPublish" style={{ fontSize: 13, color: "#374151", cursor: "pointer" }}>
                Auto-publish if no conflicts
              </label>
            </div>
          </div>

          {isLocked && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 12 }}>
              🔒 A published schedule already exists for this course and term. Generation is locked.
            </div>
          )}

          {!confirmed ? (
            <button onClick={() => setConfirmed(true)}
              disabled={loading || isLocked || lockChecking || readiness.length === 0 || readiness.some(r => !r.ready)}
              style={{
                width: "100%", padding: "10px",
                background: (isLocked || readiness.some(r => !r.ready)) ? "#9ca3af" : "#7c3aed",
                color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700,
                cursor: (isLocked || readiness.some(r => !r.ready)) ? "not-allowed" : "pointer"
              }}>
              {lockChecking ? "Checking…" : readiness.length === 0 ? "Loading Readiness…" : readiness.some(r => !r.ready) ? "Not Ready — Fix Assignments First" : "Review & Generate"}
            </button>
          ) : (
            <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: "14px" }}>
              <p style={{ fontSize: 13, color: "#92400e", marginBottom: 12 }}>
                ⚠️ This will replace existing <strong>draft</strong> schedules for <strong>{semLabel} {form.schoolYear}</strong>.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setConfirmed(false)} disabled={loading}
                  style={{ flex: 1, padding: "8px", background: "#fff", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13, cursor: "pointer", color: "#6b7280", fontWeight: 600 }}>
                  Cancel
                </button>
                <button onClick={handleGenerate} disabled={loading}
                  style={{ flex: 1, padding: "8px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {loading ? "Generating…" : "Confirm & Generate"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Result panel */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "22px 24px", border: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 18 }}>Generation Result</h2>

          {!result && !loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, color: "#9ca3af", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
              <div style={{ fontSize: 14 }}>Results will appear here.</div>
            </div>
          )}

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, color: "#6b7280" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <div style={{ fontSize: 14 }}>Running scheduling engine…</div>
            </div>
          )}

          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, textAlign: "center", paddingBottom: 16, borderBottom: "1px solid #f3f4f6" }}>
                {[
                  { label: "Total", value: result.total, color: "#1a56db" },
                  { label: "Successful", value: result.successful, color: "#16a34a" },
                  { label: "Conflicts", value: result.conflicted, color: result.conflicted > 0 ? "#dc2626" : "#16a34a" },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div style={{ display: "flex", gap: 8 }}>
                {[result.semester ?? form.semester, result.schoolYear ?? form.schoolYear].map(t => (
                  <span key={t} style={{ padding: "3px 10px", background: "#f3f4f6", borderRadius: 99, fontSize: 12, color: "#374151", fontWeight: 600 }}>{t}</span>
                ))}
              </div>

              {/* Status */}
              {result.conflicted === 0 ? (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", color: "#14532d", fontSize: 13 }}>
                  ✓ Schedule generated with no conflicts.{form.autoPublish && " Published."}
                </div>
              ) : (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#7f1d1d", fontSize: 13 }}>
                  ⚠️ {result.conflicted} conflict(s) detected. Review with your admin.
                </div>
              )}

              {/* View Schedule button */}
              {result && (
                <button
                                    onClick={() => navigate(`/dean/schedule-view?semester=${form.semester}&schoolYear=${form.schoolYear}`)}
                  style={{ width: "100%", padding: "10px", background: "#1a56db", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
                  📅 View Generated Schedule
                </button>
              )}

              {/* AI Summary */}
              {result.aiSummary && result.aiSummary !== "AI summary unavailable." && (
                <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", marginBottom: 6 }}>🤖 AI Summary</div>
                  <p style={{ fontSize: 13, color: "#0c4a6e", lineHeight: 1.6, margin: 0 }}>{result.aiSummary}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
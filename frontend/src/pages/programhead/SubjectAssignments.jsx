import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

const SEMESTER_OPTIONS = [
  { value: "FIRST",  label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "SUMMER", label: "Summer" },
];
const SCHOOL_YEARS = ["2024-2025", "2025-2026", "2026-2027"];

export default function SubjectAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [subjects,    setSubjects]    = useState([]);
  const [teachers,    setTeachers]    = useState([]);
  const [sections,    setSections]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");
  const [term, setTerm] = useState({ semester: "FIRST", schoolYear: "2026-2027" });
  const [form, setForm] = useState({ subjectId: "", sectionId: "", teacherId: "" });

  const load = () => {
    setLoading(true);
    const courses = user?.courses ?? [];
    const courseId = courses[0]?.id ?? null;
    if (!courseId) { setError("No managed course found. Contact admin."); setLoading(false); return; }

    Promise.all([
      api.get(`/program-head/assignments?semester=${term.semester}&schoolYear=${term.schoolYear}`),
      api.get(`/subjects/course/${courseId}/curriculum`),
      api.get(`/teachers`),
      api.get(`/sections?semester=${term.semester}&schoolYear=${term.schoolYear}`),
    ]).then(([aRes, sRes, tRes, secRes]) => {
      setAssignments(aRes.data?.data ?? []);
      const curriculum = sRes.data?.data ?? [];
      setSubjects(curriculum.map(cs => cs.subject ?? cs));
      setTeachers(tRes.data?.data ?? []);
      setSections(secRes.data?.data ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [term]);

  const handleSave = async () => {
    if (!form.subjectId || !form.sectionId || !form.teacherId) {
      setError("Please select a subject, section, and teacher.");
      return;
    }
    setSaving(true); setError(""); setSuccess("");
    try {
      await api.post("/program-head/assignments", {
        subjectId:  Number(form.subjectId),
        sectionId:  Number(form.sectionId),
        teacherId:  Number(form.teacherId),
        semester:   term.semester,
        schoolYear: term.schoolYear,
      });
      setSuccess("Assignment saved successfully.");
      setForm({ subjectId: "", sectionId: "", teacherId: "" });
      load();
    } catch (e) {
      setError(e.response?.data?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async (id) => {
    try {
      await api.put(`/program-head/assignments/${id}/finalize`);
      setSuccess("Assignment finalized.");
      load();
    } catch (e) {
      setError(e.response?.data?.message ?? "Failed to finalize.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/dean/assignments/${id}`);
      setSuccess("Assignment deleted.");
      load();
    } catch (e) {
      setError(e.response?.data?.message ?? "Failed to delete.");
    }
  };

  const finalized = assignments.filter(a => a.finalized).length;
  const drafts    = assignments.length - finalized;

  const selectStyle = {
    width: "100%", padding: "9px 12px",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9,
    background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13,
    fontFamily: "'DM Sans', sans-serif", outline: "none", cursor: "pointer",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060D1A", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        select { color-scheme: dark; }
        select:focus { border-color: rgba(34,197,94,0.5) !important; }
        .assign-row:hover { background: rgba(255,255,255,0.025) !important; }

        /* ── Stats row ── */
        .sa-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 28px;
        }

        /* ── Header row ── */
        .sa-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .sa-term-selectors {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-shrink: 0;
          flex-wrap: wrap;
        }

        /* ── Form grid ── */
        .sa-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 12px;
          align-items: end;
        }

        /* ── Table wrapper (horizontal scroll on mobile) ── */
        .sa-table-wrapper {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          overflow: hidden;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .sa-table-wrapper table {
          width: 100%;
          min-width: 560px;
          border-collapse: collapse;
          font-size: 13px;
        }

        /* ── Tablet (≤900px) ── */
        @media (max-width: 900px) {
          .sa-form-grid {
            grid-template-columns: 1fr 1fr;
          }

          .sa-form-grid > div:nth-child(3) {
            grid-column: 1 / -1;
          }

          .sa-form-grid > button {
            grid-column: 1 / -1;
            justify-self: stretch;
          }
        }

        /* ── Mobile (≤600px) ── */
        @media (max-width: 600px) {
          .sa-stats {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .sa-header-row {
            flex-direction: column;
            gap: 12px;
          }

          .sa-term-selectors {
            width: 100%;
          }

          .sa-term-selectors select {
            flex: 1;
          }

          .sa-form-grid {
            grid-template-columns: 1fr;
          }

          .sa-form-grid > div,
          .sa-form-grid > button {
            grid-column: 1 / -1;
          }
        }
      `}</style>

      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-5%", right: "25%", width: 550, height: 550, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at 50% 10%, black 20%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 10%, black 20%, transparent 70%)",
        }} />
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(20px,5vw,40px) clamp(16px,5vw,40px) 60px", position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <div className="sa-header-row">
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 100, padding: "4px 14px", marginBottom: 14,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#4ADE80", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
                Subject Assignments
              </span>
            </div>
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(1.5rem,4vw,2rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 6 }}>
              Manage Assignments
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.6 }}>
              Assign teachers to sections and finalize for the timetable engine.
            </p>
          </div>

          <div className="sa-term-selectors">
            <select
              value={term.semester}
              onChange={e => setTerm(t => ({ ...t, semester: e.target.value }))}
              style={{ ...selectStyle, width: "auto", padding: "8px 12px", flex: "1 1 120px" }}
            >
              {SEMESTER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select
              value={term.schoolYear}
              onChange={e => setTerm(t => ({ ...t, schoolYear: e.target.value }))}
              style={{ ...selectStyle, width: "auto", padding: "8px 12px", flex: "1 1 120px" }}
            >
              {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* ── Mini stats ── */}
        <div className="sa-stats">
          {[
            { label: "Total Assignments", value: assignments.length, color: "#3B82F6" },
            { label: "Draft",             value: drafts,             color: "#F59E0B" },
            { label: "Finalized",         value: finalized,          color: "#22C55E" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, padding: "16px 18px", position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, ${s.color}80, transparent)`,
              }} />
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Alerts ── */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "10px 16px", marginBottom: 18, color: "#FCA5A5", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10, padding: "10px 16px", marginBottom: 18, color: "#86EFAC", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
            <span>✅</span> {success}
          </div>
        )}

        {/* ── Add assignment form ── */}
        <div style={{
          background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: "clamp(16px,3vw,22px) clamp(16px,3vw,24px)", marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'DM Mono', monospace" }}>
              Add / Update Assignment
            </span>
          </div>

          <div className="sa-form-grid">
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'DM Mono', monospace" }}>Subject</label>
              <select value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))} style={selectStyle}>
                <option value="">Select subject…</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'DM Mono', monospace" }}>Section</label>
              <select value={form.sectionId} onChange={e => setForm(f => ({ ...f, sectionId: e.target.value }))} style={selectStyle}>
                <option value="">Select section…</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.courseCode} {s.yearLevel}-{s.sectionName}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'DM Mono', monospace" }}>Teacher</label>
              <select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))} style={selectStyle}>
                <option value="">Select teacher…</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
              </select>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "9px 24px",
                background: saving ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #22C55E, #16A34A)",
                color: "#fff", border: "none", borderRadius: 9,
                fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: saving ? "none" : "0 4px 16px rgba(34,197,94,0.3)",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
                alignSelf: "flex-end",
              }}
            >
              {saving ? "Saving…" : "Save →"}
            </button>
          </div>
        </div>

        {/* ── Assignments table ── */}
        <div className="sa-table-wrapper">
          <table>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {["Subject", "Code", "Assigned Teacher", "Status", "Actions"].map(h => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left",
                    fontWeight: 700, color: "rgba(255,255,255,0.35)",
                    fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
                    fontFamily: "'DM Mono', monospace",
                    background: "rgba(255,255,255,0.02)",
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: "48px 0", textAlign: "center", color: "rgba(255,255,255,0.25)", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
                    Loading…
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "48px 0", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 14 }}>
                    No assignments yet for this term.
                  </td>
                </tr>
              ) : assignments.map(a => (
                <tr key={a.id} className="assign-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.15s" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 500, color: "#F1F5F9", minWidth: 140 }}>{a.subject?.name}</td>
                  <td style={{ padding: "12px 16px", color: "#93C5FD", fontWeight: 700, fontFamily: "'DM Mono', monospace", fontSize: 12, whiteSpace: "nowrap" }}>{a.subject?.code}</td>
                  <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.7)", minWidth: 140 }}>{a.teacher?.fullName}</td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {a.finalized ? (
                      <span style={{
                        fontSize: 11, background: "rgba(34,197,94,0.12)", color: "#86EFAC",
                        border: "1px solid rgba(34,197,94,0.3)",
                        borderRadius: 6, padding: "3px 10px", fontWeight: 700, fontFamily: "'DM Mono', monospace",
                      }}>Finalized</span>
                    ) : (
                      <span style={{
                        fontSize: 11, background: "rgba(245,158,11,0.12)", color: "#FCD34D",
                        border: "1px solid rgba(245,158,11,0.3)",
                        borderRadius: 6, padding: "3px 10px", fontWeight: 700, fontFamily: "'DM Mono', monospace",
                      }}>Draft</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {!a.finalized && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "nowrap" }}>
                        <button
                          onClick={() => handleFinalize(a.id)}
                          style={{
                            fontSize: 11, padding: "5px 12px",
                            background: "rgba(34,197,94,0.12)", color: "#86EFAC",
                            border: "1px solid rgba(34,197,94,0.3)",
                            borderRadius: 7, cursor: "pointer", fontWeight: 700,
                            fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
                          }}
                        >Finalize</button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          style={{
                            fontSize: 11, padding: "5px 12px",
                            background: "rgba(239,68,68,0.08)", color: "#FCA5A5",
                            border: "1px solid rgba(239,68,68,0.2)",
                            borderRadius: 7, cursor: "pointer", fontWeight: 700,
                            fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
                          }}
                        >Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {assignments.length > 0 && (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono', monospace", marginTop: 12, textAlign: "right" }}>
            {assignments.length} total · {finalized} finalized · {drafts} draft
          </p>
        )}

      </div>
    </div>
  );
}
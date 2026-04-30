import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

const SEMESTER_OPTIONS = [
  { value: "FIRST", label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "SUMMER", label: "Summer" },
];
const SCHOOL_YEARS = ["2024-2025", "2025-2026", "2026-2027"];

export default function SubjectAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [subjects,    setSubjects]    = useState([]);
  const [teachers,    setTeachers]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");
  const [sections,    setSections]    = useState([]);
  const [term, setTerm] = useState({ semester: "FIRST", schoolYear: "2026-2027" });
  const [form, setForm] = useState({ subjectId: "", sectionId: "", teacherId: "", courseId: "" });

  const load = () => {
    setLoading(true);
    const courses = user?.courses ?? [];
    const courseId = courses[0]?.id ?? null;
    if (!courseId) { setError("No managed course found. Contact admin."); setLoading(false); return; }

    Promise.all([
      api.get(`/program-head/assignments?semester=${term.semester}&schoolYear=${term.schoolYear}`),
      courseId
        ? api.get(`/subjects/course/${courseId}/curriculum`)
        : Promise.resolve({ data: { data: [] } }),
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
      setSuccess("Assignment saved.");
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

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 1000, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: 4 }}>Subject Assignments</h1>
      <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center" }}>
        <select value={term.semester} onChange={e => setTerm(t => ({ ...t, semester: e.target.value }))}
          style={{ padding: "7px 10px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
          {SEMESTER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={term.schoolYear} onChange={e => setTerm(t => ({ ...t, schoolYear: e.target.value }))}
          style={{ padding: "7px 10px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
          {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {error   && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#dc2626", fontSize: 13 }}>⚠️ {error}</div>}
      {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#15803d", fontSize: 13 }}>✅ {success}</div>}

      {/* Add form */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 22px", border: "1px solid #e5e7eb", marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Add / Update Assignment</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Subject</label>
            <select value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
              style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
              <option value="">Select subject…</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Section</label>
            <select value={form.sectionId} onChange={e => setForm(f => ({ ...f, sectionId: e.target.value }))}
              style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
              <option value="">Select section…</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.courseCode} {s.yearLevel}-{s.sectionName}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Teacher</label>
            <select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
              style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
              <option value="">Select teacher…</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
          </div>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: "8px 20px", background: "#1a56db", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Assignments table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1.5px solid #e5e7eb" }}>
              {["Subject","Code","Assigned Teacher","Status","Actions"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>Loading…</td></tr>
            ) : assignments.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>No assignments yet.</td></tr>
            ) : assignments.map(a => (
              <tr key={a.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "10px 14px", fontWeight: 500 }}>{a.subject?.name}</td>
                <td style={{ padding: "10px 14px", color: "#1a56db", fontWeight: 600 }}>{a.subject?.code}</td>
                <td style={{ padding: "10px 14px" }}>{a.teacher?.fullName}</td>
                <td style={{ padding: "10px 14px" }}>
                  {a.finalized
                    ? <span style={{ fontSize: 11, background: "#d1fae5", color: "#065f46", borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>Finalized</span>
                    : <span style={{ fontSize: 11, background: "#fef3c7", color: "#92400e", borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>Draft</span>}
                </td>
                <td style={{ padding: "10px 14px", display: "flex", gap: 8 }}>
                  {!a.finalized && (
                    <>
                      <button onClick={() => handleFinalize(a.id)}
                        style={{ fontSize: 11, padding: "4px 10px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                        Finalize
                      </button>
                      <button onClick={() => handleDelete(a.id)}
                        style={{ fontSize: 11, padding: "4px 10px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
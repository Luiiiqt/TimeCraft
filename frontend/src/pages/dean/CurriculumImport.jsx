import { useState, useEffect } from "react";
import api from "../../services/api";

export default function CurriculumImport() {
  const [courses, setCourses] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [form, setForm] = useState({ courseId: "", effectiveYear: "", curriculumName: "", file: null });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    api.get("/dean/my-courses").then(r => {
      const list = r.data?.data ?? [];
      setCourses(list);
      if (list.length > 0) {
        const id = list[0].id;
        setForm(f => ({ ...f, courseId: id }));
        loadCurricula(id);
      }
    }).catch(() => {});
  }, []);

  const loadCurricula = (courseId) => {
    api.get(`/curriculum?courseId=${courseId}`)
      .then(r => setCurricula(r.data?.data ?? []))
      .catch(() => setCurricula([]));
  };

  const handleCourseChange = (id) => {
    setForm(f => ({ ...f, courseId: id }));
    loadCurricula(id);
  };

  const handleSubmit = async () => {
    if (!form.courseId || !form.effectiveYear || !form.curriculumName || !form.file) {
      setMsg({ type: "error", text: "All fields and a file are required." });
      return;
    }
    setSaving(true); setMsg({ type: "", text: "" });
    try {
      const data = new FormData();
      data.append("courseId", form.courseId);
      data.append("effectiveYear", form.effectiveYear);
      data.append("curriculumName", form.curriculumName);
      data.append("file", form.file);
      await api.post("/curriculum/import", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMsg({ type: "success", text: "Curriculum imported successfully." });
      loadCurricula(form.courseId);
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.message ?? "Import failed." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 900, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: 4 }}>Import Curriculum</h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
        Upload an Excel (.xlsx) or CSV file to import the 4-year curriculum for a course.
      </p>

      {msg.text && (
        <div style={{
          background: msg.type === "error" ? "#fef2f2" : "#f0fdf4",
          border: `1px solid ${msg.type === "error" ? "#fecaca" : "#bbf7d0"}`,
          borderRadius: 8, padding: "10px 14px", marginBottom: 16,
          color: msg.type === "error" ? "#dc2626" : "#15803d", fontSize: 13
        }}>
          {msg.type === "error" ? "⚠️" : "✅"} {msg.text}
        </div>
      )}

      {/* Import form */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 24, marginBottom: 28 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Upload File</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Course</label>
            <select value={form.courseId} onChange={e => handleCourseChange(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 13 }}>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Effective Year</label>
            <input placeholder="e.g. 2024-2025" value={form.effectiveYear}
              onChange={e => setForm(f => ({ ...f, effectiveYear: e.target.value }))}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Curriculum Name</label>
          <input placeholder="e.g. BSIT Curriculum 2024" value={form.curriculumName}
            onChange={e => setForm(f => ({ ...f, curriculumName: e.target.value }))}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>File (.xlsx or .csv)</label>
          <input type="file" accept=".xlsx,.csv"
            onChange={e => setForm(f => ({ ...f, file: e.target.files[0] }))}
            style={{ fontSize: 13 }} />
          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
            Required columns: subject_code, subject_name, units, prerequisite, year_level, semester
          </p>
        </div>

        <button onClick={handleSubmit} disabled={saving} style={{
          padding: "9px 22px", borderRadius: 8, border: "none",
          background: saving ? "#93c5fd" : "#1a56db", color: "#fff",
          fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer"
        }}>{saving ? "Importing…" : "Import Curriculum"}</button>
      </div>

      {/* Existing curricula */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>Imported Curricula</h2>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1.5px solid #e5e7eb" }}>
              {["Name", "Effective Year", "Imported At", "Status"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {curricula.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>No curricula imported yet.</td></tr>
            ) : curricula.map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "10px 14px", fontWeight: 500 }}>{c.name}</td>
                <td style={{ padding: "10px 14px", color: "#1a56db", fontWeight: 600 }}>{c.effectiveYear}</td>
                <td style={{ padding: "10px 14px", color: "#6b7280", fontSize: 12 }}>
                  {c.importedAt ? new Date(c.importedAt).toLocaleDateString() : "—"}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 600,
                    background: c.active ? "#d1fae5" : "#f3f4f6",
                    color: c.active ? "#065f46" : "#6b7280"
                  }}>{c.active ? "ACTIVE" : "INACTIVE"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
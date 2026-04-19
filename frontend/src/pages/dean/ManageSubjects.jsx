import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

const YEARS = [1, 2, 3, 4];
const SEMESTERS = ["FIRST", "SECOND", "SUMMER"];
const SEM_LABEL = { FIRST: "1st Sem", SECOND: "2nd Sem", SUMMER: "Summer" };

const badge = (text, color) => (
  <span style={{
    fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 600,
    background: color.bg, color: color.text
  }}>{text}</span>
);

const TYPE_COLOR = { MAJOR: { bg: "#dbeafe", text: "#1e40af" }, MINOR: { bg: "#f3f4f6", text: "#374151" } };
const SES_COLOR = { LECTURE: { bg: "#f0fdf4", text: "#14532d" }, LABORATORY: { bg: "#fef3c7", text: "#92400e" } };

const EMPTY_FORM = { name: "", code: "", subjectType: "MAJOR", sessionType: "LECTURE", units: 3, prerequisite: "", yearLevel: 1, semester: "FIRST", courseId: null };

const isMajor = (form) => form.subjectType === "MAJOR";

export default function ManageSubjects() {
  const { user } = useAuth();

  const [curriculum, setCurriculum] = useState([]);   // CourseSubject[]
  const [allSubjects, setAllSubjects] = useState([]);   // Subject[] in dept
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState(null);

  const [activeYear, setActiveYear] = useState(1);
  const [activeSem, setActiveSem] = useState("FIRST");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Load courses under this PH's department
  useEffect(() => {
    if (!user) return;
    api.get(`/dean/my-courses`)
      .then(r => {
        const list = r.data?.data ?? [];
        setCourses(list);
        if (list.length > 0) setCourseId(list[0].id);
      })
      .catch(() => { });
  }, [user]);

  // Load full curriculum when course changes
  useEffect(() => {
    if (!courseId) return;
    api.get(`/subjects/course/${courseId}/curriculum`)
      .then(r => {
        console.log("CURRICULUM RESPONSE:", JSON.stringify(r.data?.data?.[0]));
        setCurriculum(r.data?.data ?? []);
      })
      .catch(() => setCurriculum([]));
  }, [courseId]);

  // Load all subjects in dept (for duplicate check awareness)
  useEffect(() => {
    if (!courseId) return;
    api.get(`/subjects/course/${courseId}/curriculum`)
      .then(r => {
        const subjects = (r.data?.data ?? []).map(cs => cs.subject);
        setAllSubjects(subjects);
      })
      .catch(() => { });
  }, [courseId]);

  // Filtered view
  const visible = curriculum.filter(cs =>
    Number(cs.yearLevel) === Number(activeYear) &&
    String(cs.semester) === String(activeSem) &&
    (search === "" ||
      cs.subject.name.toLowerCase().includes(search.toLowerCase()) ||
      cs.subject.code.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM, yearLevel: activeYear, semester: activeSem, courseId: courseId });
    setError("");
    setShowForm(true);
  };

  const openEdit = (cs) => {
    setEditId(cs.subject.id);
    setForm({
      name: cs.subject.name,
      code: cs.subject.code,
      subjectType: cs.subject.subjectType,
      sessionType: cs.subject.sessionType,
      units: cs.subject.units,
      prerequisite: cs.subject.prerequisite?.code ?? "",
      yearLevel: cs.yearLevel,
      semester: cs.semester,
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.code) { setError("Name and code are required."); return; }
    setSaving(true); setError("");
    try {
      if (editId) {
        await api.put(`/subjects/${editId}`, {
          name: form.name, code: form.code,
          subjectType: form.subjectType, sessionType: form.sessionType,
          units: Number(form.units), prerequisite: form.prerequisite || null,
          departmentId: user.departmentId,
        });
      } else {
        const sessions = isMajor(form)
          ? ["LECTURE", "LABORATORY"]
          : ["LECTURE"];

        for (const sessionType of sessions) {
          const code = isMajor(form)
            ? `${form.code}-${sessionType === "LECTURE" ? "LEC" : "LAB"}`
            : form.code;

          let subjectId;
          let existing = null;
          try {
            const check = await api.get(`/subjects/by-code/${code}`);
            existing = check.data?.data ?? null;
          } catch (e) {
            if (e.response?.status !== 404) throw e;
          }

          if (existing) {
            subjectId = existing.id;
          } else {
            try {
              const res = await api.post("/subjects", {
                name: form.name,
                code,
                subjectType: form.subjectType,
                sessionType,
                units: Number(form.units),
                prerequisite: form.prerequisite || null,
                departmentId: user.departmentId,
              });
              subjectId = res.data.data.id;
            } catch (e) {
              if (e.response?.status === 409 || e.response?.data?.message?.toLowerCase().includes("already exists")) {
                const retry = await api.get(`/subjects/by-code/${code}`);
                subjectId = retry.data.data.id;
              } else {
                throw e;
              }
            }
          }

          try {
            await api.post("/dean/curriculum", {
              courseId: Number(form.courseId ?? courseId),
              subjectId,
              yearLevel: Number(form.yearLevel),
              semester: form.semester,
              isShared: false,
            });
          } catch (e) {
            if (!e.response?.data?.message?.toLowerCase().includes("already")) throw e;
          }

          console.log("Posting to curriculum:", {
            courseId: Number(form.courseId ?? courseId),
            subjectId,
            yearLevel: Number(form.yearLevel),
            semester: form.semester,
            isShared: false,
          });
        }
      }

      // Refresh
      const currRes = await api.get(`/subjects/course/${courseId}/curriculum`);
      setCurriculum(currRes.data?.data ?? []);
      setAllSubjects((currRes.data?.data ?? []).map(cs => cs.subject));
      setShowForm(false);
    } catch (e) {
      setError(e.response?.data?.message ?? "Failed to save subject.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (cs) => {
    if (!confirm(`Remove ${cs.subject.code} from curriculum?`)) return;
    try {
      await api.delete("/dean/curriculum", {
        data: { courseId, subjectId: cs.subject.id }
      });
      setCurriculum(prev => prev.filter(x => x.id !== cs.id));
    } catch (e) {
      alert(e.response?.data?.message ?? "Failed to remove subject.");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 1100, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>Manage Subjects</h1>
          <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
            Build your course curriculum by year level and semester.
          </p>
        </div>
        <button onClick={openAdd} style={{
          background: "#1a56db", color: "#fff", border: "none", borderRadius: 8,
          padding: "9px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer"
        }}>+ Add Subject</button>
      </div>

      {/* Course selector */}
      {courses.length > 1 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginRight: 8 }}>COURSE</label>
          <select value={courseId ?? ""} onChange={e => setCourseId(Number(e.target.value))}
            style={{ padding: "6px 12px", borderRadius: 7, border: "1.5px solid #d1d5db", fontSize: 13 }}>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </select>
        </div>
      )}

      {/* Year level tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {YEARS.map(y => (
          <button key={y} onClick={() => setActiveYear(y)} style={{
            padding: "6px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
            border: "1.5px solid " + (activeYear === y ? "#1a56db" : "#e5e7eb"),
            background: activeYear === y ? "#1a56db" : "#fff",
            color: activeYear === y ? "#fff" : "#374151",
          }}>Year {y}</button>
        ))}
      </div>

      {/* Semester tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {SEMESTERS.map(s => (
          <button key={s} onClick={() => setActiveSem(s)} style={{
            padding: "5px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: "1.5px solid " + (activeSem === s ? "#0e9f6e" : "#e5e7eb"),
            background: activeSem === s ? "#0e9f6e" : "#fff",
            color: activeSem === s ? "#fff" : "#6b7280",
          }}>{SEM_LABEL[s]}</button>
        ))}
      </div>

      {/* Search */}
      <input placeholder="Search subjects…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", padding: "8px 14px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13, marginBottom: 16, outline: "none" }} />

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1.5px solid #e5e7eb" }}>
              {["Code", "Name", "Type", "Session", "Units", "Prerequisite", ""].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
                No subjects for Year {activeYear} — {SEM_LABEL[activeSem]}. Click "+ Add Subject" to begin.
              </td></tr>
            ) : visible.map(cs => (
              <tr key={cs.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "10px 14px", color: "#1a56db", fontWeight: 600 }}>{cs.subject.code}</td>
                <td style={{ padding: "10px 14px", fontWeight: 500 }}>{cs.subject.name}</td>
                <td style={{ padding: "10px 14px" }}>{badge(cs.subject.subjectType, TYPE_COLOR[cs.subject.subjectType] ?? TYPE_COLOR.MINOR)}</td>
                <td style={{ padding: "10px 14px" }}>{badge(cs.subject.sessionType, SES_COLOR[cs.subject.sessionType])}</td>
                <td style={{ padding: "10px 14px", color: "#6b7280" }}>{cs.subject.units}</td>
                <td style={{ padding: "10px 14px", color: "#6b7280" }}>{cs.subject.prerequisite?.code ?? "—"}</td>
                <td style={{ padding: "10px 14px", display: "flex", gap: 8 }}>
                  <button onClick={() => openEdit(cs)} style={{
                    fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "1px solid #d1d5db",
                    background: "#fff", cursor: "pointer", fontWeight: 500
                  }}>Edit</button>
                  <button onClick={() => handleRemove(cs)} style={{
                    fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "1px solid #fca5a5",
                    background: "#fff", color: "#dc2626", cursor: "pointer", fontWeight: 500
                  }}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary bar */}
      <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 10 }}>
        {visible.length} subject{visible.length !== 1 ? "s" : ""} in Year {activeYear} — {SEM_LABEL[activeSem]}
        {" · "}{curriculum.length} total in curriculum
      </p>

      {/* Modal */}
      {showForm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50
        }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 20, color: "#111827" }}>
              {editId ? "Edit Subject" : "Add New Subject"}
            </h2>

            {error && <p style={{ color: "#dc2626", fontSize: 12, marginBottom: 12, background: "#fef2f2", padding: "8px 12px", borderRadius: 7 }}>{error}</p>}

            {courses.length > 1 && !editId && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Course</label>
                <select value={form.courseId ?? ""} onChange={e => setForm(p => ({ ...p, courseId: Number(e.target.value) }))}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </select>
              </div>
            )}

            {[
              { label: "Subject Name", key: "name", type: "text", placeholder: "e.g. Data Structures and Algorithms" },
              { label: "Subject Code", key: "code", type: "text", placeholder: "e.g. IT-DSA" },
              { label: "Units", key: "units", type: "number", placeholder: "3" },
              { label: "Prerequisite Code (optional)", key: "prerequisite", type: "text", placeholder: "e.g. IT-PROG1" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Subject Type</label>
                <select value={form.subjectType} onChange={e => setForm(p => ({ ...p, subjectType: e.target.value }))} disabled={!!editId}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 13 }}>
                  <option value="MAJOR">MAJOR</option>
                  <option value="MINOR">MINOR</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Session Type</label>
                {isMajor(form) ? (
                  <div style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 13, background: "#f9fafb", color: "#6b7280" }}>
                    LECTURE + LABORATORY <span style={{ fontSize: 11, color: "#1a56db" }}>(auto)</span>
                  </div>
                ) : (
                  <div style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 13, background: "#f9fafb", color: "#6b7280" }}>
                    LECTURE <span style={{ fontSize: 11, color: "#0e9f6e" }}>(auto)</span>
                  </div>
                )}
              </div>
            </div>

            {!editId && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Year Level</label>
                  <select value={form.yearLevel} onChange={e => setForm(p => ({ ...p, yearLevel: Number(e.target.value) }))}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 13 }}>
                    {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Semester</label>
                  <select value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 13 }}>
                    {SEMESTERS.map(s => <option key={s} value={s}>{SEM_LABEL[s]}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{
                padding: "8px 18px", borderRadius: 8, border: "1.5px solid #d1d5db",
                background: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500
              }}>Cancel</button>
              <button onClick={handleSubmit} disabled={saving} style={{
                padding: "8px 18px", borderRadius: 8, border: "none",
                background: saving ? "#93c5fd" : "#1a56db", color: "#fff",
                fontSize: 13, cursor: saving ? "not-allowed" : "pointer", fontWeight: 600
              }}>{saving ? "Saving…" : editId ? "Update Subject" : "Add Subject"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import api from "../../services/api";

const YEAR_LABELS = { 1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year" };
const SEM_LABELS  = { FIRST: "1st Semester", SECOND: "2nd Semester", SUMMER: "Summer" };
const SEM_ORDER   = ["FIRST", "SECOND", "SUMMER"];

const TYPE_CONFIG = {
  MAJOR_LECTURE:     { label: "Major — Lecture Only",    color: "#1a56db", bg: "#eff6ff", dot: "#3b82f6" },
  MAJOR_LECTURE_LAB: { label: "Major — Lecture + Lab",   color: "#7c3aed", bg: "#f5f3ff", dot: "#8b5cf6" },
  MINOR:             { label: "Minor (GE)",               color: "#0891b2", bg: "#ecfeff", dot: "#06b6d4" },
};

function getSubjectType(cs) {
  if (cs.subject?.subjectType === "MINOR") return "MINOR";
  if (cs.subject?.hasLab) return "MAJOR_LECTURE_LAB";
  return "MAJOR_LECTURE";
}

export default function CurriculumImport() {
  const [courses, setCourses]     = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [checklist, setChecklist] = useState([]);   // CourseSubject[]
  const [form, setForm] = useState({ courseId: "", effectiveYear: "", curriculumName: "", file: null });
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("import"); // "import" | "checklist"
  const [filterYear, setFilterYear]   = useState("ALL");
  const [filterSem, setFilterSem]     = useState("ALL");
  const [filterType, setFilterType]   = useState("ALL");
  const [search, setSearch]           = useState("");

  useEffect(() => {
    api.get("/dean/my-courses").then(r => {
      const list = r.data?.data ?? [];
      setCourses(list);
      if (list.length > 0) {
        const id = list[0].id;
        setForm(f => ({ ...f, courseId: id }));
        loadCurricula(id);
        loadChecklist(id);
      }
    }).catch(() => {});
  }, []);

  const loadCurricula = (courseId) => {
    api.get(`/curriculum?courseId=${courseId}`)
      .then(r => setCurricula(r.data?.data ?? []))
      .catch(() => setCurricula([]));
  };

  const loadChecklist = (courseId) => {
    api.get(`/subjects/course/${courseId}/curriculum`)
      .then(r => setChecklist(r.data?.data ?? []))
      .catch(() => setChecklist([]));
  };

  const handleCourseChange = (id) => {
    setForm(f => ({ ...f, courseId: id }));
    loadCurricula(id);
    loadChecklist(id);
  };

  const handleSubmit = async () => {
    if (!form.courseId || !form.effectiveYear || !form.curriculumName || !form.file) {
      setMsg({ type: "error", text: "All fields and a file are required." });
      return;
    }
    setSaving(true); setMsg({ type: "", text: "" });
    try {
      const data = new FormData();
      data.append("courseId",       form.courseId);
      data.append("effectiveYear",  form.effectiveYear);
      data.append("curriculumName", form.curriculumName);
      data.append("file",           form.file);
      await api.post("/curriculum/import", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMsg({ type: "success", text: "Curriculum imported successfully." });
      loadCurricula(form.courseId);
      loadChecklist(form.courseId);
      setActiveTab("checklist");
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.message ?? "Import failed." });
    } finally {
      setSaving(false);
    }
  };

  // ── Filtered + grouped checklist ──────────────────────────────────────────
  const filtered = checklist.filter(cs => {
    const t = getSubjectType(cs);
    const matchYear = filterYear === "ALL" || String(cs.yearLevel) === filterYear;
    const matchSem  = filterSem  === "ALL" || cs.semester === filterSem;
    const matchType = filterType === "ALL" || t === filterType;
    const q = search.toLowerCase();
    const matchQ = !q ||
      cs.subject?.code?.toLowerCase().includes(q) ||
      cs.subject?.name?.toLowerCase().includes(q);
    return matchYear && matchSem && matchType && matchQ;
  });

  // Group by yearLevel → semester
  const grouped = {};
  for (const cs of filtered) {
    const y = cs.yearLevel;
    const s = cs.semester;
    if (!grouped[y]) grouped[y] = {};
    if (!grouped[y][s]) grouped[y][s] = [];
    grouped[y][s].push(cs);
  }

  const totalSubjects  = checklist.length;
  const majorLec       = checklist.filter(cs => getSubjectType(cs) === "MAJOR_LECTURE").length;
  const majorLecLab    = checklist.filter(cs => getSubjectType(cs) === "MAJOR_LECTURE_LAB").length;
  const minor          = checklist.filter(cs => getSubjectType(cs) === "MINOR").length;

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 1100, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>
          Curriculum Management
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>
          Import a 4-year curriculum and review the subject checklist per year level and semester.
        </p>
      </div>

      {/* Course selector (always visible) */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>COURSE</label>
        <select value={form.courseId} onChange={e => handleCourseChange(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 13, fontWeight: 600, color: "#111827", background: "#fff" }}>
          {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #e5e7eb", marginBottom: 24 }}>
        {[["import", "⬆️ Import"], ["checklist", `📋 Checklist (${totalSubjects})`]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            padding: "9px 22px", border: "none", background: "transparent",
            borderBottom: activeTab === key ? "2.5px solid #1a56db" : "2.5px solid transparent",
            color: activeTab === key ? "#1a56db" : "#6b7280",
            fontWeight: activeTab === key ? 700 : 500, fontSize: 13, cursor: "pointer",
            marginBottom: -2,
          }}>{label}</button>
        ))}
      </div>

      {/* ── IMPORT TAB ── */}
      {activeTab === "import" && (
        <>
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

          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 24, marginBottom: 28 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 6 }}>Upload File</h2>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 18 }}>
              Required columns: <code>subject_code, subject_name, units, prerequisite, year_level, semester, subject_type, session_type, has_lab</code>
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Effective Year</label>
                <input placeholder="e.g. 2024-2025" value={form.effectiveYear}
                  onChange={e => setForm(f => ({ ...f, effectiveYear: e.target.value }))}
                  style={inp} />
              </div>
              <div>
                <label style={lbl}>Curriculum Name</label>
                <input placeholder="e.g. BSIT Curriculum 2024" value={form.curriculumName}
                  onChange={e => setForm(f => ({ ...f, curriculumName: e.target.value }))}
                  style={inp} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>File (.xlsx or .csv)</label>
              <input type="file" accept=".xlsx,.csv"
                onChange={e => setForm(f => ({ ...f, file: e.target.files[0] }))}
                style={{ fontSize: 13 }} />
            </div>

            {/* Column guide */}
            <div style={{ background: "#f8fafc", borderRadius: 8, border: "1px solid #e5e7eb", padding: "12px 16px", marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8 }}>COLUMN GUIDE</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
                {[
                  ["subject_code", "e.g. IT-DSA"],
                  ["subject_name", "Full subject name"],
                  ["units", "e.g. 3"],
                  ["prerequisite", "Code or blank"],
                  ["year_level", "1 – 4"],
                  ["semester", "FIRST / SECOND / SUMMER"],
                  ["subject_type", "MAJOR or MINOR"],
                  ["session_type", "LECTURE or LABORATORY"],
                  ["has_lab", "true or false"],
                ].map(([col, hint]) => (
                  <div key={col} style={{ fontSize: 11, color: "#6b7280" }}>
                    <span style={{ fontWeight: 700, color: "#111827" }}>{col}</span> — {hint}
                  </div>
                ))}
              </div>
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
                {curricula.length === 0
                  ? <tr><td colSpan={4} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>No curricula imported yet.</td></tr>
                  : curricula.map(c => (
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
        </>
      )}

      {/* ── CHECKLIST TAB ── */}
      {activeTab === "checklist" && (
        <>
          {/* Summary stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Total Subjects", value: totalSubjects, color: "#111827", bg: "#f9fafb" },
              { label: "Major (Lec Only)", value: majorLec, color: "#1a56db", bg: "#eff6ff" },
              { label: "Major (Lec + Lab)", value: majorLecLab, color: "#7c3aed", bg: "#f5f3ff" },
              { label: "Minor (GE)", value: minor, color: "#0891b2", bg: "#ecfeff" },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: v.dot, display: "inline-block" }} />
                <span style={{ color: "#374151", fontWeight: 500 }}>{v.label}</span>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            <input placeholder="Search subject code or name…" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inp, width: 240, flex: "0 0 auto" }} />
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={sel}>
              <option value="ALL">All Year Levels</option>
              {[1,2,3,4].map(y => <option key={y} value={String(y)}>Year {y}</option>)}
            </select>
            <select value={filterSem} onChange={e => setFilterSem(e.target.value)} style={sel}>
              <option value="ALL">All Semesters</option>
              {SEM_ORDER.map(s => <option key={s} value={s}>{SEM_LABELS[s]}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={sel}>
              <option value="ALL">All Types</option>
              {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            {(search || filterYear !== "ALL" || filterSem !== "ALL" || filterType !== "ALL") && (
              <button onClick={() => { setSearch(""); setFilterYear("ALL"); setFilterSem("ALL"); setFilterType("ALL"); }}
                style={{ fontSize: 12, color: "#6b7280", background: "none", border: "1px solid #d1d5db", borderRadius: 6, padding: "5px 10px", cursor: "pointer" }}>
                Clear filters
              </button>
            )}
          </div>

          {checklist.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
              <p style={{ color: "#9ca3af", fontSize: 14 }}>No curriculum imported yet. Go to the Import tab to upload a file.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 32, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
              No subjects match your filters.
            </div>
          ) : (
            Object.keys(grouped).sort((a,b) => a-b).map(year => (
              <div key={year} style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "4px 14px", fontSize: 13, fontWeight: 700 }}>
                    {YEAR_LABELS[year] ?? `Year ${year}`}
                  </div>
                  <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                </div>

                {SEM_ORDER.filter(s => grouped[year][s]).map(sem => (
                  <div key={sem} style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", letterSpacing: "0.06em", marginBottom: 8, paddingLeft: 2 }}>
                      {SEM_LABELS[sem] ?? sem}
                    </div>

                    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: "#f9fafb", borderBottom: "1.5px solid #e5e7eb" }}>
                            {["#", "Code", "Subject Name", "Units", "Prerequisite", "Type"].map(h => (
                              <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {grouped[year][sem].map((cs, i) => {
                            const t = getSubjectType(cs);
                            const cfg = TYPE_CONFIG[t];
                            return (
                              <tr key={cs.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                                <td style={{ padding: "9px 14px", color: "#9ca3af", fontSize: 12, width: 36 }}>{i + 1}</td>
                                <td style={{ padding: "9px 14px", fontWeight: 700, color: "#111827", fontFamily: "monospace", fontSize: 12 }}>
                                  {cs.subject?.code ?? "—"}
                                </td>
                                <td style={{ padding: "9px 14px", color: "#111827", fontWeight: 500 }}>
                                  {cs.subject?.name ?? "—"}
                                </td>
                                <td style={{ padding: "9px 14px", color: "#374151", textAlign: "center" }}>
                                  {cs.subject?.units ?? "—"}
                                </td>
                                <td style={{ padding: "9px 14px", color: "#6b7280", fontSize: 12, fontFamily: "monospace" }}>
                                  {cs.subject?.prerequisite?.code ?? <span style={{ color: "#d1d5db" }}>none</span>}
                                </td>
                                <td style={{ padding: "9px 14px" }}>
                                  <span style={{
                                    fontSize: 11, padding: "3px 9px", borderRadius: 6, fontWeight: 600,
                                    background: cfg.bg, color: cfg.color, whiteSpace: "nowrap",
                                    display: "inline-flex", alignItems: "center", gap: 5,
                                  }}>
                                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
                                    {cfg.label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

// ── Shared micro-styles ───────────────────────────────────────────────────────
const lbl = { fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 };
const inp = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 13, boxSizing: "border-box" };
const sel = { padding: "7px 10px", borderRadius: 7, border: "1.5px solid #d1d5db", fontSize: 12, color: "#374151", background: "#fff" };
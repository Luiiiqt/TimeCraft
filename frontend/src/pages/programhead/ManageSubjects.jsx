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

const TYPE_COLOR = {
  MAJOR: { bg: "#dbeafe", text: "#1e40af" },
  MINOR: { bg: "#f3f4f6", text: "#374151" },
};
const SES_COLOR = {
  LECTURE: { bg: "#f0fdf4", text: "#14532d" },
  LABORATORY: { bg: "#fef3c7", text: "#92400e" },
};

export default function ManageSubjects() {
  const { user } = useAuth();

  const [curriculum, setCurriculum] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState(null);
  const [activeYear, setActiveYear] = useState(1);
  const [activeSem, setActiveSem] = useState("FIRST");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Load courses under this PH's department
  useEffect(() => {
    if (!user) return;
    api.get("/program-head/my-courses")
      .then(r => {
        const list = r.data?.data ?? [];
        setCourses(list);
        if (list.length > 0) setCourseId(list[0].id);
      })
      .catch(() => {});
  }, [user]);

  // Load curriculum when course changes
  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    api.get(`/subjects/course/${courseId}/curriculum`)
      .then(r => setCurriculum(r.data?.data ?? []))
      .catch(() => setCurriculum([]))
      .finally(() => setLoading(false));
  }, [courseId]);

  const visible = curriculum.filter(cs =>
    Number(cs.yearLevel) === Number(activeYear) &&
    String(cs.semester) === String(activeSem) &&
    (search === "" ||
      cs.subject?.name?.toLowerCase().includes(search.toLowerCase()) ||
      cs.subject?.code?.toLowerCase().includes(search.toLowerCase()))
  );

  // Group by subject base code to show LEC+LAB pairs together
  const grouped = visible.reduce((acc, cs) => {
    const baseCode = cs.subject?.code?.replace(/-LEC$|-LAB$/, "") ?? cs.subject?.code;
    if (!acc[baseCode]) acc[baseCode] = [];
    acc[baseCode].push(cs);
    return acc;
  }, {});

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 1100, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>
          Curriculum Subjects
        </h1>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
          View all subjects in your course curriculum. Go to <strong>Assign Teachers</strong> to manage teacher assignments.
        </p>
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

      {courses.length === 1 && (
        <div style={{ marginBottom: 16, padding: "8px 14px", background: "#eff6ff", borderRadius: 8, display: "inline-block" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1e40af" }}>
            {courses[0].code} — {courses[0].name}
          </span>
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
      <input
        placeholder="Search subjects…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: "100%", padding: "8px 14px", border: "1.5px solid #d1d5db",
          borderRadius: 8, fontSize: 13, marginBottom: 16, outline: "none", boxSizing: "border-box"
        }}
      />

      {/* Info banner */}
      <div style={{
        background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8,
        padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#92400e"
      }}>
        📋 This is a read-only view of the curriculum imported by the Dean. To assign teachers, go to <strong>Assign Teachers</strong>.
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Loading curriculum…</div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1.5px solid #e5e7eb" }}>
                {["Code", "Name", "Type", "Session", "Units", "Prerequisite", "Teacher Assigned"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
                    No subjects for Year {activeYear} — {SEM_LABEL[activeSem]}.
                    {curriculum.length === 0 && " The Dean has not imported the curriculum yet."}
                  </td>
                </tr>
              ) : visible.map(cs => (
                <tr key={cs.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 14px", color: "#1a56db", fontWeight: 600 }}>
                    {cs.subject?.code}
                  </td>
                  <td style={{ padding: "10px 14px", fontWeight: 500 }}>
                    {cs.subject?.name}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {badge(cs.subject?.subjectType, TYPE_COLOR[cs.subject?.subjectType] ?? TYPE_COLOR.MINOR)}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {badge(cs.subject?.sessionType, SES_COLOR[cs.subject?.sessionType] ?? SES_COLOR.LECTURE)}
                  </td>
                  <td style={{ padding: "10px 14px", color: "#6b7280" }}>
                    {cs.subject?.units}
                  </td>
                  <td style={{ padding: "10px 14px", color: "#6b7280" }}>
                    {cs.subject?.prerequisite?.code ?? "—"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {cs.assignedTeacher ? (
                      <span style={{ fontSize: 12, background: "#d1fae5", color: "#065f46", borderRadius: 6, padding: "2px 10px", fontWeight: 600 }}>
                        ✓ {cs.assignedTeacher}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>Not assigned</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 10 }}>
        {visible.length} subject{visible.length !== 1 ? "s" : ""} in Year {activeYear} — {SEM_LABEL[activeSem]}
        {" · "}{curriculum.length} total in curriculum
      </p>
    </div>
  );
}
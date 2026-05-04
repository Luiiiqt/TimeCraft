import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

const SEMESTER_OPTIONS = [
  { value: "FIRST", label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "SUMMER", label: "Summer" },
];
const SCHOOL_YEARS = ["2024-2025", "2025-2026", "2026-2027"];

function getCurrentTerm() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return {
    semester: month >= 1 && month <= 10 ? "FIRST" : "SECOND",
    schoolYear: `${year}-${year + 1}`,
  };
}

function initials(name) {
  return (name ?? "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function PreferenceReview() {
  const { user } = useAuth();
  const [term, setTerm] = useState(getCurrentTerm());
  const [grouped, setGrouped] = useState([]);
  const [teachers, setTeachers] = useState([]);   // derived from grouped
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [modalTeacher, setModalTeacher] = useState(null);  // for preferred subjects modal
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [applying, setApplying] = useState({});

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const gRes = await api.get(`/program-head/preferences/grouped?semester=${term.semester}&schoolYear=${term.schoolYear}`);
      const data = gRes.data?.data ?? [];
      setGrouped(data);

      // Derive unique teachers from all preferences
      const teacherMap = new Map();
      data.forEach(group => {
        (group.preferences ?? []).forEach(p => {
          const t = p.teacher;
          if (t && !teacherMap.has(t.id)) {
            teacherMap.set(t.id, { ...t, preferences: [] });
          }
          if (t) {
            teacherMap.get(t.id).preferences.push({
              subjectId: group.subject?.id,
              subjectName: group.subject?.name,
              subjectCode: group.subject?.code,
              hasLab: group.subject?.hasLab,
              status: p.status,
            });
          }
        });
      });
      setTeachers([...teacherMap.values()]);
    } catch {
      setError("Failed to load preferences.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [term]);

  const handleAssign = async (subjectId, subjectName) => {
    if (!selectedTeacher) return;
    setApplying(p => ({ ...p, [subjectId]: true }));
    setError(""); setSuccess("");
    try {
      const res = await api.post("/program-head/assignments", {
        subjectId: Number(subjectId),
        teacherId: Number(selectedTeacher.id),
        semester: term.semester,
        schoolYear: term.schoolYear,
      });
      const assignmentId = res.data?.data?.id;
      if (assignmentId) {
        await api.put(`/program-head/assignments/${assignmentId}/finalize`);
      }
      setSuccess(`✅ ${selectedTeacher.fullName} assigned to "${subjectName}".`);
      load();
    } catch (e) {
      setError(e.response?.data?.message ?? "Failed to apply assignment.");
    } finally {
      setApplying(p => ({ ...p, [subjectId]: false }));
    }
  };

  const teacherVotedFor = (subjectId) =>
    selectedTeacher?.preferences?.some(p => p.subjectId === subjectId) ?? false;

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 1200, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: 4 }}>
        Preference Review & Assignment
      </h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>
        Select a teacher on the left, then assign them to a subject on the right.
      </p>

      {/* Term selector */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <select value={term.semester} onChange={e => setTerm(t => ({ ...t, semester: e.target.value }))}
          style={{ padding: "7px 10px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
          {SEMESTER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={term.schoolYear} onChange={e => setTerm(t => ({ ...t, schoolYear: e.target.value }))}
          style={{ padding: "7px 10px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
          {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 12, color: "#dc2626", fontSize: 13 }}>⚠️ {error}</div>}
      {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", marginBottom: 12, color: "#15803d", fontSize: 13 }}>{success}</div>}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Loading…</div>
      ) : grouped.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}>
          No teacher preferences submitted for this term yet.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, alignItems: "start" }}>

          {/* LEFT — Teacher list */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".05em", margin: "0 0 4px" }}>Teachers</p>
            {teachers.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9ca3af" }}>No teachers found.</p>
            ) : teachers.map(t => {
              const isSelected = selectedTeacher?.id === t.id;
              return (
                <div key={t.id} style={{
                  border: `${isSelected ? "1.5px solid #1a56db" : "1px solid #e5e7eb"}`,
                  borderRadius: 10, padding: "10px 12px",
                  background: isSelected ? "#eff6ff" : "#f9fafb",
                  cursor: "pointer",
                  transition: "border .15s",
                }} onClick={() => setSelectedTeacher(isSelected ? null : t)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                      background: isSelected ? "#dbeafe" : "#e5e7eb",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 600,
                      color: isSelected ? "#1e40af" : "#6b7280",
                    }}>
                      {initials(t.fullName)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? "#1e40af" : "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {t.fullName}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>
                        {t.preferences.length} subject{t.preferences.length !== 1 ? "s" : ""} voted
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setModalTeacher(t); }}
                    style={{
                      width: "100%", padding: "5px 0", fontSize: 12, fontWeight: 500,
                      background: "transparent", border: `1px solid ${isSelected ? "#93c5fd" : "#d1d5db"}`,
                      borderRadius: 7, cursor: "pointer", color: isSelected ? "#1e40af" : "#374151",
                    }}>
                    View Preferences
                  </button>
                </div>
              );
            })}
          </div>

          {/* RIGHT — Subject list */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".05em", margin: "0 0 4px" }}>
              Subjects {selectedTeacher ? `— click Assign to assign ${selectedTeacher.fullName.split(" ").slice(-1)[0]}` : "— select a teacher first"}
            </p>
            {grouped.map(group => {
              const subjectId = group.subject?.id;
              const isAssigned = group.assigned === true;
              const voted = teacherVotedFor(subjectId);
              const canAssign = !!selectedTeacher && voted && !isAssigned;
              const voterNames = (group.preferences ?? []).map(p => p.teacher?.fullName?.split(" ").slice(-1)[0]).join(", ");

              return (
                <div key={subjectId} style={{
                  border: `1px solid ${isAssigned ? "#bbf7d0" : voted && selectedTeacher ? "#93c5fd" : "#e5e7eb"}`,
                  borderRadius: 10, padding: "10px 14px",
                  background: isAssigned ? "#f0fdf4" : voted && selectedTeacher ? "#eff6ff" : "#f9fafb",
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{group.subject?.name}</span>
                      <span style={{ fontSize: 11, color: "#1a56db", fontWeight: 600 }}>{group.subject?.code}</span>
                      <span style={{
                        fontSize: 11, padding: "1px 8px", borderRadius: 99, fontWeight: 500,
                        background: group.subject?.hasLab ? "#f0fdf4" : "#fef9ee",
                        color: group.subject?.hasLab ? "#15803d" : "#92400e",
                      }}>
                        {group.subject?.hasLab ? "Lecture + Lab" : "Lecture"}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>
                      {(group.preferences ?? []).length} vote{(group.preferences ?? []).length !== 1 ? "s" : ""} · {voterNames || "none"}
                    </p>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    {isAssigned ? (
                      <span style={{ fontSize: 11, background: "#d1fae5", color: "#065f46", borderRadius: 6, padding: "3px 10px", fontWeight: 600 }}>
                        ✓ Finalized
                      </span>
                    ) : canAssign ? (
                      <button
                        onClick={() => handleAssign(subjectId, group.subject?.name)}
                        disabled={applying[subjectId]}
                        style={{
                          padding: "6px 16px", background: applying[subjectId] ? "#9ca3af" : "#1a56db",
                          color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600,
                          cursor: applying[subjectId] ? "not-allowed" : "pointer",
                        }}>
                        {applying[subjectId] ? "Assigning…" : "Assign"}
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>
                        {selectedTeacher ? "Did not vote" : "—"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal — Teacher Preferred Subjects */}
      {modalTeacher && (
        <div
          onClick={() => setModalTeacher(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 14, padding: "24px 28px",
              width: 480, maxWidth: "90vw", maxHeight: "80vh", overflowY: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", background: "#dbeafe",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 600, color: "#1e40af",
                }}>
                  {initials(modalTeacher.fullName)}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>{modalTeacher.fullName}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Preferred subjects this semester</p>
                </div>
              </div>
              <button onClick={() => setModalTeacher(null)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280", lineHeight: 1 }}>
                ×
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {modalTeacher.preferences.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: 13 }}>No preferences submitted.</p>
              ) : modalTeacher.preferences.map((p, i) => (
                <div key={i} style={{
                  border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "#f9fafb",
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#111827" }}>{p.subjectName}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#1a56db", fontWeight: 600 }}>{p.subjectCode}</p>
                  </div>
                  <span style={{
                    fontSize: 11, padding: "2px 10px", borderRadius: 6, fontWeight: 600,
                    background: p.status === "APPROVED" ? "#d1fae5" : p.status === "REJECTED" ? "#fee2e2" : "#fef3c7",
                    color: p.status === "APPROVED" ? "#065f46" : p.status === "REJECTED" ? "#991b1b" : "#92400e",
                  }}>
                    {p.status ?? "PENDING"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
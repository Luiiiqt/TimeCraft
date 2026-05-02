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
    semester: month >= 6 && month <= 10 ? "FIRST" : "SECOND",
    schoolYear: `${year}-${year + 1}`,
  };
}

export default function GEPreferenceReview() {
  const { user } = useAuth();
  const [term, setTerm] = useState(getCurrentTerm());
  const [grouped, setGrouped] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState({});
  const [applying, setApplying] = useState({});

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const gRes = await api.get(`/ge-coordinator/preferences/grouped?semester=${term.semester}&schoolYear=${term.schoolYear}`);
      setGrouped(gRes.data?.data ?? []);
    } catch {
      setError("Failed to load preferences.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [term]);

  const handleApply = async (subjectId, subjectName) => {
    const teacherId = selectedTeacher[subjectId];
    if (!teacherId) { setError(`Select a teacher for ${subjectName}.`); return; }
    setApplying(p => ({ ...p, [subjectId]: true }));
    setError(""); setSuccess("");
    try {
      await api.post("/ge-coordinator/assignments", {
        subjectId: Number(subjectId),
        teacherId: Number(teacherId),
        semester: term.semester,
        schoolYear: term.schoolYear,
      });
      setSuccess(`✅ Teacher assigned and finalized for "${subjectName}".`);
      load();
    } catch (e) {
      setError(e.response?.data?.message ?? "Failed to apply assignment.");
    } finally {
      setApplying(p => ({ ...p, [subjectId]: false }));
    }
  };

  const badgeStyle = (count) => ({
    display: "inline-block", fontSize: 11, fontWeight: 600,
    padding: "1px 8px", borderRadius: 99,
    background: count > 0 ? "#dbeafe" : "#f3f4f6",
    color: count > 0 ? "#1e40af" : "#6b7280", marginLeft: 8,
  });

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 1050, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: 4 }}>
        GE Subject Assignment
      </h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
        Minor subjects only. Select a teacher and click Apply to finalize the GE assignment.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <select value={term.semester} onChange={e => setTerm(t => ({ ...t, semester: e.target.value }))}
          style={{ padding: "7px 10px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
          {SEMESTER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={term.schoolYear} onChange={e => setTerm(t => ({ ...t, schoolYear: e.target.value }))}
          style={{ padding: "7px 10px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
          {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14, color: "#dc2626", fontSize: 13 }}>⚠️ {error}</div>}
      {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", marginBottom: 14, color: "#15803d", fontSize: 13 }}>{success}</div>}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Loading…</div>
      ) : grouped.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}>
          No minor subject preferences submitted for this term yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {grouped.map(group => {
            const subjectId = group.subject?.id;
            const prefs = group.preferences ?? [];
            const isAssigned = group.assigned === true;

            return (
              <div key={subjectId} style={{
                background: "#fff", borderRadius: 12,
                border: `1px solid ${isAssigned ? "#bbf7d0" : "#e5e7eb"}`,
                overflow: "hidden"
              }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{group.subject?.name}</span>
                    <span style={{ marginLeft: 10, fontSize: 12, color: "#1a56db", fontWeight: 600 }}>{group.subject?.code}</span>
                    <span style={badgeStyle(prefs.length)}>{prefs.length} vote{prefs.length !== 1 ? "s" : ""}</span>
                  </div>
                  {isAssigned && (
                    <span style={{ fontSize: 11, background: "#d1fae5", color: "#065f46", borderRadius: 6, padding: "2px 10px", fontWeight: 600 }}>
                      ✓ Finalized
                    </span>
                  )}
                </div>

                <div style={{ padding: "12px 20px" }}>
                  {prefs.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>No teachers voted for this subject yet.</p>
                  ) : (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                      {prefs.map(p => {
                        const isSelected = String(selectedTeacher[subjectId]) === String(p.teacher?.id);
                        return (
                          <button key={p.id}
                            onClick={() => setSelectedTeacher(prev => ({ ...prev, [subjectId]: p.teacher?.id }))}
                            style={{
                              padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 500,
                              border: `2px solid ${isSelected ? "#1a56db" : "#e5e7eb"}`,
                              background: isSelected ? "#eff6ff" : "#fff",
                              color: isSelected ? "#1e40af" : "#374151",
                            }}>
                            {p.teacher?.fullName}
                            {(p.vacantDay || p.vacantTime) && (
                              <span style={{ marginLeft: 6, fontSize: 11, color: "#b45309", background: "#fef3c7", borderRadius: 4, padding: "1px 6px" }}>
                                🚫 {p.vacantDay} {p.vacantTime}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {!isAssigned && (
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <button
                        onClick={() => handleApply(subjectId, group.subject?.name)}
                        disabled={applying[subjectId] || !selectedTeacher[subjectId]}
                        style={{
                          padding: "7px 18px",
                          background: applying[subjectId] || !selectedTeacher[subjectId] ? "#9ca3af" : "#16a34a",
                          color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
                          cursor: applying[subjectId] || !selectedTeacher[subjectId] ? "not-allowed" : "pointer"
                        }}>
                        {applying[subjectId] ? "Applying…" : "Select & Apply"}
                      </button>
                      {!selectedTeacher[subjectId] && (
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>← Click a teacher first</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
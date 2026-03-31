import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

const CURRENT_SEMESTER = "FIRST";
const CURRENT_YEAR     = "2024-2025";

export default function Enrollment() {
  const { user } = useAuth();

  // Block regular students entirely
  if (!user?.isIrregular) {
    return <Navigate to="/student" replace />;
  }

  const [sections,    setSections]    = useState([]);
  const [enrolled,    setEnrolled]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(null); // sectionId being saved
  const [error,       setError]       = useState("");
  const [search,      setSearch]      = useState("");
  const [successMsg,  setSuccessMsg]  = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [sectRes, enrollRes] = await Promise.all([
        // Back subjects = published sections where year_level < student's year level
        api.get("/schedules/back-subjects", {
          params: {
            semester:   CURRENT_SEMESTER,
            schoolYear: CURRENT_YEAR,
            studentId:  user?.userId,
          }
        }),
        // Already enrolled sections for this student
        api.get("/students/my-enrollments", {
          params: {
            semester:   CURRENT_SEMESTER,
            schoolYear: CURRENT_YEAR,
          }
        }),
      ]);
      setSections(sectRes.data?.data  ?? sectRes.data  ?? []);
      setEnrolled(enrollRes.data?.data ?? enrollRes.data ?? []);
    } catch {
      setError("Failed to load back subjects. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const enrolledIds = new Set(enrolled.map(e => e.scheduleId ?? e.id));

  async function handleEnroll(scheduleId) {
    setSaving(scheduleId);
    setError("");
    setSuccessMsg("");
    try {
      await api.post(`/schedules/${scheduleId}/assign-student`, {
        studentId: user?.userId,
      });
      setSuccessMsg("✅ Enrolled successfully!");
      loadData();
    } catch (e) {
      setError(e.response?.data?.message ?? "Enrollment failed. Check for time conflicts.");
    } finally {
      setSaving(null);
    }
  }

  async function handleDrop(scheduleId) {
    setSaving(scheduleId);
    setError("");
    setSuccessMsg("");
    try {
      await api.delete(`/schedules/${scheduleId}/remove-student`, {
        data: { studentId: user?.userId }
      });
      setSuccessMsg("✅ Dropped successfully.");
      loadData();
    } catch (e) {
      setError(e.response?.data?.message ?? "Failed to drop subject.");
    } finally {
      setSaving(null);
    }
  }

  const filtered = sections.filter(s =>
    s.subjectName?.toLowerCase().includes(search.toLowerCase()) ||
    s.subjectCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Back Subject Enrollment</h1>
        <p className="page-subtitle">
          Irregular students only · {CURRENT_SEMESTER === "FIRST" ? "1st" : "2nd"} Semester · {CURRENT_YEAR}
        </p>
      </div>

      {successMsg && (
        <div style={{ background: "#F0FBF4", border: "1px solid #52C27E", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "#1A6640", fontSize: 14 }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "#B91C1C", fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Summary bar */}
      <div style={{ background: "var(--surface-card)", borderRadius: "var(--radius-xl)", padding: "14px 20px", marginBottom: 20, border: "1.5px solid var(--grey-200)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 14, color: "var(--grey-600)" }}>
          <strong style={{ color: "var(--brand-secondary)" }}>{enrolled.length}</strong> back subject(s) enrolled this term
        </div>
        <input
          className="form-input"
          placeholder="Search by subject name or code…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 300, margin: 0 }}
        />
      </div>

      {loading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#9CA3AF" }}>Loading back subjects…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "var(--surface-card)", borderRadius: "var(--radius-xl)", padding: "48px 24px", textAlign: "center", color: "#9CA3AF", border: "1.5px solid var(--grey-200)" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>No back subjects available.</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>All your back subjects may already be enrolled, or none are scheduled this term.</div>
        </div>
      ) : (
        <div style={{ background: "var(--surface-card)", borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1.5px solid var(--grey-200)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "var(--grey-50)", borderBottom: "1.5px solid var(--grey-200)" }}>
                {["Subject","Code","Year Level","Section","Schedule","Room","Status","Action"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "var(--grey-600)", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const isEnrolled = enrolledIds.has(s.id);
                const isSaving   = saving === s.id;
                return (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--grey-100)", background: isEnrolled ? "#F0FBF4" : "transparent" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 500 }}>{s.subjectName}</td>
                    <td style={{ padding: "10px 14px", color: "var(--brand-secondary)", fontWeight: 600 }}>{s.subjectCode}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <span style={{ fontSize: 11, background: "#FEF3C7", color: "#92400E", borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>
                        Year {s.yearLevel}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>{s.sectionName}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#374151" }}>
                      {s.day1} {s.startTime1}
                      {s.day2 && <><br/>{s.day2} {s.startTime2}</>}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12 }}>{s.roomNumber || s.roomName}</td>
                    <td style={{ padding: "10px 14px" }}>
                      {isEnrolled ? (
                        <span style={{ fontSize: 11, background: "#D1FAE5", color: "#065F46", borderRadius: 6, padding: "3px 8px", fontWeight: 600 }}>Enrolled</span>
                      ) : (
                        <span style={{ fontSize: 11, background: "#F3F4F6", color: "#6B7280", borderRadius: 6, padding: "3px 8px", fontWeight: 600 }}>Available</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {isEnrolled ? (
                        <button
                          onClick={() => handleDrop(s.id)}
                          disabled={isSaving}
                          style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "1.5px solid #FCA5A5", background: "#FEF2F2", color: "#B91C1C", cursor: "pointer", fontWeight: 600 }}>
                          {isSaving ? "…" : "Drop"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnroll(s.id)}
                          disabled={isSaving}
                          style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "none", background: "#2D6A4F", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
                          {isSaving ? "…" : "Enroll"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
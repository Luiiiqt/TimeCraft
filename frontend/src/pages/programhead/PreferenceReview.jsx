import { useState, useEffect } from "react";
import api from "../../services/api";

function getDefaultTerm() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return {
    semester: month >= 6 && month <= 10 ? "FIRST" : "SECOND",
    schoolYear: `${year}-${year + 1}`,
  };
}
const { semester: SEMESTER, schoolYear: SCHOOL_YEAR } = getDefaultTerm();

export default function PreferenceReview() {
  const [prefs, setPrefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = () => {
    setLoading(true);
    api.get(`/program-head/preferences?semester=${SEMESTER}&schoolYear=${SCHOOL_YEAR}`)
      .then(res => { setPrefs(res.data?.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const review = async (id, decision) => {
    setError(""); setSuccess("");
    try {
      await api.put(`/program-head/preferences/${id}/review`, { decision });
      setSuccess(
        decision === "APPROVED"
          ? "Preference approved. Go to Subject Assignments to bind this teacher to a section."
          : "Preference rejected."
      );
      load();
    } catch (e) {
      setError(e.response?.data?.message ?? "Failed.");
    }
  };

  const STATUS_STYLE = {
    PENDING: { bg: "#fef3c7", color: "#92400e" },
    APPROVED: { bg: "#d1fae5", color: "#065f46" },
    REJECTED: { bg: "#fee2e2", color: "#991b1b" },
  };

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 1000, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: 4 }}>Teacher Preference Review</h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
        Review and approve teacher subject preferences before finalizing assignments.
      </p>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#dc2626", fontSize: 13 }}>⚠️ {error}</div>}
      {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#15803d", fontSize: 13 }}>✅ {success}</div>}

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1.5px solid #e5e7eb" }}>
              {["Teacher", "Subject", "Code", "Course", "Requested", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>Loading…</td></tr>
            ) : prefs.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>No preferences submitted yet.</td></tr>
            ) : prefs.map(p => {
              const s = STATUS_STYLE[p.status] || STATUS_STYLE.PENDING;
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 500 }}>{p.teacher?.fullName}</td>
                  <td style={{ padding: "10px 14px" }}>{p.subject?.name}</td>
                  <td style={{ padding: "10px 14px", color: "#1a56db", fontWeight: 600 }}>{p.subject?.code}</td>
                  <td style={{ padding: "10px 14px", color: "#6b7280" }}>—</td>
                  <td style={{ padding: "10px 14px", color: "#6b7280", fontSize: 12 }}>
                    {p.requestedAt ? new Date(p.requestedAt).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: 11, background: s.bg, color: s.color, borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {p.status === "PENDING" && (
                      <>
                        <button onClick={() => review(p.id, "APPROVED")}
                          style={{ fontSize: 11, padding: "4px 10px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                          Approve
                        </button>
                        <button onClick={() => review(p.id, "REJECTED")}
                          style={{ fontSize: 11, padding: "4px 10px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                          Reject
                        </button>
                      </>
                    )}
                    {p.status === "APPROVED" && (
                      <a href="/program-head/assignments"
                        style={{ fontSize: 11, padding: "4px 10px", background: "#dbeafe", color: "#1e40af", borderRadius: 6, fontWeight: 600, textDecoration: "none" }}>
                        → Assign to Section
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
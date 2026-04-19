import { useState, useEffect } from "react";
import api from "../../services/api";

const STATUS_STYLE = {
  PENDING:       { bg: "#fef3c7", color: "#92400e" },
  FOR_INTERVIEW: { bg: "#dbeafe", color: "#1e40af" },
  APPROVED:      { bg: "#d1fae5", color: "#065f46" },
  REJECTED:      { bg: "#fee2e2", color: "#991b1b" },
};

export default function IrregularStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [reviewing, setReviewing] = useState(null); // { studentId, status, notes }

  const load = () => {
    setLoading(true);
    api.get("/students/pending-irregular")
      .then(r => { setStudents(r.data?.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submitReview = async () => {
    if (!reviewing) return;
    try {
      await api.put(`/students/${reviewing.studentId}/application-status`, {
        status: reviewing.status,
        notes: reviewing.notes ?? "",
      });
      setMsg({ type: "success", text: `Status updated to ${reviewing.status}.` });
      setReviewing(null);
      load();
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.message ?? "Failed to update status." });
    }
  };

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 1000, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: 4 }}>Irregular Students</h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
        Review pending and for-interview irregular student applications.
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

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1.5px solid #e5e7eb" }}>
              {["Student", "Course", "Year Level", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>Loading…</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>No pending irregular applications.</td></tr>
            ) : students.map(s => {
              const style = STATUS_STYLE[s.applicationStatus] ?? STATUS_STYLE.PENDING;
              return (
                <tr key={s.userId} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 500 }}>{s.user?.fullName}</td>
                  <td style={{ padding: "10px 14px", color: "#6b7280" }}>{s.course?.code}</td>
                  <td style={{ padding: "10px 14px", color: "#6b7280" }}>Year {s.yearLevel}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 600, background: style.bg, color: style.color }}>
                      {s.applicationStatus}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["FOR_INTERVIEW", "APPROVED", "REJECTED"].map(action => (
                      <button key={action} onClick={() => setReviewing({ studentId: s.userId, status: action, notes: "" })}
                        style={{
                          fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "none",
                          cursor: "pointer", fontWeight: 600,
                          background: action === "APPROVED" ? "#16a34a" : action === "REJECTED" ? "#fef2f2" : "#dbeafe",
                          color: action === "APPROVED" ? "#fff" : action === "REJECTED" ? "#dc2626" : "#1e40af",
                        }}>
                        {action === "FOR_INTERVIEW" ? "Interview" : action === "APPROVED" ? "Approve" : "Reject"}
                      </button>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Review modal */}
      {reviewing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 16, color: "#111827" }}>
              Set Status: {reviewing.status}
            </h2>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Notes (optional)</label>
            <textarea rows={3} value={reviewing.notes}
              onChange={e => setReviewing(r => ({ ...r, notes: e.target.value }))}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 13, boxSizing: "border-box", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={() => setReviewing(null)} style={{ padding: "8px 18px", borderRadius: 8, border: "1.5px solid #d1d5db", background: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={submitReview} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#1a56db", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
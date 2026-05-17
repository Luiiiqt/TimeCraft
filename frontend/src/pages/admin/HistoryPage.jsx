import { useState, useEffect } from "react";
import api from "../../services/api";

const SEMESTERS = ["FIRST", "SECOND", "SUMMER"];
const YEARS = ["2024-2025", "2025-2026", "2026-2027", "2027-2028"];

export default function HistoryPage() {
  const [tab, setTab] = useState("schedule");
  const [semester, setSemester] = useState("FIRST");
  const [schoolYear, setSchoolYear] = useState("2026-2027");
  const [schedules, setSchedules] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab !== "schedule") return;
    setLoading(true);
    api.get("/schedules/history", { params: { semester, schoolYear } })
      .then(r => setSchedules(r.data?.data ?? []))
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false));
  }, [tab, semester, schoolYear]);

  useEffect(() => {
    if (tab !== "curriculum") return;
    setLoading(true);
    api.get("/curriculum/history-all")
      .then(r => setCurricula(r.data?.data ?? []))
      .catch(() => setCurricula([]))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div style={{ padding: "1.5rem", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: 4 }}>
        Archive History
      </h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        View previously deleted schedules and curricula.
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["schedule", "curriculum"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: "7px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: "1.5px solid #d1d5db", cursor: "pointer",
              background: tab === t ? "#92400e" : "#fff",
              color: tab === t ? "#fff" : "#374151",
            }}>
            {t === "schedule" ? "🗓 Schedules" : "📄 Curricula"}
          </button>
        ))}
      </div>

      {tab === "schedule" && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 3 }}>SEMESTER</label>
              <select value={semester} onChange={e => setSemester(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: 7, border: "1.5px solid #d1d5db", fontSize: 13 }}>
                {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 3 }}>SCHOOL YEAR</label>
              <select value={schoolYear} onChange={e => setSchoolYear(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: 7, border: "1.5px solid #d1d5db", fontSize: 13 }}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <p style={{ color: "#6b7280", fontSize: 13 }}>Loading…</p>
          ) : schedules.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: 13 }}>No archived schedules for this term.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f3f4f6" }}>
                    {["Subject", "Teacher", "Room", "Section", "Day 1", "Day 2", "Status", "Archived By", "Archived At"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "1.5px solid #e5e7eb" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schedules.map(s => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "8px 12px" }}>{s.subjectCode} — {s.subjectName}</td>
                      <td style={{ padding: "8px 12px" }}>{s.teacherName}</td>
                      <td style={{ padding: "8px 12px" }}>{s.roomName ?? "Online"}</td>
                      <td style={{ padding: "8px 12px" }}>Yr {s.yearLevel} {s.sectionName}</td>
                      <td style={{ padding: "8px 12px" }}>{s.timeslotLabel1}</td>
                      <td style={{ padding: "8px 12px" }}>{s.timeslotLabel2}</td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                          background: s.status === "PUBLISHED" ? "#d1fae5" : "#fef3c7",
                          color: s.status === "PUBLISHED" ? "#065f46" : "#92400e"
                        }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: "8px 12px", color: "#6b7280" }}>{s.deletedBy ?? "—"}</td>
                      <td style={{ padding: "8px 12px", color: "#6b7280" }}>{s.deletedAt ? new Date(s.deletedAt).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "curriculum" && (
        loading ? <p style={{ color: "#6b7280", fontSize: 13 }}>Loading…</p>
          : curricula.length === 0
            ? <p style={{ color: "#6b7280", fontSize: 13 }}>No curricula found.</p>
            : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f3f4f6" }}>
                      {["Course", "Name", "Effective Year", "Imported At", "Status"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "1.5px solid #e5e7eb" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {curricula.map(c => (
                      <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "8px 12px" }}>{c.course?.code} — {c.course?.name}</td>
                        <td style={{ padding: "8px 12px", fontWeight: 600 }}>{c.name}</td>
                        <td style={{ padding: "8px 12px" }}>{c.effectiveYear}</td>
                        <td style={{ padding: "8px 12px", color: "#6b7280" }}>{c.importedAt ? new Date(c.importedAt).toLocaleDateString() : "—"}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <span style={{
                            padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                            background: c.active ? "#d1fae5" : "#f3f4f6",
                            color: c.active ? "#065f46" : "#6b7280"
                          }}>
                            {c.active ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
      )}
    </div>
  );
}
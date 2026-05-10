import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

const SEMESTER_OPTIONS = [
  { value: "FIRST", label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "SUMMER", label: "Summer" },
];
const SCHOOL_YEARS = ["2024-2025", "2025-2026", "2026-2027"];

function getCurrentTerm() {
  const m = new Date().getMonth() + 1;
  const y = new Date().getFullYear();
  return { semester: m >= 6 && m <= 10 ? "FIRST" : "SECOND", schoolYear: `${y}-${y + 1}` };
}

export default function GEDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [term, setTerm] = useState(getCurrentTerm());
  const [grouped, setGrouped] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/ge-coordinator/preferences/grouped?semester=${term.semester}&schoolYear=${term.schoolYear}`)
      .then(r => setGrouped(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [term]);

  const total = grouped.length;
  const finalized = grouped.filter(g => g.assigned).length;
  const pending = total - finalized;

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 1100, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>
          GE Coordinator Dashboard
        </h1>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
          Welcome back, {user?.fullName}. Manage GE subject-teacher assignments.
        </p>
      </div>

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

      <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
        {[
          { label: "GE Subjects with Votes", value: total, color: "#1a56db" },
          { label: "Pending Assignment", value: pending, color: "#f59e0b" },
          { label: "Finalized", value: finalized, color: "#16a34a" },
        ].map(s => (
          <div key={s.label} style={{
            background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
            padding: "20px 24px", borderLeft: `4px solid ${s.color}`, minWidth: 180,
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div onClick={() => navigate("/ge/preferences")} style={{
          background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
          padding: "20px 24px", cursor: "pointer"
        }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>🗳️</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>Assign GE Teachers</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            Review teacher votes and assign GE teachers to minor subjects.
          </div>
          {pending > 0 && (
            <div style={{ marginTop: 10, fontSize: 11, background: "#fef3c7", color: "#92400e", borderRadius: 6, padding: "3px 10px", display: "inline-block", fontWeight: 600 }}>
              {pending} pending
            </div>
          )}
        </div>
        <div onClick={() => navigate("/ge/schedule")} style={{
          background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
          padding: "20px 24px", cursor: "pointer"
        }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>📅</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>View Schedule</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            View the published timetable for GE subjects.
          </div>
        </div>
      </div>
    </div>
  );
}
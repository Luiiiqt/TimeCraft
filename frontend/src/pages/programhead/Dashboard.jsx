import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

function StatCard({ label, value, color, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
      padding: "20px 24px", cursor: onClick ? "pointer" : "default",
      borderLeft: `4px solid ${color}`, minWidth: 180,
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{label}</div>
    </div>
  );
}

const SCHOOL_YEARS = ["2024-2025", "2025-2026", "2026-2027"];
const SEMESTER_OPTIONS = [
  { value: "FIRST", label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "SUMMER", label: "Summer" },
];

function getCurrentTerm() {
  const m = new Date().getMonth() + 1;
  const y = new Date().getFullYear();
  return { semester: m >= 6 && m <= 10 ? "FIRST" : "SECOND", schoolYear: `${y}-${y + 1}` };
}

export default function PHDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [term, setTerm] = useState(getCurrentTerm());
  const [courses, setCourses] = useState([]);
  const [grouped, setGrouped] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/program-head/my-courses").then(r => setCourses(r.data?.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/program-head/preferences/grouped?semester=${term.semester}&schoolYear=${term.schoolYear}`),
      api.get(`/program-head/assignments?semester=${term.semester}&schoolYear=${term.schoolYear}`),
    ]).then(([gRes, aRes]) => {
      setGrouped(gRes.data?.data ?? []);
      setAssignments(aRes.data?.data ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [term]);

  const totalSubjects = grouped.length;
  const finalized = grouped.filter(g => g.assigned).length;
  const pending = totalSubjects - finalized;
  const totalAssignments = assignments.length;

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 1100, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>
          Program Head Dashboard
        </h1>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
          Welcome back, {user?.fullName}. Manage subject-teacher assignments for your courses.
        </p>
      </div>

      {/* Term selector */}
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

      {/* Stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
        <StatCard label="Managed Courses" value={courses.length} color="#1a56db" />
        <StatCard label="Subjects with Votes" value={totalSubjects} color="#7c3aed" onClick={() => navigate("/ph/preferences")} />
        <StatCard label="Pending Assignment" value={pending} color="#f59e0b" onClick={() => navigate("/ph/preferences")} />
        <StatCard label="Finalized" value={finalized} color="#16a34a" onClick={() => navigate("/ph/preferences")} />
      </div>

      {/* Courses */}
      {courses.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "20px 24px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 14 }}>Your Courses</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {courses.map(c => (
              <div key={c.id} style={{
                padding: "8px 16px", borderRadius: 8, background: "#f0f9ff",
                border: "1px solid #bae6fd", fontSize: 13, fontWeight: 600, color: "#0369a1"
              }}>
                {c.code} — {c.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div onClick={() => navigate("/ph/subjects")} style={{
          background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
          padding: "20px 24px", cursor: "pointer"
        }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>📚</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>View Subjects</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            View all subjects in your curriculum by year level and semester.
          </div>
        </div>
        <div onClick={() => navigate("/ph/schedule")} style={{
          background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
          padding: "20px 24px", cursor: "pointer"
        }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>📅</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>View Schedule</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            View the published timetable for your courses.
          </div>
        </div>
        <div onClick={() => navigate("/ph/preferences")} style={{
          background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
          padding: "20px 24px", cursor: "pointer"
        }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>🗳️</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>Assign Teachers</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            Review teacher votes and assign teachers to subjects.
          </div>
          {pending > 0 && (
            <div style={{ marginTop: 10, fontSize: 11, background: "#fef3c7", color: "#92400e", borderRadius: 6, padding: "3px 10px", display: "inline-block", fontWeight: 600 }}>
              {pending} pending
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
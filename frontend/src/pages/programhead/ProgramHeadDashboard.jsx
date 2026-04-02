import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

const SEMESTER   = "1st";
const SCHOOL_YEAR = "2024-2025";

export default function ProgramHeadDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [pending,     setPending]     = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/program-head/assignments?semester=${SEMESTER}&schoolYear=${SCHOOL_YEAR}`),
      api.get(`/program-head/preferences?semester=${SEMESTER}&schoolYear=${SCHOOL_YEAR}`),
    ]).then(([aRes, pRes]) => {
      setAssignments(aRes.data?.data ?? []);
      setPending((pRes.data?.data ?? []).filter(p => p.status === "PENDING"));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const finalized = assignments.filter(a => a.finalized).length;

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 1000, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: 4 }}>
        Program Head Dashboard
      </h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 28 }}>
        {user?.departmentName} · {SEMESTER} Semester {SCHOOL_YEAR}
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Assignments", value: loading ? "…" : assignments.length, color: "#1a56db" },
          { label: "Finalized",         value: loading ? "…" : finalized,           color: "#16a34a" },
          { label: "Pending Approvals", value: loading ? "…" : pending.length,      color: "#d97706" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "20px 22px", border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {[
          { to: "/program-head/assignments", icon: "📋", label: "Manage Subject Assignments", color: "#1a56db" },
          { to: "/program-head/preferences", icon: "✅", label: "Review Teacher Preferences",  color: "#16a34a" },
          { to: "/program-head/generate",    icon: "⚡", label: "Generate Schedule",            color: "#7c3aed" },
        ].map(l => (
          <Link key={l.to} to={l.to} style={{
            background: "#fff", borderRadius: 12, padding: "20px 18px",
            border: "1px solid #e5e7eb", borderTop: `3px solid ${l.color}`,
            textDecoration: "none", display: "block",
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{l.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{l.label}</div>
            <div style={{ fontSize: 12, color: l.color, marginTop: 4, fontWeight: 600 }}>→</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
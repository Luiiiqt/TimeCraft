import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useConflict from "../../hooks/useConflict";
import api from "../../services/api";

const CURRENT_SEMESTER = "FIRST";
const CURRENT_YEAR     = "2024-2025";

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, accentColor, onClick }) {
  return (
    <button className="stat-card" onClick={onClick} style={{ width: "100%", background: "var(--surface-card)" }}>
      <div
        className="stat-icon"
        style={{ background: accentColor + "18" }}
      >
        <span style={{ fontSize: "1.4rem" }}>{icon}</span>
      </div>
      <div>
        <div className="stat-value" style={{ color: accentColor }}>
          {value}
        </div>
        <div className="stat-label">{label}</div>
      </div>
    </button>
  );
}

// ── Quick Action Card ─────────────────────────────────────────────────────────

function QuickCard({ label, icon, accentColor, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background    : "var(--surface-card)",
        border        : `1.5px solid var(--grey-200)`,
        borderTop     : `3px solid ${accentColor}`,
        borderRadius  : "var(--radius-xl)",
        padding       : "var(--space-5) var(--space-5)",
        cursor        : "pointer",
        textAlign     : "left",
        display       : "flex",
        flexDirection : "column",
        gap           : "var(--space-3)",
        boxShadow     : "var(--shadow-sm)",
        transition    : "box-shadow var(--ease-base), transform var(--ease-base)",
        fontFamily    : "var(--font-body)",
        width         : "100%",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{
        width           : 44,
        height          : 44,
        borderRadius    : "var(--radius-lg)",
        background      : accentColor + "18",
        display         : "flex",
        alignItems      : "center",
        justifyContent  : "center",
        fontSize        : "1.6rem",
      }}>
        {icon}
      </div>
      <div style={{
        fontSize   : "var(--text-sm)",
        fontWeight : "var(--weight-semibold)",
        color      : "var(--grey-900)",
      }}>
        {label}
      </div>
      <div style={{
        fontSize   : "var(--text-sm)",
        color      : accentColor,
        fontWeight : "var(--weight-bold)",
      }}>
        →
      </div>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate              = useNavigate();
  const { user }              = useAuth();
  const { unresolvedCount, fetchCount } = useConflict();

  const [stats,        setStats]        = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setStatsLoading(true);
      try {
        const [deptRes, roomRes, subjectRes, studentRes, conflictCount] = await Promise.all([
          api.get("/departments"),
          api.get("/rooms"),
          api.get("/subjects"),
          api.get("/students"),
          fetchCount(),
        ]);
        const departments = deptRes.data?.data    ?? deptRes.data    ?? [];
        const rooms       = roomRes.data?.data     ?? roomRes.data     ?? [];
        const subjects    = subjectRes.data?.data  ?? subjectRes.data  ?? [];
        const students    = studentRes.data?.data  ?? studentRes.data  ?? [];
        setStats({
          departments : Array.isArray(departments) ? departments.length : 0,
          rooms       : Array.isArray(rooms)       ? rooms.length       : 0,
          subjects    : Array.isArray(subjects)    ? subjects.length    : 0,
          students    : Array.isArray(students)    ? students.length    : 0,
          conflicts   : conflictCount,
        });
      } catch {
        setStats({ departments: "--", rooms: "--", conflicts: "--" });
      } finally {
        setStatsLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const val = (v) => (statsLoading ? "…" : v);

  return (
    <div className="fade-in">

      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          {CURRENT_SEMESTER} Semester · {CURRENT_YEAR}
        </p>
      </div>

      {/* Conflict alert banner */}
      {!statsLoading && stats?.conflicts > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: "var(--space-6)" }}>
          <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>⚠️</span>
          <div>
            <strong>
              {stats.conflicts} unresolved conflict{stats.conflicts !== 1 ? "s" : ""}
            </strong>{" "}
            detected in the current schedule.{" "}
            <button
              onClick={() => navigate("/admin/reports")}
              style={{
                background    : "none",
                border        : "none",
                color         : "var(--color-danger)",
                fontWeight    : "var(--weight-bold)",
                cursor        : "pointer",
                fontSize      : "var(--text-sm)",
                padding       : 0,
                textDecoration: "underline",
                fontFamily    : "var(--font-body)",
              }}
            >
              View in Reports →
            </button>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{
        display              : "grid",
        gridTemplateColumns  : "repeat(5, 1fr)",
        gap                  : "var(--space-4)",
        marginBottom         : "var(--space-8)",
      }}>
        <StatCard
          label="Departments"
          value={val(stats?.departments)}
          icon="⬡"
          accentColor="var(--brand-secondary)"
          onClick={() => navigate("/admin/departments")}
        />
        <StatCard
          label="Rooms"
          value={val(stats?.rooms)}
          icon="▣"
          accentColor="#0891b2"
          onClick={() => navigate("/admin/rooms")}
        />
        <StatCard
          label="Subjects"
          value={val(stats?.subjects)}
          icon="📖"
          accentColor="#7c3aed"
          onClick={() => navigate("/admin/subjects")}
        />
        <StatCard
          label="Students"
          value={val(stats?.students)}
          icon="🎓"
          accentColor="#0f766e"
          onClick={() => navigate("/admin/students")}
        />
        <StatCard
          label="Unresolved Conflicts"
          value={val(stats?.conflicts)}
          icon="⚠️"
          accentColor={stats?.conflicts > 0 ? "var(--color-danger)" : "var(--color-success)"}
          onClick={() => navigate("/admin/reports")}
        />
      </div>

      {/* Quick actions */}
      <h2 className="section-title">Quick Actions</h2>
      <div style={{
        display              : "grid",
        gridTemplateColumns  : "repeat(3, 1fr)",
        gap                  : "var(--space-4)",
      }}>
        <QuickCard
          label="Generate Schedule"
          icon="⚡"
          accentColor="var(--brand-secondary)"
          onClick={() => navigate("/admin/generate")}
        />
        <QuickCard
          label="Manage Departments"
          icon="⬡"
          accentColor="#0891b2"
          onClick={() => navigate("/admin/departments")}
        />
        <QuickCard
          label="Manage Rooms"
          icon="▣"
          accentColor="#7c3aed"
          onClick={() => navigate("/admin/rooms")}
        />
        <QuickCard
          label="Manage Subjects"
          icon="📖"
          accentColor="#b45309"
          onClick={() => navigate("/admin/subjects")}
        />
        <QuickCard
          label="Manage Students"
          icon="🎓"
          accentColor="#0f766e"
          onClick={() => navigate("/admin/students")}
        />
        <QuickCard
          label="Reports"
          icon="↗"
          accentColor="#be185d"
          onClick={() => navigate("/admin/reports")}
        />
        <QuickCard
          label="Teacher Availability"
          icon="🕐"
          accentColor="#0369a1"
          onClick={() => navigate("/admin/availability")}
        />
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useConflict from "../../hooks/useConflict";
import api from "../../services/api";

// ── Term defaults ─────────────────────────────────────────────────────────────
const CURRENT_SEMESTER  = "FIRST";
const CURRENT_YEAR      = "2024-2025";

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate            = useNavigate();
  const { user, logout }    = useAuth();
  const { unresolvedCount, fetchCount } = useConflict();

  const [stats,        setStats]        = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Fetch dashboard stats on mount ────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setStatsLoading(true);
      try {
        const [deptRes, roomRes, conflictCount] = await Promise.all([
          api.get("/departments"),
          api.get("/rooms"),
          fetchCount(),
        ]);
        const departments = deptRes.data?.data ?? deptRes.data ?? [];
        const rooms       = roomRes.data?.data ?? roomRes.data ?? [];
        setStats({
          departments : Array.isArray(departments) ? departments.length : 0,
          rooms       : Array.isArray(rooms)       ? rooms.length       : 0,
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

  const handleLogout = () => { logout(); navigate("/login"); };

  // ── Stat cards config ─────────────────────────────────────────────────────
  const statCards = [
    {
      label : "Departments",
      value : statsLoading ? "…" : stats?.departments,
      icon  : "🏫",
      color : "#1a56db",
      action: () => navigate("/admin/departments"),
    },
    {
      label : "Rooms",
      value : statsLoading ? "…" : stats?.rooms,
      icon  : "🚪",
      color : "#0891b2",
      action: () => navigate("/admin/rooms"),
    },
    {
      label : "Unresolved Conflicts",
      value : statsLoading ? "…" : stats?.conflicts,
      icon  : "⚠️",
      color : stats?.conflicts > 0 ? "#dc2626" : "#16a34a",
      action: () => navigate("/admin/reports"),
    },
  ];

  // ── Quick links ───────────────────────────────────────────────────────────
  const quickLinks = [
    { label: "Generate Schedule", icon: "⚡", path: "/admin/generate",    bg: "#1a56db" },
    { label: "Manage Departments",icon: "🏫", path: "/admin/departments", bg: "#0891b2" },
    { label: "Manage Rooms",      icon: "🚪", path: "/admin/rooms",       bg: "#7c3aed" },
    { label: "Reports",           icon: "📊", path: "/admin/reports",     bg: "#0f766e" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <span>⏱</span>
          <span style={styles.sidebarLogoText}>TimeCraft</span>
        </div>
        <nav style={styles.nav}>
          {quickLinks.map((l) => (
            <button key={l.path} onClick={() => navigate(l.path)}
              style={styles.navItem}>
              <span style={styles.navIcon}>{l.icon}</span>
              {l.label}
            </button>
          ))}
        </nav>
        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>{user?.fullName?.[0] ?? "A"}</div>
            <div>
              <div style={styles.userName}>{user?.fullName ?? "Admin"}</div>
              <div style={styles.userRole}>Administrator</div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Dashboard</h1>
            <p style={styles.pageSubtitle}>
              {CURRENT_SEMESTER} Semester · {CURRENT_YEAR}
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div style={styles.statsGrid}>
          {statCards.map((s) => (
            <button key={s.label} onClick={s.action} style={styles.statCard}>
              <div style={{ ...styles.statIcon, backgroundColor: s.color + "18" }}>
                <span style={{ fontSize: "1.5rem" }}>{s.icon}</span>
              </div>
              <div>
                <div style={{ ...styles.statValue, color: s.color }}>
                  {s.value}
                </div>
                <div style={styles.statLabel}>{s.label}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Quick actions */}
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.quickGrid}>
          {quickLinks.map((l) => (
            <button key={l.path} onClick={() => navigate(l.path)}
              style={{ ...styles.quickCard, borderTop: `4px solid ${l.bg}` }}>
              <div style={{ ...styles.quickIcon, backgroundColor: l.bg + "18" }}>
                <span style={{ fontSize: "1.8rem" }}>{l.icon}</span>
              </div>
              <span style={styles.quickLabel}>{l.label}</span>
              <span style={{ ...styles.quickArrow, color: l.bg }}>→</span>
            </button>
          ))}
        </div>

        {/* Conflict alert */}
        {!statsLoading && stats?.conflicts > 0 && (
          <div style={styles.conflictAlert}>
            <span style={{ fontSize: "1.2rem" }}>⚠️</span>
            <div>
              <strong>
                {stats.conflicts} unresolved conflict{stats.conflicts !== 1 ? "s" : ""}
              </strong>{" "}
              detected in the current schedule.{" "}
              <button onClick={() => navigate("/admin/reports")}
                style={styles.conflictLink}>
                View in Reports →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: {
    display       : "flex",
    minHeight     : "100vh",
    fontFamily    : "'Sora', 'Segoe UI', sans-serif",
    backgroundColor: "#f8faff",
  },
  sidebar: {
    width          : "240px",
    backgroundColor: "#0f2057",
    display        : "flex",
    flexDirection  : "column",
    padding        : "1.5rem 1rem",
    flexShrink     : 0,
  },
  sidebarLogo: {
    display     : "flex",
    alignItems  : "center",
    gap         : "0.5rem",
    fontSize    : "1.3rem",
    color       : "#fff",
    marginBottom: "2rem",
    paddingLeft : "0.5rem",
  },
  sidebarLogoText: { fontWeight: "700", letterSpacing: "-0.02em" },
  nav: { display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 },
  navItem: {
    display        : "flex",
    alignItems     : "center",
    gap            : "0.6rem",
    padding        : "0.65rem 0.75rem",
    borderRadius   : "8px",
    border         : "none",
    background     : "transparent",
    color          : "rgba(255,255,255,0.75)",
    fontSize       : "0.9rem",
    cursor         : "pointer",
    textAlign      : "left",
    transition     : "background 0.15s, color 0.15s",
  },
  navIcon: { fontSize: "1rem" },
  sidebarFooter: { borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1rem" },
  userInfo: { display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" },
  avatar: {
    width          : "36px",
    height         : "36px",
    borderRadius   : "50%",
    backgroundColor: "#1a56db",
    color          : "#fff",
    display        : "flex",
    alignItems     : "center",
    justifyContent : "center",
    fontWeight     : "700",
    fontSize       : "0.9rem",
    flexShrink     : 0,
  },
  userName  : { color: "#fff", fontSize: "0.85rem", fontWeight: "600" },
  userRole  : { color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" },
  logoutBtn : {
    width          : "100%",
    padding        : "0.5rem",
    backgroundColor: "rgba(255,255,255,0.07)",
    border         : "1px solid rgba(255,255,255,0.12)",
    borderRadius   : "6px",
    color          : "rgba(255,255,255,0.65)",
    fontSize       : "0.82rem",
    cursor         : "pointer",
  },
  main: { flex: 1, padding: "2rem 2.5rem", overflowY: "auto" },
  header: {
    display        : "flex",
    justifyContent : "space-between",
    alignItems     : "flex-start",
    marginBottom   : "2rem",
  },
  pageTitle   : { fontSize: "1.75rem", fontWeight: "700", color: "#111827", margin: "0 0 0.2rem", letterSpacing: "-0.02em" },
  pageSubtitle: { color: "#6b7280", fontSize: "0.9rem", margin: 0 },
  sectionTitle: { fontSize: "1.1rem", fontWeight: "700", color: "#111827", margin: "2rem 0 1rem" },
  // Stat grid
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" },
  statCard: {
    display        : "flex",
    alignItems     : "center",
    gap            : "1rem",
    backgroundColor: "#fff",
    borderRadius   : "12px",
    padding        : "1.25rem 1.5rem",
    border         : "1px solid #e5e7eb",
    cursor         : "pointer",
    textAlign      : "left",
    boxShadow      : "0 1px 4px rgba(0,0,0,0.04)",
    transition     : "box-shadow 0.15s",
  },
  statIcon  : { width: "48px", height: "48px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  statValue : { fontSize: "2rem", fontWeight: "700", lineHeight: 1 },
  statLabel : { fontSize: "0.82rem", color: "#6b7280", marginTop: "0.2rem" },
  // Quick grid
  quickGrid : { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" },
  quickCard : {
    backgroundColor: "#fff",
    border         : "1px solid #e5e7eb",
    borderRadius   : "12px",
    padding        : "1.25rem",
    cursor         : "pointer",
    textAlign      : "left",
    display        : "flex",
    flexDirection  : "column",
    gap            : "0.75rem",
    boxShadow      : "0 1px 4px rgba(0,0,0,0.04)",
    transition     : "box-shadow 0.15s",
  },
  quickIcon : { width: "44px", height: "44px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: "0.9rem", fontWeight: "600", color: "#111827", flex: 1 },
  quickArrow: { fontSize: "1.1rem", fontWeight: "700" },
  // Conflict alert
  conflictAlert: {
    marginTop      : "1.5rem",
    display        : "flex",
    alignItems     : "flex-start",
    gap            : "0.75rem",
    backgroundColor: "#fef2f2",
    border         : "1px solid #fecaca",
    borderRadius   : "10px",
    padding        : "1rem 1.25rem",
    color          : "#7f1d1d",
    fontSize       : "0.9rem",
  },
  conflictLink: {
    background    : "none",
    border        : "none",
    color         : "#dc2626",
    fontWeight    : "700",
    cursor        : "pointer",
    fontSize      : "0.9rem",
    padding       : 0,
    textDecoration: "underline",
  },
};
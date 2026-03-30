import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

// ── Nav config per role ───────────────────────────────────────────────────────

const ADMIN_NAV = [
  { section: "Overview" },
  { to: "/admin",              icon: "📊", label: "Dashboard" },
  { section: "Schedule" },
  { to: "/admin/generate",     icon: "⚡", label: "Generate Schedule" },
  { to: "/admin/reports",      icon: "📈", label: "Reports" },
  { section: "Management" },
  { to: "/admin/departments",  icon: "🏛️", label: "Departments" },
  { to: "/admin/rooms",        icon: "🚪", label: "Rooms" },
];

const TEACHER_NAV = [
  { section: "Overview" },
  { to: "/teacher",            icon: "🏠", label: "Dashboard" },
  { section: "My Schedule" },
  { to: "/teacher/schedule",   icon: "📅", label: "View Schedule" },
  { to: "/teacher/availability",icon:"🕐", label: "Set Availability" },
];

const STUDENT_NAV = [
  { section: "Overview" },
  { to: "/student",            icon: "🏠", label: "Dashboard" },
  { section: "My Timetable" },
  { to: "/student/timetable",  icon: "📅", label: "View Timetable" },
];

function getNav(role) {
  if (role === "ADMIN")   return ADMIN_NAV;
  if (role === "TEACHER") return TEACHER_NAV;
  return STUDENT_NAV;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = getNav(role);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = (user?.fullName || "U")
    .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  // Sidebar accent color per role
  const accent = role === "TEACHER" ? "var(--green)" : role === "ADMIN" ? "var(--primary)" : "#7C3AED";

  return (
    <aside className="sidebar" style={{ background: accent }}>
      {/* Logo */}
      <div className="sidebar-logo">
        <h1>TimeCraft</h1>
        <span>Scheduling System</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          if (item.section) {
            return (
              <div key={i} className="nav-section-label">{item.section}</div>
            );
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin" || item.to === "/teacher" || item.to === "/student"}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer — user info + logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.fullName || "User"}</div>
            <div className="sidebar-user-role">{role || "—"}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}
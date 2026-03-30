import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

// ── Nav config per role ───────────────────────────────────────────────────────

const ADMIN_NAV = [
  { section: "Overview" },
  { to: "/admin",             icon: "◈",  label: "Dashboard"        },
  { section: "Schedule" },
  { to: "/admin/generate",    icon: "⚡",  label: "Generate Schedule" },
  { to: "/admin/reports",     icon: "↗",  label: "Reports"           },
  { section: "Management" },
  { to: "/admin/departments", icon: "⬡",  label: "Departments"       },
  { to: "/admin/rooms",       icon: "▣",  label: "Rooms"             },
];

const TEACHER_NAV = [
  { section: "Overview" },
  { to: "/teacher",              icon: "◈", label: "Dashboard"      },
  { section: "My Schedule" },
  { to: "/teacher/schedule",     icon: "▦", label: "View Schedule"  },
  { to: "/teacher/availability", icon: "◷", label: "Set Availability" },
];

const STUDENT_NAV = [
  { section: "Overview" },
  { to: "/student",           icon: "◈", label: "Dashboard"     },
  { section: "My Timetable" },
  { to: "/student/timetable", icon: "▦", label: "View Timetable" },
];

function getNav(role) {
  if (role === "ADMIN")   return ADMIN_NAV;
  if (role === "TEACHER") return TEACHER_NAV;
  return STUDENT_NAV;
}

// ── Role → sidebar gradient ───────────────────────────────────────────────────

function getSidebarStyle(role) {
  if (role === "ADMIN") return {
    background: "linear-gradient(180deg, #1E2875 0%, #16205E 100%)",
  };
  if (role === "TEACHER") return {
    background: "linear-gradient(180deg, #14432A 0%, #0D3020 100%)",
  };
  // STUDENT
  return {
    background: "linear-gradient(180deg, #2D1B69 0%, #1E1149 100%)",
  };
}

function getAvatarStyle(role) {
  if (role === "ADMIN")   return { background: "rgba(108,127,255,0.35)" };
  if (role === "TEACHER") return { background: "rgba(52,196,124,0.35)"  };
  return                         { background: "rgba(155,119,255,0.35)" };
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
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="sidebar" style={getSidebarStyle(role)}>

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
              <div key={`section-${i}`} className="nav-section-label">
                {item.section}
              </div>
            );
          }

          const isExact =
            item.to === "/admin" ||
            item.to === "/teacher" ||
            item.to === "/student";

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={isExact}
              className={({ isActive }) =>
                `nav-item${isActive ? " active" : ""}`
              }
            >
              <span className="icon" style={{ fontStyle: "normal" }}>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer — user + logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar" style={getAvatarStyle(role)}>
            {initials}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              {user?.fullName || "User"}
            </div>
            <div className="sidebar-user-role">
              {role || "—"}
            </div>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
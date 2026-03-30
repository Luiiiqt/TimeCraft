import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

// ── Page title map ────────────────────────────────────────────────────────────

const PAGE_META = {
  "/admin":               { title: "Dashboard",          section: "Overview"    },
  "/admin/generate":      { title: "Generate Schedule",  section: "Schedule"    },
  "/admin/reports":       { title: "Reports",            section: "Schedule"    },
  "/admin/departments":   { title: "Departments",        section: "Management"  },
  "/admin/rooms":         { title: "Rooms",              section: "Management"  },
  "/teacher":             { title: "Dashboard",          section: "Overview"    },
  "/teacher/schedule":    { title: "My Schedule",        section: "Schedule"    },
  "/teacher/availability":{ title: "Set Availability",   section: "Schedule"    },
  "/student":             { title: "Dashboard",          section: "Overview"    },
  "/student/timetable":   { title: "My Timetable",       section: "Timetable"   },
};

// ── Avatar colour per role ────────────────────────────────────────────────────

function getAvatarBg(role) {
  if (role === "ADMIN")   return "var(--brand-secondary)";
  if (role === "TEACHER") return "var(--teacher-mid)";
  return "var(--student-mid)";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Navbar({ conflictCount = 0 }) {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const meta    = PAGE_META[location.pathname] ?? { title: "TimeCraft", section: null };
  const initials = (user?.fullName || "U")
    .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const badgeClass =
    role === "ADMIN"   ? "topbar-badge badge-admin"   :
    role === "TEACHER" ? "topbar-badge badge-teacher" :
                         "topbar-badge badge-student";

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate("/login");
  };

  const roleHome =
    role === "ADMIN"   ? "/admin"   :
    role === "TEACHER" ? "/teacher" : "/student";

  return (
    <header className="topbar">

      {/* Left: breadcrumb / title */}
      <div className="topbar-left">
        {meta.section && (
          <div className="topbar-breadcrumb">
            <span>{meta.section}</span>
            <span style={{ color: "var(--grey-300)" }}>›</span>
          </div>
        )}
        <span className="topbar-title">{meta.title}</span>
      </div>

      {/* Right: actions */}
      <div className="topbar-right">

        {/* Role chip */}
        <span className={badgeClass}>{role}</span>

        {/* Conflict notification bell — only visible to admin when there are conflicts */}
        {role === "ADMIN" && conflictCount > 0 && (
          <button
            className="topbar-icon-btn"
            title={`${conflictCount} unresolved conflict${conflictCount !== 1 ? "s" : ""}`}
            onClick={() => navigate("/admin/reports")}
          >
            🔔
            <span className="notif-dot" />
          </button>
        )}

        {/* User avatar + dropdown */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <div
            className="topbar-avatar"
            style={{ background: getAvatarBg(role) }}
            onClick={() => setDropdownOpen(v => !v)}
            title={user?.fullName}
          >
            {initials}
          </div>

          {dropdownOpen && (
            <div className="topbar-dropdown">
              {/* User info header */}
              <div className="topbar-dropdown-header">
                <div className="topbar-dropdown-name">
                  {user?.fullName || "User"}
                </div>
                <div className="topbar-dropdown-email">
                  {user?.email || ""}
                </div>
              </div>

              {/* Navigation items */}
              <button
                className="topbar-dropdown-item"
                onClick={() => { setDropdownOpen(false); navigate(roleHome); }}
              >
                ◈ &nbsp;Dashboard
              </button>

              <div className="topbar-dropdown-divider" />

              {/* Sign out */}
              <button
                className="topbar-dropdown-item danger"
                onClick={handleLogout}
              >
                ↩ &nbsp;Sign Out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
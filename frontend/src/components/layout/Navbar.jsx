import { useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

// ── Route → page title map ────────────────────────────────────────────────────
const PAGE_TITLES = {
  "/admin":              "Admin Dashboard",
  "/admin/generate":     "Generate Schedule",
  "/admin/reports":      "Reports",
  "/admin/departments":  "Manage Departments",
  "/admin/rooms":        "Manage Rooms",
  "/teacher":            "Teacher Dashboard",
  "/teacher/schedule":   "My Schedule",
  "/teacher/availability":"Set Availability",
  "/student":            "Student Dashboard",
  "/student/timetable":  "My Timetable",
};

export default function Navbar() {
  const { role } = useAuth();
  const location = useLocation();

  const title = PAGE_TITLES[location.pathname] ?? "TimeCraft";

  const badgeClass =
    role === "ADMIN"   ? "topbar-badge badge-admin" :
    role === "TEACHER" ? "topbar-badge badge-teacher" :
                         "topbar-badge badge-student";

  return (
    <header className="topbar">
      <span className="topbar-title">{title}</span>
      <span className={badgeClass}>{role}</span>
    </header>
  );
}
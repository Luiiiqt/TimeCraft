import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "../context/AuthContext";
import useAuth from "../hooks/useAuth";
import Navbar         from "../components/layout/Navbar";
import Sidebar        from "../components/layout/Sidebar";
import ProtectedRoute from "../components/layout/ProtectedRoute";

// ── Lazy pages ────────────────────────────────────────────────────────────────

const LoginPage         = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage      = lazy(() => import("../pages/auth/RegisterPage"));

const StudentDashboard  = lazy(() => import("../pages/student/StudentDashboard"));
const ViewTimetable     = lazy(() => import("../pages/student/ViewTimetable"));

const TeacherDashboard  = lazy(() => import("../pages/teacher/TeacherDashboard"));
const ViewMySchedule    = lazy(() => import("../pages/teacher/ViewMySchedule"));
const SetAvailability   = lazy(() => import("../pages/teacher/SetAvailability"));

const AdminDashboard    = lazy(() => import("../pages/admin/AdminDashboard"));
const GenerateSchedule  = lazy(() => import("../pages/admin/GenerateSchedule"));
const ManageDepartments = lazy(() => import("../pages/admin/ManageDepartments"));
const ManageRooms       = lazy(() => import("../pages/admin/ManageRooms"));
const Reports           = lazy(() => import("../pages/admin/Reports"));

// ── Loader ────────────────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--bg, #F5F6FA)",
    }}>
      <div style={{ textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
        <div style={{ fontSize: 32, display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</div>
        <div style={{ marginTop: 10 }}>Loading…</div>
      </div>
    </div>
  );
}

// ── Shell: Sidebar + Navbar + content ─────────────────────────────────────────

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Navbar />
        <main className="app-content fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

// ── Root redirect based on role ───────────────────────────────────────────────

function HomeRedirect() {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading)            return <PageLoader />;
  if (!isAuthenticated)   return <Navigate to="/login"   replace />;
  if (role === "ADMIN")   return <Navigate to="/admin"   replace />;
  if (role === "TEACHER") return <Navigate to="/teacher" replace />;
  return                         <Navigate to="/student" replace />;
}

// ── Shorthand: ProtectedRoute + AppShell ─────────────────────────────────────

function Page({ roles, children }) {
  return (
    <ProtectedRoute allowedRoles={roles}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>

            {/* Public */}
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Root */}
            <Route path="/" element={<HomeRedirect />} />

            {/* Student */}
            <Route path="/student"           element={<Page roles={["STUDENT"]}><StudentDashboard /></Page>} />
            <Route path="/student/timetable" element={<Page roles={["STUDENT"]}><ViewTimetable /></Page>} />

            {/* Teacher */}
            <Route path="/teacher"               element={<Page roles={["TEACHER"]}><TeacherDashboard /></Page>} />
            <Route path="/teacher/schedule"      element={<Page roles={["TEACHER"]}><ViewMySchedule /></Page>} />
            <Route path="/teacher/availability"  element={<Page roles={["TEACHER"]}><SetAvailability /></Page>} />

            {/* Admin */}
            <Route path="/admin"             element={<Page roles={["ADMIN"]}><AdminDashboard /></Page>} />
            <Route path="/admin/generate"    element={<Page roles={["ADMIN"]}><GenerateSchedule /></Page>} />
            <Route path="/admin/departments" element={<Page roles={["ADMIN"]}><ManageDepartments /></Page>} />
            <Route path="/admin/rooms"       element={<Page roles={["ADMIN"]}><ManageRooms /></Page>} />
            <Route path="/admin/reports"     element={<Page roles={["ADMIN"]}><Reports /></Page>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
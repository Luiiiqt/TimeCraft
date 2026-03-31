import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "../context/AuthContext";
import useAuth from "../hooks/useAuth";
import Navbar         from "../components/layout/Navbar";
import Sidebar        from "../components/layout/Sidebar";
import ProtectedRoute from "../components/layout/ProtectedRoute";

// ── Lazy pages ────────────────────────────────────────────────────────────────

const LandingPage       = lazy(() => import("../pages/LandingPage"));

const LoginPage         = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage      = lazy(() => import("../pages/auth/RegisterPage"));

const StudentDashboard  = lazy(() => import("../pages/student/StudentDashboard"));
const ViewTimetable     = lazy(() => import("../pages/student/ViewTimetable"));
const Enrollment        = lazy(() => import("../pages/student/Enrollment"));

const TeacherDashboard  = lazy(() => import("../pages/teacher/TeacherDashboard"));
const ViewMySchedule    = lazy(() => import("../pages/teacher/ViewMySchedule"));
const SetAvailability   = lazy(() => import("../pages/teacher/SetAvailability"));
const TeacherAvailabilityReview = lazy(() => import("../pages/admin/TeacherAvailabilityReview"));

const AdminDashboard    = lazy(() => import("../pages/admin/AdminDashboard"));
const GenerateSchedule  = lazy(() => import("../pages/admin/GenerateSchedule"));
const ManageDepartments = lazy(() => import("../pages/admin/ManageDepartments"));
const ManageRooms       = lazy(() => import("../pages/admin/ManageRooms"));
const ManageSubjects    = lazy(() => import("../pages/admin/ManageSubjects"));
const Reports           = lazy(() => import("../pages/admin/Reports"));

// ── Loader ────────────────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--surface-page)",
    }}>
      <div style={{ textAlign: "center", color: "var(--grey-400)", fontSize: 14, fontFamily: "var(--font-body)" }}>
        <div style={{ fontSize: 28, display: "inline-block", animation: "spin 1s linear infinite" }}>
          ⏳
        </div>
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

// ── Root redirect ─────────────────────────────────────────────────────────────
// If already authenticated → go straight to their dashboard.
// If not authenticated     → show the public landing page.

function HomeRoute() {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading)          return <PageLoader />;
  if (!isAuthenticated) return <LandingPage />;
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

            {/* Root — shows landing or redirects to dashboard */}
            <Route path="/" element={<HomeRoute />} />

            {/* Public auth pages */}
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Student */}
            <Route path="/student"            element={<Page roles={["STUDENT"]}><StudentDashboard /></Page>} />
            <Route path="/student/timetable"  element={<Page roles={["STUDENT"]}><ViewTimetable /></Page>} />
            <Route path="/student/enrollment" element={<Page roles={["STUDENT"]}><Enrollment /></Page>} />

            {/* Teacher */}
            <Route path="/teacher"          element={<Page roles={["TEACHER"]}><TeacherDashboard /></Page>} />
            <Route path="/teacher/schedule"      element={<Page roles={["TEACHER"]}><ViewMySchedule /></Page>} />
            <Route path="/teacher/availability"  element={<Page roles={["TEACHER"]}><SetAvailability /></Page>} />

            {/* Admin */}
            <Route path="/admin"             element={<Page roles={["ADMIN"]}><AdminDashboard /></Page>} />
            <Route path="/admin/generate"    element={<Page roles={["ADMIN"]}><GenerateSchedule /></Page>} />
            <Route path="/admin/departments" element={<Page roles={["ADMIN"]}><ManageDepartments /></Page>} />
            <Route path="/admin/rooms"       element={<Page roles={["ADMIN"]}><ManageRooms /></Page>} />
            <Route path="/admin/subjects"    element={<Page roles={["ADMIN"]}><ManageSubjects /></Page>} />
            <Route path="/admin/reports"       element={<Page roles={["ADMIN"]}><Reports /></Page>} />
            <Route path="/admin/availability"  element={<Page roles={["ADMIN"]}><TeacherAvailabilityReview /></Page>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
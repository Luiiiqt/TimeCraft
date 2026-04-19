import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "../context/AuthContext";
import useAuth from "../hooks/useAuth";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import OllamaChat from "../components/ui/OllamaChat";
import SchedulePrint from "../pages/dean/SchedulePrint";

// ── Lazy pages ────────────────────────────────────────────────────────────────

const LandingPage = lazy(() => import("../pages/LandingPage"));

const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));

const StudentDashboard = lazy(() => import("../pages/student/StudentDashboard"));
const ViewTimetable = lazy(() => import("../pages/student/ViewTimetable"));
const Enrollment = lazy(() => import("../pages/student/Enrollment"));

const TeacherDashboard = lazy(() => import("../pages/teacher/TeacherDashboard"));
const ViewMySchedule = lazy(() => import("../pages/teacher/ViewMySchedule"));
const SetAvailability = lazy(() => import("../pages/teacher/SetAvailability"));
const SubjectPreferences = lazy(() => import("../pages/teacher/SubjectPreferences"));
const TeacherAvailabilityReview = lazy(() => import("../pages/dean/TeacherAvailabilityReview"));

const AdminDashboard = lazy(() => import("../pages/dean/AdminDashboard"));
const GenerateSchedule = lazy(() => import("../pages/dean/GenerateSchedule"));
const ManageDepartments = lazy(() => import("../pages/dean/ManageDepartments"));
const ManageRooms = lazy(() => import("../pages/dean/ManageRooms"));
const ManageSubjects = lazy(() => import("../pages/dean/ManageSubjects"));
const Reports = lazy(() => import("../pages/dean/Reports"));
const DeanDashboard = lazy(() => import("../pages/dean/DeanDashboard"));
const SubjectAssignments = lazy(() => import("../pages/dean/SubjectAssignments"));
const PreferenceReview = lazy(() => import("../pages/dean/PreferenceReview"));
const DeanGenerateSchedule = GenerateSchedule;
const ScheduleView = lazy(() => import("../pages/dean/ScheduleView"));
const DeanSubjects = lazy(() => import("../pages/dean/ManageSubjects"));
const ManageStudents = lazy(() => import("../pages/dean/ManageStudents"));
const IrregularEnrollment = lazy(() => import("../pages/dean/IrregularEnrollment"));
const CurriculumImport = lazy(() => import("../pages/dean/CurriculumImport"));
const IrregularStudents = lazy(() => import("../pages/dean/IrregularStudents"));

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
      <OllamaChat />
    </div>
  );
}

// ── Root redirect ─────────────────────────────────────────────────────────────
// If already authenticated → go straight to their dashboard.
// If not authenticated     → show the public landing page.

function HomeRoute() {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <LandingPage />;
  if (role === "ADMIN") return <Navigate to="/admin" replace />;
  if (role === "TEACHER") return <Navigate to="/teacher" replace />;
  if (role === "DEAN") return <Navigate to="/dean" replace />;
  return <Navigate to="/student" replace />;
}

// ── Shorthand: ProtectedRoute + AppShell ─────────────────────────────────────

function Page({ roles, children }) {
  const { isAuthenticated, role, loading } = useAuth();
  console.log("PAGE CHECK:", { isAuthenticated, role, loading, roles });
  return (
    <ProtectedRoute allowedRoles={roles}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────

export default function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>

            {/* Root — shows landing or redirects to dashboard */}
            <Route path="/" element={<HomeRoute />} />

            {/* Public auth pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Student */}
            <Route path="/student" element={<Page roles={["STUDENT"]}><StudentDashboard /></Page>} />
            <Route path="/student/timetable" element={<Page roles={["STUDENT"]}><ViewTimetable /></Page>} />
            <Route path="/student/enrollment" element={<Page roles={["STUDENT"]}><Enrollment /></Page>} />

            {/* Teacher */}
            <Route path="/teacher" element={<Page roles={["TEACHER"]}><TeacherDashboard /></Page>} />
            <Route path="/teacher/schedule" element={<Page roles={["TEACHER"]}><ViewMySchedule /></Page>} />
            <Route path="/teacher/availability" element={<Page roles={["TEACHER"]}><SetAvailability /></Page>} />
            <Route path="/teacher/preferences" element={<Page roles={["TEACHER"]}><SubjectPreferences /></Page>} />

            {/* Dean */}
            <Route path="/dean" element={<Page roles={["DEAN", "ADMIN"]}><DeanDashboard /></Page>} />
            <Route path="/dean/subjects" element={<Page roles={["DEAN", "ADMIN"]}><DeanSubjects /></Page>} />
            <Route path="/dean/assignments" element={<Page roles={["DEAN", "ADMIN"]}><SubjectAssignments /></Page>} />
            <Route path="/dean/preferences" element={<Page roles={["DEAN", "ADMIN"]}><PreferenceReview /></Page>} />
            <Route path="/dean/generate" element={<Page roles={["DEAN", "ADMIN"]}><DeanGenerateSchedule /></Page>} />
            <Route path="/dean/schedule-view" element={<Page roles={["DEAN", "ADMIN"]}><ScheduleView /></Page>} />
            <Route path="/dean/schedule" element={<Page roles={["DEAN", "ADMIN"]}><ScheduleView /></Page>} />
            <Route path="/dean/schedule-print" element={<SchedulePrint />} />

            {/* Admin */}
            <Route path="/admin" element={<Page roles={["ADMIN"]}><AdminDashboard /></Page>} />
            <Route path="/admin/generate" element={<Page roles={["ADMIN"]}><GenerateSchedule /></Page>} />
            <Route path="/admin/departments" element={<Page roles={["ADMIN"]}><ManageDepartments /></Page>} />
            <Route path="/admin/rooms" element={<Page roles={["ADMIN"]}><ManageRooms /></Page>} />
            <Route path="/admin/subjects" element={<Page roles={["ADMIN"]}><ManageSubjects /></Page>} />
            <Route path="/admin/reports" element={<Page roles={["ADMIN"]}><Reports /></Page>} />
            <Route path="/admin/availability" element={<Page roles={["ADMIN"]}><TeacherAvailabilityReview /></Page>} />
            <Route path="/admin/teachers" element={<Page roles={["ADMIN"]}><TeacherAvailabilityReview /></Page>} />
            <Route path="/admin/students" element={<Page roles={["ADMIN"]}><ManageStudents /></Page>} />
            <Route path="/admin/irregular-enrollment" element={<Page roles={["ADMIN", "DEAN"]}><IrregularEnrollment /></Page>} />
            <Route path="/dean/irregular-enrollment" element={<Page roles={["ADMIN", "DEAN"]}><IrregularEnrollment /></Page>} />
            <Route path="/dean/curriculum" element={<Page roles={["DEAN", "ADMIN"]}><CurriculumImport /></Page>} />
            <Route path="/dean/irregular" element={<Page roles={["DEAN", "ADMIN"]}><IrregularStudents /></Page>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
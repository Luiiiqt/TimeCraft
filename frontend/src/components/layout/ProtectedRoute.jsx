import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

/**
 * ProtectedRoute
 * --------------
 * Wraps any route that requires the user to be authenticated.
 * Optionally restricts access to specific roles.
 *
 * Usage:
 *   <ProtectedRoute allowedRoles={["ADMIN"]}>
 *     <AdminDashboard />
 *   </ProtectedRoute>
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role, loading } = useAuth();

  // While AuthContext is verifying the stored token, show a spinner
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        fontFamily: "var(--font-body)",
        color: "var(--text-muted)",
        fontSize: 14,
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 32, marginBottom: 12,
            display: "inline-block",
            animation: "spin 1s linear infinite",
          }}>
            ⏳
          </div>
          <div>Loading…</div>
        </div>
      </div>
    );
  }

  // Not logged in → go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role → redirect to their own home
  if (allowedRoles && !allowedRoles.includes(role)) {
    const home =
      role === "ADMIN"        ? "/admin"        :
      role === "TEACHER"      ? "/teacher"      :
      role === "DEAN" ? "/dean" : "/student";
    return <Navigate to={home} replace />;
  }

  return children;
}
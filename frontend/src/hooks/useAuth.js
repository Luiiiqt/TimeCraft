import { useAuthContext } from "../context/AuthContext";

/**
 * useAuth
 * -------
 * Thin convenience wrapper around AuthContext.
 * Import this in any component instead of importing useAuthContext directly.
 *
 * Usage:
 *   const { user, login, logout, isAdmin, loading } = useAuth();
 */
function useAuth() {
  return useAuthContext();
}

export default useAuth;
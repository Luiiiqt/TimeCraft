import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

// ── Storage helpers ───────────────────────────────────────────────────────────

const TOKEN_KEY = "tc_token";
const USER_KEY = "tc_user";

const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t) => localStorage.setItem(TOKEN_KEY, t),
  getUser: () => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } },
  setUser: (u) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
  clear: () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); },
};

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => storage.getUser());
  const [token, setToken] = useState(() => storage.getToken());
  const [loading, setLoading] = useState(!!storage.getToken()); // true while we verify token on mount

  // ── Sync axios default header whenever token changes ──────────────────────
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // ── On mount: verify stored token against /auth/me ────────────────────────
  useEffect(() => {
    const verify = async () => {
      const stored = storage.getToken();
      if (!stored) { setLoading(false); return; }
      // Small delay to ensure token is fully stored
      await new Promise(res => setTimeout(res, 50));

      try {
        api.defaults.headers.common["Authorization"] = `Bearer ${stored}`;
        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${stored}` }
        });
        const data = res.data?.data ?? res.data;
        await _applySession(stored, data);
      } catch (err) {
        console.log("FULL ERROR:", JSON.stringify(err), err?.code, err?.message);
        console.log("AUTH VERIFY ERROR:", err?.response?.status, err?.response?.data, err?.message);
        if (err?.response?.status === 401) {
          console.log("CLEARING SESSION - token was:", stored);
          _clearSession();
        } else {
          // 500 or network error — keep session, don't logout
          setToken(stored);
          setUser(storage.getUser());
        }
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Internal session helpers ──────────────────────────────────────────────
  const _applySession = async (tok, userData) => {
    let enriched = { ...userData };
    if (userData.role === "PROGRAM_HEAD") {
      try {
        api.defaults.headers.common["Authorization"] = `Bearer ${tok}`;
        const r = await api.get("/program-head/my-courses");
        enriched.courses = r.data?.data ?? [];
      } catch {
        enriched.courses = [];
      }
    }
    storage.setToken(tok);
    storage.setUser(enriched);
    setToken(tok);
    setUser(enriched);
    api.defaults.headers.common["Authorization"] = `Bearer ${tok}`;
    return enriched;
  };

  const _clearSession = () => {
    storage.clear();
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common["Authorization"];
  };

  // ── Public actions ────────────────────────────────────────────────────────

  /**
   * Login with email + password.
   * On success stores token + user, sets axios header.
   * Returns the user object so callers can redirect based on role.
   */
  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const payload = res.data?.data ?? res.data;
    const { token: tok, tokenType, ...userData } = payload;
    const enriched = await _applySession(tok, userData);
    return enriched ?? userData;
  }, []);

  /**
   * Register a new student account.
   * Does NOT auto-login — user is redirected to login page.
   */
  const register = useCallback(async (formData) => {
    await api.post("/auth/register", { ...formData, userType: "STUDENT" });
  }, []);

  /** Clears session and navigates caller to /login (caller handles navigate). */
  const logout = useCallback(() => {
    _clearSession();
  }, []);

  // ── Derived helpers ───────────────────────────────────────────────────────
  const isAuthenticated = Boolean(token && user);
  const role = user?.role ?? null; // "STUDENT" | "TEACHER" | "ADMIN" | "PROGRAM_HEAD"
  const isAdmin = role === "ADMIN";
  const isTeacher = role === "TEACHER";
  const isStudent = role === "STUDENT";
  const isProgramHead = role === "PROGRAM_HEAD";

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    role,
    isAdmin,
    isTeacher,
    isStudent,
    isProgramHead,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useAuthContext — consume auth state anywhere in the tree.
 * Throws a clear error if used outside <AuthProvider>.
 */
export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside <AuthProvider>");
  return ctx;
}

export default AuthContext;
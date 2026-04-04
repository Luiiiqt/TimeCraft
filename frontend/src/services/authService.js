import api from "./api";

/**
 * authService.js
 * --------------
 * Handles all calls to /api/v1/auth/*
 *
 * Endpoints covered (from AuthController.java):
 *   POST /api/v1/auth/login      → login()
 *   POST /api/v1/auth/register   → register()
 *   GET  /api/v1/auth/me         → getMe()
 *
 * AuthResponse shape (from AuthResponse.java):
 * {
 *   token, tokenType,
 *   userId, email, schoolId, fullName, role,
 *   departmentId, departmentName,
 *
 *   // Student-only (null for teachers)
 *   courseId, courseCode, courseName,
 *   yearLevel, section, isIrregular,
 *
 *   // Teacher-only (null for students)
 *   campusFlexible, preferredCampusId, preferredCampusCode
 * }
 *
 * Note: AuthContext.jsx already handles token storage and axios header
 * injection. These service functions are pure API call wrappers — they
 * return the unwrapped `data` payload and let the caller (AuthContext)
 * decide what to store.
 */

// ── Login ─────────────────────────────────────────────────────────────────────

/**
 * Authenticates a user with email and password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<AuthResponse>} Full auth payload including JWT token
 *
 * @example
 * const auth = await authService.login("juan@uni.edu", "password123");
 * // auth.token, auth.role, auth.fullName, etc.
 */
const login = async (email, password) => {
  try {
    const res = await api.post("/auth/login", { email, password });
    // Unwrap ApiResponse<AuthResponse> → return the inner data object
    return res.data?.data ?? res.data;
  } catch (err) {
    // Re-throw with a clean message so callers (AuthContext, LoginPage) can display it
    const message = err?.response?.data?.message ?? "Login failed. Please check your credentials.";
    throw new Error(message);
  }
};

// ── Register ──────────────────────────────────────────────────────────────────

/**
 * Registers a new STUDENT account.
 * Teacher accounts are created by admins — no public teacher registration.
 *
 * Request body maps to RegisterRequest.java:
 * {
 *   fullName, schoolId, email, password,
 *   departmentId, courseId, yearLevel,
 *   section (null if irregular),
 *   isIrregular,
 *   userType: "STUDENT"
 * }
 *
 * @param {object} payload
 * @returns {Promise<void>} Returns no data on success (ApiResponse<Void>)
 *
 * @example
 * await authService.register({
 *   fullName: "Juan dela Cruz",
 *   schoolId: "2024-0001",
 *   email: "juan@uni.edu",
 *   password: "securepass",
 *   departmentId: 1,
 *   courseId: 3,
 *   yearLevel: 1,
 *   section: "A",
 *   isIrregular: false,
 *   userType: "STUDENT",
 * });
 */
const register = async (payload) => {
  try {
    const res = await api.post("/auth/register", payload);
    return res.data?.data ?? res.data;
  } catch (err) {
    const message = err?.response?.data?.message ?? "Registration failed. Please try again.";
    throw new Error(message);
  }
};

// ── Get current user (verify token) ──────────────────────────────────────────

/**
 * Fetches the current authenticated user's profile.
 * Used by AuthContext on mount to verify a stored token is still valid.
 *
 * Requires: Authorization header already set on the axios instance.
 *
 * @returns {Promise<AuthResponse>} Same shape as login response (minus token)
 *
 * @example
 * const me = await authService.getMe();
 * // me.role → "STUDENT" | "TEACHER" | "ADMIN"
 */
const getMe = async () => {
  try {
    const res = await api.get("/auth/me");
    return res.data?.data ?? res.data;
  } catch (err) {
    const message = err?.response?.data?.message ?? "Session expired. Please log in again.";
    throw new Error(message);
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the home route for a given role.
 * Use this after login to redirect the user to their dashboard.
 *
 * @param {string} role - "ADMIN" | "TEACHER" | "STUDENT"
 * @returns {string} Route path
 *
 * @example
 * const home = authService.getHomeRoute(user.role);
 * navigate(home);
 */
const getHomeRoute = (role) => {
  switch (role) {
    case "ADMIN":        return "/admin";
    case "TEACHER":      return "/teacher";
    case "STUDENT":      return "/student";
    case "PROGRAM_HEAD": return "/program-head";
    default:             return "/login";
  }
};

/**
 * Returns true if the given user object belongs to a student.
 * Checks for the student-specific `courseId` field from AuthResponse.
 *
 * @param {object} user - AuthResponse object from login/getMe
 * @returns {boolean}
 */
const isStudent = (user) => user?.role === "STUDENT";

/**
 * Returns true if the given user is a teacher.
 * @param {object} user
 * @returns {boolean}
 */
const isTeacher = (user) => user?.role === "TEACHER";

/**
 * Returns true if the given user is an admin.
 * @param {object} user
 * @returns {boolean}
 */
const isAdmin       = (user) => user?.role === "ADMIN";
const isProgramHead = (user) => user?.role === "PROGRAM_HEAD";

// ── Export ────────────────────────────────────────────────────────────────────

const authService = {
  login,
  register,
  getMe,
  getHomeRoute,
  isStudent,
  isTeacher,
  isAdmin,
  isProgramHead,
};

export default authService;
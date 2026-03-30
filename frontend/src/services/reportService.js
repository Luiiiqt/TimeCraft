import api from "./api";

/**
 * reportService.js
 * ----------------
 * Handles all calls to /api/v1/reports/*
 * All endpoints require ADMIN role.
 *
 * Endpoints covered (from ReportController.java):
 *   GET /reports/teaching-load              → getTeachingLoad()
 *   GET /reports/teaching-load/:teacherId   → getTeachingLoadByTeacher()
 *   GET /reports/room-utilisation           → getRoomUtilisation()
 *   GET /reports/conflicts                  → getConflictSummary()
 *
 * Note: These endpoints return Object[][] (raw JPQL projection rows).
 * Column order per report is documented on each function below.
 */

const unwrap = (res) => res.data?.data ?? res.data;

// ── Teaching Load ─────────────────────────────────────────────────────────────

/**
 * Get teaching load summary for ALL teachers in a term.
 *
 * Returns Object[][] — each row:
 * [teacherName, schoolId, departmentCode, classCount, unitTotal]
 *
 * @param {string} semester   - "FIRST" | "SECOND" | "SUMMER"
 * @param {string} schoolYear - e.g. "2024-2025"
 * @returns {Promise<Object[][]>}
 *
 * @example
 * const rows = await reportService.getTeachingLoad("FIRST", "2024-2025");
 * rows.forEach(([name, sid, dept, classes, units]) => { ... });
 */
const getTeachingLoad = async (semester, schoolYear) => {
  try {
    const res = await api.get("/reports/teaching-load", {
      params: { semester, schoolYear },
    });
    return unwrap(res) ?? [];
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to load teaching load report.");
  }
};

/**
 * Get teaching load for a single teacher, broken down by year level.
 *
 * Returns Object[][] — each row:
 * [yearLevel, classCount, unitTotal]
 *
 * @param {number} teacherId
 * @param {string} semester
 * @param {string} schoolYear
 * @returns {Promise<Object[][]>}
 */
const getTeachingLoadByTeacher = async (teacherId, semester, schoolYear) => {
  try {
    const res = await api.get(`/reports/teaching-load/${teacherId}`, {
      params: { semester, schoolYear },
    });
    return unwrap(res) ?? [];
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to load teacher load report.");
  }
};

// ── Room Utilisation ──────────────────────────────────────────────────────────

/**
 * Get room utilisation report for a specific campus and term.
 *
 * Returns Object[][] — each row:
 * [roomName, roomNumber, roomType, capacity, classCount]
 *
 * @param {number} campusId
 * @param {string} semester
 * @param {string} schoolYear
 * @returns {Promise<Object[][]>}
 *
 * @example
 * const rows = await reportService.getRoomUtilisation(1, "FIRST", "2024-2025");
 * rows.forEach(([name, num, type, cap, count]) => { ... });
 */
const getRoomUtilisation = async (campusId, semester, schoolYear) => {
  try {
    const res = await api.get("/reports/room-utilisation", {
      params: { campusId, semester, schoolYear },
    });
    return unwrap(res) ?? [];
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to load room utilisation report.");
  }
};

// ── Conflict Summary ──────────────────────────────────────────────────────────

/**
 * Get conflict summary for a term.
 *
 * Returns:
 * {
 *   totalUnresolved,   // across ALL terms
 *   termUnresolved,    // for this specific term
 *   semester,
 *   schoolYear
 * }
 *
 * @param {string} semester
 * @param {string} schoolYear
 * @returns {Promise<{ totalUnresolved: number, termUnresolved: number, semester: string, schoolYear: string }>}
 */
const getConflictSummary = async (semester, schoolYear) => {
  try {
    const res = await api.get("/reports/conflicts", {
      params: { semester, schoolYear },
    });
    return unwrap(res);
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to load conflict summary.");
  }
};

// ── Export ────────────────────────────────────────────────────────────────────

const reportService = {
  getTeachingLoad,
  getTeachingLoadByTeacher,
  getRoomUtilisation,
  getConflictSummary,
};

export default reportService;
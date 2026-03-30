import api from "./api";

/**
 * subjectService.js
 * -----------------
 * Handles all calls to /api/v1/subjects/*
 *
 * Endpoints covered (from SubjectController.java):
 *   GET  /subjects                             → getAll()
 *   GET  /subjects/:id                         → getById()
 *   GET  /subjects/course/:courseId            → getByCourse()
 *   GET  /subjects/course/:courseId/curriculum → getFullCurriculum()
 *   POST /subjects                             → create()
 *   PUT  /subjects/:id/deactivate              → deactivate()
 *
 * Subject model shape (from Subject.java):
 * {
 *   id, name, code,
 *   subjectType,  // "MAJOR" | "MINOR"
 *   sessionType,  // "LECTURE" | "LABORATORY"
 *   durationMins, // always 90
 *   sessionsPerWeek, // always 2
 *   units,
 *   department: { id, name, code },
 *   isActive
 * }
 *
 * CourseSubject model shape (curriculum entry):
 * {
 *   id,
 *   course: { id, name, code },
 *   subject: { ...Subject },
 *   yearLevel,
 *   semester  // "FIRST" | "SECOND" | "SUMMER"
 * }
 */

const unwrap = (res) => res.data?.data ?? res.data;

// ── Fetch methods ─────────────────────────────────────────────────────────────

/**
 * Get all subjects, optionally filtered.
 *
 * @param {object} [filters]
 * @param {number} [filters.departmentId]  - filter by owning department
 * @param {string} [filters.type]          - "MAJOR" | "MINOR"
 * @param {string} [filters.sessionType]   - "LECTURE" | "LABORATORY"
 * @param {string} [filters.search]        - search by name or code
 * @returns {Promise<Subject[]>}
 *
 * @example
 * // All subjects
 * const subjects = await subjectService.getAll();
 *
 * // Only lab subjects
 * const labs = await subjectService.getAll({ sessionType: "LABORATORY" });
 *
 * // Search by keyword
 * const results = await subjectService.getAll({ search: "data structures" });
 */
const getAll = async (filters = {}) => {
  try {
    const params = {};
    if (filters.departmentId) params.departmentId = filters.departmentId;
    if (filters.type)         params.type         = filters.type;
    if (filters.sessionType)  params.sessionType  = filters.sessionType;
    if (filters.search)       params.search       = filters.search;
    const res = await api.get("/subjects", { params });
    return unwrap(res) ?? [];
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to load subjects.");
  }
};

/**
 * Get a single subject by ID.
 *
 * @param {number} id
 * @returns {Promise<Subject>}
 */
const getById = async (id) => {
  try {
    const res = await api.get(`/subjects/${id}`);
    return unwrap(res);
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? `Subject ${id} not found.`);
  }
};

/**
 * Get subjects for a specific course, year level, and semester.
 * Maps to GET /subjects/course/:courseId?yearLevel=&semester=
 *
 * @param {number} courseId
 * @param {number} yearLevel  - 1–5
 * @param {string} semester   - "FIRST" | "SECOND" | "SUMMER"
 * @returns {Promise<Subject[]>}
 *
 * @example
 * const subjects = await subjectService.getByCourse(3, 2, "FIRST");
 */
const getByCourse = async (courseId, yearLevel, semester) => {
  try {
    const res = await api.get(`/subjects/course/${courseId}`, {
      params: { yearLevel, semester },
    });
    return unwrap(res) ?? [];
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to load course subjects.");
  }
};

/**
 * Get the full curriculum (all year levels + semesters) for a course.
 * Returns CourseSubject entries — useful for curriculum views.
 *
 * @param {number} courseId
 * @returns {Promise<CourseSubject[]>}
 */
const getFullCurriculum = async (courseId) => {
  try {
    const res = await api.get(`/subjects/course/${courseId}/curriculum`);
    return unwrap(res) ?? [];
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to load curriculum.");
  }
};

// ── Action methods ────────────────────────────────────────────────────────────

/**
 * Admin: create a new subject.
 *
 * @param {object} payload - {
 *   name,         // string (required)
 *   code,         // string (required) e.g. "IT-DSA"
 *   subjectType,  // "MAJOR" | "MINOR" (required)
 *   sessionType,  // "LECTURE" | "LABORATORY" (required)
 *   units,        // number (required)
 *   departmentId, // number (required)
 * }
 * @returns {Promise<Subject>}
 */
const create = async (payload) => {
  try {
    const res = await api.post("/subjects", payload);
    return unwrap(res);
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to create subject.");
  }
};

/**
 * Admin: deactivate a subject (soft delete).
 * Deactivated subjects are excluded from scheduling.
 *
 * @param {number} id
 * @returns {Promise<void>}
 */
const deactivate = async (id) => {
  try {
    const res = await api.put(`/subjects/${id}/deactivate`);
    return unwrap(res);
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to deactivate subject.");
  }
};

// ── Export ────────────────────────────────────────────────────────────────────

const subjectService = {
  getAll,
  getById,
  getByCourse,
  getFullCurriculum,
  create,
  deactivate,
};

export default subjectService;
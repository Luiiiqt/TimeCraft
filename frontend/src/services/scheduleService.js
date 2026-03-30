import api from "./api";

/**
 * scheduleService.js
 * ------------------
 * Handles all calls to /api/v1/schedules/*
 *
 * Endpoints covered (from ScheduleController.java):
 *   GET    /schedules                        → getAll()
 *   GET    /schedules/my                     → getMy()
 *   GET    /schedules/teacher/:teacherId     → getByTeacher()
 *   GET    /schedules/section/:sectionId     → getBySection()
 *   GET    /schedules/room/:roomId           → getByRoom()
 *   GET    /schedules/conflicted             → getConflicted()
 *   GET    /schedules/load-report            → getLoadReport()
 *   POST   /schedules/generate               → generate()
 *   POST   /schedules                        → createManual()
 *   PUT    /schedules/:id/publish            → publishOne()
 *   PUT    /schedules/publish-all            → publishAll()
 *   POST   /schedules/:id/assign-student     → assignStudent()
 *   DELETE /schedules/:id/remove-student     → removeStudent()
 *
 * ScheduleResponse shape (from ScheduleResponse.java):
 * {
 *   id, subjectId, subjectCode, subjectName, subjectType, sessionType,
 *   teacherId, teacherName, teacherSchoolId,
 *   roomId, roomName, roomNumber, roomType,
 *   campusId, campusName, campusCode,
 *   sectionId, sectionName, yearLevel, courseCode, courseName,
 *   timeslotId, day1, startTime1, endTime1, timeslotLabel1,
 *   timeslot2Id, day2, startTime2, endTime2, timeslotLabel2,
 *   semester, schoolYear,
 *   status  // "DRAFT" | "PUBLISHED" | "CONFLICTED"
 * }
 */

// ── Helper: unwrap ApiResponse<T> ─────────────────────────────────────────────

const unwrap = (res) => res.data?.data ?? res.data;

// ── Fetch methods ─────────────────────────────────────────────────────────────

/**
 * Admin: get all schedules for a term.
 * Optionally filter by status (e.g. "CONFLICTED").
 *
 * @param {string} semester   - "FIRST" | "SECOND" | "SUMMER"
 * @param {string} schoolYear - e.g. "2024-2025"
 * @param {string} [status]   - optional filter
 * @returns {Promise<ScheduleResponse[]>}
 */
const getAll = async (semester, schoolYear, status) => {
  try {
    const params = { semester, schoolYear, ...(status ? { status } : {}) };
    const res = await api.get("/schedules", { params });
    return unwrap(res) ?? [];
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to load schedules.");
  }
};

/**
 * Student: get own timetable for a term.
 * Calls GET /schedules/my — resolved server-side from JWT principal.
 *
 * @param {string} semester
 * @param {string} schoolYear
 * @returns {Promise<ScheduleResponse[]>}
 */
const getMy = async (semester, schoolYear) => {
  try {
    const res = await api.get("/schedules/my", { params: { semester, schoolYear } });
    return unwrap(res) ?? [];
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to load your schedule.");
  }
};

/**
 * Teacher/Admin: get a teacher's full schedule for a term.
 * Returns classes across ALL year levels.
 *
 * @param {number} teacherId
 * @param {string} semester
 * @param {string} schoolYear
 * @returns {Promise<ScheduleResponse[]>}
 */
const getByTeacher = async (teacherId, semester, schoolYear) => {
  try {
    const res = await api.get(`/schedules/teacher/${teacherId}`, {
      params: { semester, schoolYear },
    });
    return unwrap(res) ?? [];
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to load teacher schedule.");
  }
};

/**
 * Get timetable for a specific section.
 *
 * @param {number} sectionId
 * @param {string} semester
 * @param {string} schoolYear
 * @returns {Promise<ScheduleResponse[]>}
 */
const getBySection = async (sectionId, semester, schoolYear) => {
  try {
    const res = await api.get(`/schedules/section/${sectionId}`, {
      params: { semester, schoolYear },
    });
    return unwrap(res) ?? [];
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to load section schedule.");
  }
};

/**
 * Admin: get schedule for a specific room.
 *
 * @param {number} roomId
 * @param {string} semester
 * @param {string} schoolYear
 * @returns {Promise<ScheduleResponse[]>}
 */
const getByRoom = async (roomId, semester, schoolYear) => {
  try {
    const res = await api.get(`/schedules/room/${roomId}`, {
      params: { semester, schoolYear },
    });
    return unwrap(res) ?? [];
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to load room schedule.");
  }
};

/**
 * Admin: get all schedules with CONFLICTED status.
 *
 * @returns {Promise<ScheduleResponse[]>}
 */
const getConflicted = async () => {
  try {
    const res = await api.get("/schedules/conflicted");
    return unwrap(res) ?? [];
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to load conflicted schedules.");
  }
};

/**
 * Admin: get teaching load report for a term.
 * Returns raw Object[] rows — see ReportController for column order.
 *
 * @param {string} semester
 * @param {string} schoolYear
 * @returns {Promise<Object[][]>}
 */
const getLoadReport = async (semester, schoolYear) => {
  try {
    const res = await api.get("/schedules/load-report", {
      params: { semester, schoolYear },
    });
    return unwrap(res) ?? [];
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to load teaching load report.");
  }
};

// ── Action methods ────────────────────────────────────────────────────────────

/**
 * Admin: trigger auto-generation of schedules for a term.
 *
 * @param {object} payload - ScheduleGenerateRequest shape:
 * {
 *   semester,         // "FIRST" | "SECOND" | "SUMMER"
 *   schoolYear,       // "2024-2025"
 *   clearDraftsFirst, // boolean (default true)
 *   autoPublish,      // boolean (default false)
 *   sectionId?,       // optional — generate for one section only
 *   courseId?,        // optional — generate for one course only
 * }
 * @returns {Promise<{ total, successful, conflicted, semester, schoolYear }>}
 */
const generate = async (payload) => {
  try {
    const res = await api.post("/schedules/generate", payload);
    return unwrap(res);
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Schedule generation failed.");
  }
};

/**
 * Admin: manually create a single schedule entry (override).
 *
 * @param {object} payload - {
 *   subjectId, roomId, teacherId,
 *   timeslotId, timeslot2Id,
 *   sectionId, campusId,
 *   semester, schoolYear
 * }
 * @returns {Promise<ScheduleResponse>}
 */
const createManual = async (payload) => {
  try {
    const res = await api.post("/schedules", payload);
    return unwrap(res);
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to create schedule.");
  }
};

/**
 * Admin: publish a single schedule entry (DRAFT → PUBLISHED).
 * Will throw if the schedule has unresolved conflicts.
 *
 * @param {number} id - Schedule ID
 * @returns {Promise<void>}
 */
const publishOne = async (id) => {
  try {
    const res = await api.put(`/schedules/${id}/publish`);
    return unwrap(res);
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to publish schedule.");
  }
};

/**
 * Admin: publish all DRAFT schedules for a term at once.
 * Conflicted schedules are excluded automatically.
 *
 * @param {string} semester
 * @param {string} schoolYear
 * @returns {Promise<void>}
 */
const publishAll = async (semester, schoolYear) => {
  try {
    const res = await api.put("/schedules/publish-all", null, {
      params: { semester, schoolYear },
    });
    return unwrap(res);
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to publish all schedules.");
  }
};

/**
 * Admin: assign an irregular student to a specific schedule slot.
 *
 * @param {number} scheduleId
 * @param {number} studentId
 * @returns {Promise<StudentSchedule>}
 */
const assignStudent = async (scheduleId, studentId) => {
  try {
    const res = await api.post(`/schedules/${scheduleId}/assign-student`, { studentId });
    return unwrap(res);
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to assign student.");
  }
};

/**
 * Admin: remove an irregular student from a schedule slot.
 *
 * @param {number} scheduleId
 * @param {number} studentId
 * @returns {Promise<void>}
 */
const removeStudent = async (scheduleId, studentId) => {
  try {
    const res = await api.delete(`/schedules/${scheduleId}/remove-student`, {
      data: { studentId },
    });
    return unwrap(res);
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to remove student.");
  }
};

// ── Export ────────────────────────────────────────────────────────────────────

const scheduleService = {
  getAll,
  getMy,
  getByTeacher,
  getBySection,
  getByRoom,
  getConflicted,
  getLoadReport,
  generate,
  createManual,
  publishOne,
  publishAll,
  assignStudent,
  removeStudent,
};

export default scheduleService;
import { useState, useCallback } from "react";
import api from "../services/api";

/**
 * useSchedule
 * -----------
 * Encapsulates all schedule-related API calls from ScheduleController.
 *
 * Endpoints covered:
 *   GET  /schedules                          (admin — all schedules by term)
 *   GET  /schedules/my                       (student — own timetable)
 *   GET  /schedules/teacher/:id              (teacher/admin — teacher load)
 *   GET  /schedules/section/:id              (section timetable)
 *   GET  /schedules/room/:id                 (room schedule)
 *   GET  /schedules/conflicted               (admin — conflicted entries)
 *   GET  /schedules/load-report              (admin — teaching load report)
 *   POST /schedules/generate                 (admin — auto-generate)
 *   POST /schedules                          (admin — manual override)
 *   PUT  /schedules/:id/publish              (admin — publish one)
 *   PUT  /schedules/publish-all              (admin — publish all in term)
 *   POST /schedules/:id/assign-student       (admin — assign irregular student)
 *   DELETE /schedules/:id/remove-student     (admin — remove irregular student)
 */
function useSchedule() {
  const [schedules,    setSchedules]    = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError,   setActionError]   = useState(null);

  // ── Generic fetch helper ──────────────────────────────────────────────────
  const _fetch = useCallback(async (url, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await api.get(url, { params });
      const data = res.data?.data ?? res.data;
      const list = Array.isArray(data) ? data : [];
      setSchedules(list);
      return list;
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Failed to load schedules.";
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Generic action helper ─────────────────────────────────────────────────
  const _action = useCallback(async (fn) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const result = await fn();
      return { success: true, data: result };
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Action failed.";
      setActionError(msg);
      return { success: false, error: msg };
    } finally {
      setActionLoading(false);
    }
  }, []);

  // ── Fetch methods ─────────────────────────────────────────────────────────

  /** Admin: all schedules for a given term */
  const fetchAll = useCallback((semester, schoolYear, status) =>
    _fetch("/schedules", { semester, schoolYear, ...(status ? { status } : {}) }),
  [_fetch]);

  /** Student: own timetable */
  const fetchMySchedule = useCallback((semester, schoolYear) =>
    _fetch("/schedules/my", { semester, schoolYear }),
  [_fetch]);

  /** Teacher/Admin: teacher's full load */
  const fetchTeacherSchedule = useCallback((teacherId, semester, schoolYear) =>
    _fetch(`/schedules/teacher/${teacherId}`, { semester, schoolYear }),
  [_fetch]);

  /** Section timetable */
  const fetchSectionSchedule = useCallback((sectionId, semester, schoolYear) =>
    _fetch(`/schedules/section/${sectionId}`, { semester, schoolYear }),
  [_fetch]);

  /** Room schedule */
  const fetchRoomSchedule = useCallback((roomId, semester, schoolYear) =>
    _fetch(`/schedules/room/${roomId}`, { semester, schoolYear }),
  [_fetch]);

  /** Admin: all conflicted schedules */
  const fetchConflicted = useCallback(() =>
    _fetch("/schedules/conflicted"),
  [_fetch]);

  /** Admin: teaching load report */
  const fetchLoadReport = useCallback((semester, schoolYear) =>
    _fetch("/schedules/load-report", { semester, schoolYear }),
  [_fetch]);

  // ── Action methods ────────────────────────────────────────────────────────

  /**
   * Trigger auto-generation for a term.
   * @param {object} payload - { semester, schoolYear, autoPublish }
   * @returns {{ success, data: { total, successful, conflicted, semester, schoolYear } }}
   */
  const generateSchedule = useCallback((payload) =>
    _action(async () => {
      const res = await api.post("/schedules/generate", payload);
      return res.data?.data ?? res.data;
    }),
  [_action]);

  /**
   * Manual schedule override (admin).
   * @param {object} payload - { subjectId, roomId, teacherId, timeslotId, timeslot2Id, sectionId, semester, schoolYear, campusId }
   */
  const createManual = useCallback((payload) =>
    _action(async () => {
      const res = await api.post("/schedules", payload);
      return res.data?.data ?? res.data;
    }),
  [_action]);

  /** Publish a single schedule entry */
  const publishOne = useCallback((id) =>
    _action(() => api.put(`/schedules/${id}/publish`)),
  [_action]);

  /** Publish all draft schedules for a term */
  const publishAll = useCallback((semester, schoolYear) =>
    _action(() => api.put("/schedules/publish-all", null, { params: { semester, schoolYear } })),
  [_action]);

  /** Assign an irregular student to a schedule slot */
  const assignStudent = useCallback((scheduleId, studentId) =>
    _action(async () => {
      const res = await api.post(`/schedules/${scheduleId}/assign-student`, { studentId });
      return res.data?.data ?? res.data;
    }),
  [_action]);

  /** Remove an irregular student from a schedule slot */
  const removeStudent = useCallback((scheduleId, studentId) =>
    _action(() => api.delete(`/schedules/${scheduleId}/remove-student`, { data: { studentId } })),
  [_action]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setSchedules([]);
    setError(null);
    setActionError(null);
  }, []);

  return {
    // State
    schedules,
    loading,
    error,
    actionLoading,
    actionError,
    // Fetch
    fetchAll,
    fetchMySchedule,
    fetchTeacherSchedule,
    fetchSectionSchedule,
    fetchRoomSchedule,
    fetchConflicted,
    fetchLoadReport,
    // Actions
    generateSchedule,
    createManual,
    publishOne,
    publishAll,
    assignStudent,
    removeStudent,
    reset,
  };
}

export default useSchedule;
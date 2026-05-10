import { useState, useCallback } from "react";
import api from "../services/api";

/**
 * useConflict
 * -----------
 * Encapsulates all conflict-related API calls from ConflictController.
 *
 * Endpoints covered:
 *   GET  /conflicts                          (filter by type, semester, schoolYear)
 *   GET  /conflicts/count                    (unresolved count)
 *   GET  /conflicts/schedule/:scheduleId     (conflicts for one schedule)
 *   PUT  /conflicts/:id/resolve              (resolve single conflict)
 *   PUT  /conflicts/resolve-all/:scheduleId  (resolve all for a schedule)
 *   POST /conflicts/audit                    (run full term audit)
 */
function useConflict() {
  const [conflicts,     setConflicts]     = useState([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError,   setActionError]   = useState(null);

  // ── Generic helpers ───────────────────────────────────────────────────────
  const _fetch = useCallback(async (url, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await api.get(url, { params });
      const raw = res.data?.data ?? res.data;
      const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.content) ? raw.content : []);
      setConflicts(list);
      return list;
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Failed to load conflicts.";
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

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

  /**
   * Fetch all unresolved conflicts.
   * @param {object} filters - { type?, semester?, schoolYear? }
   */
  const fetchConflicts = useCallback((filters = {}) =>
    _fetch("/conflicts", filters),
  [_fetch]);

  /** Fetch conflicts tied to a specific schedule entry */
  const fetchBySchedule = useCallback((scheduleId) =>
    _fetch(`/conflicts/schedule/${scheduleId}`),
  [_fetch]);

  /** Fetch the unresolved conflict count (for dashboard badge) */
  const fetchCount = useCallback(async () => {
    try {
      const res   = await api.get("/conflicts/count");
      const count = res.data?.data?.unresolvedConflicts ?? 0;
      setUnresolvedCount(count);
      return count;
    } catch {
      return 0;
    }
  }, []);

  // ── Action methods ────────────────────────────────────────────────────────

  /** Resolve a single conflict by ID */
  const resolveOne = useCallback((id) =>
    _action(async () => {
      await api.put(`/conflicts/${id}/resolve`);
      // Optimistic update — remove from local list
      setConflicts((prev) => prev.filter((c) => c.id !== id));
      setUnresolvedCount((n) => Math.max(0, n - 1));
    }),
  [_action]);

  /** Resolve all conflicts for a schedule */
  const resolveAllForSchedule = useCallback((scheduleId) =>
    _action(async () => {
      await api.put(`/conflicts/resolve-all/${scheduleId}`);
      setConflicts((prev) => prev.filter((c) => c.schedule?.id !== scheduleId));
    }),
  [_action]);

  /**
   * Run a full conflict audit for a term.
   * @returns {{ success, data: { newConflictsFound } }}
   */
  const auditTerm = useCallback((semester, schoolYear) =>
    _action(async () => {
      const res = await api.post("/conflicts/audit", null, {
        params: { semester, schoolYear },
      });
      return res.data?.data ?? res.data;
    }),
  [_action]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setConflicts([]);
    setError(null);
    setActionError(null);
  }, []);

  return {
    // State
    conflicts,
    unresolvedCount,
    loading,
    error,
    actionLoading,
    actionError,
    // Fetch
    fetchConflicts,
    fetchBySchedule,
    fetchCount,
    // Actions
    resolveOne,
    resolveAllForSchedule,
    auditTerm,
    reset,
  };
}

export default useConflict;
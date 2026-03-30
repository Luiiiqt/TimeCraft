import api from "./api";

/**
 * roomService.js
 * --------------
 * Handles all calls to /api/v1/rooms/*
 *
 * Endpoints covered (from RoomController.java):
 *   GET  /rooms/campuses          → getCampuses()
 *   GET  /rooms                   → getAll()
 *   GET  /rooms/:id               → getById()
 *   POST /rooms                   → create()
 *   PUT  /rooms/:id/deactivate    → deactivate()
 *
 * Room model shape (from Room.java):
 * {
 *   id, name, roomNumber, capacity,
 *   roomType,  // "LECTURE" | "LABORATORY"
 *   isActive,
 *   campus: { id, name, code }
 * }
 *
 * Campus model shape (from Campus.java):
 * {
 *   id, name, code
 * }
 */

const unwrap = (res) => res.data?.data ?? res.data;

// ── Campuses ──────────────────────────────────────────────────────────────────

/**
 * Get all campuses.
 * Used to populate campus dropdowns in room forms and filters.
 *
 * @returns {Promise<Campus[]>}
 */
const getCampuses = async () => {
  try {
    const res = await api.get("/rooms/campuses");
    return unwrap(res) ?? [];
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to load campuses.");
  }
};

// ── Rooms ─────────────────────────────────────────────────────────────────────

/**
 * Get all rooms, optionally filtered by campus and/or type.
 *
 * @param {object} [filters]
 * @param {number} [filters.campusId]  - filter by campus
 * @param {string} [filters.roomType]  - "LECTURE" | "LABORATORY"
 * @returns {Promise<Room[]>}
 *
 * @example
 * // All rooms
 * const rooms = await roomService.getAll();
 *
 * // Only labs on campus 1
 * const labs = await roomService.getAll({ campusId: 1, roomType: "LABORATORY" });
 */
const getAll = async (filters = {}) => {
  try {
    const params = {};
    if (filters.campusId) params.campusId = filters.campusId;
    if (filters.roomType) params.roomType = filters.roomType;
    const res = await api.get("/rooms", { params });
    return unwrap(res) ?? [];
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to load rooms.");
  }
};

/**
 * Get a single room by ID.
 *
 * @param {number} id
 * @returns {Promise<Room>}
 */
const getById = async (id) => {
  try {
    const res = await api.get(`/rooms/${id}`);
    return unwrap(res);
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? `Room ${id} not found.`);
  }
};

/**
 * Admin: create a new room.
 *
 * @param {object} payload - {
 *   campusId,    // number (required)
 *   name,        // string (required) e.g. "LI Lecture Room 101"
 *   roomNumber,  // string (optional) e.g. "101"
 *   capacity,    // number (required)
 *   roomType,    // "LECTURE" | "LABORATORY" (required)
 * }
 * @returns {Promise<Room>}
 */
const create = async (payload) => {
  try {
    const res = await api.post("/rooms", payload);
    return unwrap(res);
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to create room.");
  }
};

/**
 * Admin: deactivate a room (soft delete).
 * Deactivated rooms are excluded from scheduling.
 *
 * @param {number} id
 * @returns {Promise<void>}
 */
const deactivate = async (id) => {
  try {
    const res = await api.put(`/rooms/${id}/deactivate`);
    return unwrap(res);
  } catch (err) {
    throw new Error(err?.response?.data?.message ?? "Failed to deactivate room.");
  }
};

// ── Export ────────────────────────────────────────────────────────────────────

const roomService = {
  getCampuses,
  getAll,
  getById,
  create,
  deactivate,
};

export default roomService;
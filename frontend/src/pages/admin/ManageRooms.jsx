import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const ROOM_TYPES = ["LECTURE", "LABORATORY", "GYM", "AUDITORIUM"];

export default function ManageRooms() {
  const navigate = useNavigate();

  const [rooms,       setRooms]       = useState([]);
  const [campuses,    setCampuses]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [actionMsg,   setActionMsg]   = useState("");
  const [actionErr,   setActionErr]   = useState("");

  // Filters
  const [filterCampus, setFilterCampus] = useState("");
  const [filterType,   setFilterType]   = useState("");

  // Create modal
  const [showModal,  setShowModal]  = useState(false);
  const [form,       setForm]       = useState({ campusId: "", name: "", roomNumber: "", capacity: "", roomType: "LECTURE" });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Deactivate
  const [deactivateId, setDeactivateId] = useState(null);

  // ── Fetch campuses ─────────────────────────────────────────────────────────
  useEffect(() => {
    api.get("/rooms/campuses")
      .then((r) => setCampuses(r.data?.data ?? r.data ?? []))
      .catch(() => setCampuses([]));
  }, []);

  // ── Fetch rooms ────────────────────────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filterCampus) params.campusId = filterCampus;
      if (filterType)   params.roomType = filterType;
      const res  = await api.get("/rooms", { params });
      const data = res.data?.data ?? res.data;
      setRooms(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load rooms.");
    } finally {
      setLoading(false);
    }
  }, [filterCampus, filterType]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  // ── Create ────────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.campusId)              errs.campusId    = "Select a campus.";
    if (!form.name.trim())           errs.name        = "Room name is required.";
    if (!form.roomNumber.trim())     errs.roomNumber  = "Room number is required.";
    if (!form.capacity || isNaN(Number(form.capacity)) || Number(form.capacity) < 1)
                                     errs.capacity    = "Enter a valid capacity.";
    if (!form.roomType)              errs.roomType    = "Select a room type.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setActionErr("");
    try {
      await api.post("/rooms", {
        campusId  : Number(form.campusId),
        name      : form.name.trim(),
        roomNumber: form.roomNumber.trim(),
        capacity  : Number(form.capacity),
        roomType  : form.roomType,
      });
      setActionMsg("Room created successfully.");
      setShowModal(false);
      setForm({ campusId: "", name: "", roomNumber: "", capacity: "", roomType: "LECTURE" });
      fetchRooms();
    } catch (err) {
      setActionErr(err?.response?.data?.message ?? "Failed to create room.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Deactivate ────────────────────────────────────────────────────────────
  const handleDeactivate = async () => {
    if (!deactivateId) return;
    setActionErr("");
    try {
      await api.put(`/rooms/${deactivateId}/deactivate`);
      setActionMsg("Room deactivated.");
      setDeactivateId(null);
      fetchRooms();
    } catch (err) {
      setActionErr(err?.response?.data?.message ?? "Failed to deactivate room.");
      setDeactivateId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>← Back to Dashboard</button>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Manage Rooms</h1>
          <p style={styles.subtitle}>{rooms.length} room(s) shown</p>
        </div>
        <button onClick={() => { setShowModal(true); setActionMsg(""); setActionErr(""); }}
          style={styles.primaryBtn}>+ Add Room</button>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <select value={filterCampus} onChange={(e) => setFilterCampus(e.target.value)} style={styles.filterSelect}>
          <option value="">All Campuses</option>
          {campuses.map((c) => <option key={c.id} value={c.id}>{c.name ?? c.code}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={styles.filterSelect}>
          <option value="">All Types</option>
          {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Feedback */}
      {actionMsg && <div style={styles.successBanner}>✓ {actionMsg}</div>}
      {actionErr && <div style={styles.errorBanner}>⚠ {actionErr}</div>}

      {/* Table */}
      {loading ? (
        <div style={styles.centered}><div style={styles.spinner} /></div>
      ) : error ? (
        <div style={styles.errorBanner}>{error}</div>
      ) : rooms.length === 0 ? (
        <div style={styles.empty}>No rooms found. Adjust filters or add a new room.</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>{["Room No.", "Name", "Campus", "Type", "Capacity", "Actions"].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {rooms.map((r, i) => (
                <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  <td style={styles.td}><span style={styles.codeBadge}>{r.roomNumber}</span></td>
                  <td style={styles.td}>{r.name}</td>
                  <td style={styles.td}>{r.campus?.name ?? r.campus?.code ?? "—"}</td>
                  <td style={styles.td}><TypeBadge type={r.roomType} /></td>
                  <td style={styles.td}>{r.capacity}</td>
                  <td style={styles.td}>
                    <button onClick={() => { setDeactivateId(r.id); setActionMsg(""); setActionErr(""); }}
                      style={styles.deactivateBtn}>Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <Modal title="Add Room" onClose={() => { setShowModal(false); setFormErrors({}); }}>
          <form onSubmit={handleCreate} noValidate style={styles.modalForm}>
            <FieldRow>
              <FormField label="Campus" error={formErrors.campusId}>
                <select value={form.campusId} onChange={(e) => setForm((p) => ({ ...p, campusId: e.target.value }))}
                  style={inputStyle(formErrors.campusId)}>
                  <option value="">Select campus</option>
                  {campuses.map((c) => <option key={c.id} value={c.id}>{c.name ?? c.code}</option>)}
                </select>
              </FormField>
              <FormField label="Room Type" error={formErrors.roomType}>
                <select value={form.roomType} onChange={(e) => setForm((p) => ({ ...p, roomType: e.target.value }))}
                  style={inputStyle(formErrors.roomType)}>
                  {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
            </FieldRow>
            <FormField label="Room Name" error={formErrors.name}>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                style={inputStyle(formErrors.name)} placeholder="e.g. Science Lab 1" />
            </FormField>
            <FieldRow>
              <FormField label="Room Number" error={formErrors.roomNumber}>
                <input value={form.roomNumber} onChange={(e) => setForm((p) => ({ ...p, roomNumber: e.target.value }))}
                  style={inputStyle(formErrors.roomNumber)} placeholder="e.g. B-201" />
              </FormField>
              <FormField label="Capacity" error={formErrors.capacity}>
                <input type="number" min="1" value={form.capacity}
                  onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
                  style={inputStyle(formErrors.capacity)} placeholder="40" />
              </FormField>
            </FieldRow>
            {actionErr && <div style={styles.errorBanner}>⚠ {actionErr}</div>}
            <div style={styles.modalBtns}>
              <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>Cancel</button>
              <button type="submit" disabled={submitting} style={styles.primaryBtn}>
                {submitting ? "Creating…" : "Create Room"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Deactivate confirm */}
      {deactivateId && (
        <Modal title="Deactivate Room" onClose={() => setDeactivateId(null)}>
          <p style={{ color: "#374151", lineHeight: "1.6", marginBottom: "1.25rem" }}>
            Are you sure you want to deactivate this room? It will no longer be available for scheduling.
          </p>
          <div style={styles.modalBtns}>
            <button onClick={() => setDeactivateId(null)} style={styles.cancelBtn}>Cancel</button>
            <button onClick={handleDeactivate} style={styles.dangerBtn}>Deactivate</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
const TYPE_COLORS = {
  LECTURE    : { bg: "#eff6ff", color: "#1a56db" },
  LABORATORY : { bg: "#fdf4ff", color: "#7c3aed" },
  GYM        : { bg: "#fff7ed", color: "#c2410c" },
  AUDITORIUM : { bg: "#f0fdf4", color: "#15803d" },
};

function TypeBadge({ type }) {
  const c = TYPE_COLORS[type] ?? { bg: "#f3f4f6", color: "#374151" };
  return (
    <span style={{ padding: "0.2rem 0.6rem", backgroundColor: c.bg, color: c.color, borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700" }}>
      {type}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.box} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h3 style={modalStyles.title}>{title}</h3>
          <button onClick={onClose} style={modalStyles.closeBtn}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1 }}>
      <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#374151" }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: "0.78rem", color: "#dc2626" }}>{error}</span>}
    </div>
  );
}

function FieldRow({ children }) {
  return <div style={{ display: "flex", gap: "0.75rem" }}>{children}</div>;
}

const inputStyle = (err) => ({
  padding: "0.65rem 0.9rem", border: `1.5px solid ${err ? "#dc2626" : "#d1d5db"}`,
  borderRadius: "8px", fontSize: "0.9rem", color: "#111827",
  backgroundColor: "#fff", width: "100%", boxSizing: "border-box",
});

const styles = {
  page         : { padding: "2rem 2.5rem", maxWidth: "1000px", margin: "0 auto", fontFamily: "'Sora', 'Segoe UI', sans-serif" },
  backBtn      : { background: "none", border: "none", color: "#1a56db", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", padding: 0, marginBottom: "1.5rem" },
  header       : { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" },
  title        : { fontSize: "1.75rem", fontWeight: "700", color: "#111827", margin: "0 0 0.2rem", letterSpacing: "-0.02em" },
  subtitle     : { color: "#6b7280", fontSize: "0.9rem", margin: 0 },
  primaryBtn   : { padding: "0.65rem 1.2rem", backgroundColor: "#1a56db", color: "#fff", border: "none", borderRadius: "8px", fontSize: "0.9rem", fontWeight: "600", cursor: "pointer" },
  cancelBtn    : { flex: 1, padding: "0.7rem", backgroundColor: "transparent", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "0.9rem", cursor: "pointer", color: "#6b7280", fontWeight: "600" },
  dangerBtn    : { flex: 1, padding: "0.7rem", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", fontSize: "0.9rem", fontWeight: "600", cursor: "pointer" },
  filters      : { display: "flex", gap: "0.75rem", marginBottom: "1.25rem" },
  filterSelect : { padding: "0.6rem 0.9rem", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "0.88rem", color: "#374151", backgroundColor: "#fff" },
  successBanner: { padding: "0.75rem 1rem", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#14532d", fontSize: "0.875rem", marginBottom: "1rem" },
  errorBanner  : { padding: "0.75rem 1rem", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "0.875rem", marginBottom: "1rem" },
  centered     : { display: "flex", justifyContent: "center", padding: "3rem" },
  spinner      : { width: "32px", height: "32px", border: "3px solid #e5e7eb", borderTop: "3px solid #1a56db", borderRadius: "50%", animation: "spin 0.7s linear infinite" },
  empty        : { textAlign: "center", color: "#9ca3af", padding: "3rem", fontSize: "0.95rem" },
  tableWrap    : { borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  table        : { width: "100%", borderCollapse: "collapse" },
  th           : { padding: "0.85rem 1.25rem", textAlign: "left", fontSize: "0.78rem", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" },
  td           : { padding: "0.9rem 1.25rem", fontSize: "0.9rem", color: "#111827", borderBottom: "1px solid #f3f4f6" },
  codeBadge    : { padding: "0.25rem 0.65rem", backgroundColor: "#f3f4f6", color: "#374151", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "700" },
  deactivateBtn: { padding: "0.35rem 0.85rem", backgroundColor: "transparent", border: "1.5px solid #fca5a5", color: "#dc2626", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer" },
  modalForm    : { display: "flex", flexDirection: "column", gap: "1rem" },
  modalBtns    : { display: "flex", gap: "0.5rem", marginTop: "0.5rem" },
};

const modalStyles = {
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 },
  box    : { backgroundColor: "#fff", borderRadius: "14px", padding: "1.75rem", width: "100%", maxWidth: "500px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },
  header : { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" },
  title  : { fontSize: "1.1rem", fontWeight: "700", color: "#111827", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: "1.1rem", cursor: "pointer", color: "#9ca3af", padding: 0 },
};
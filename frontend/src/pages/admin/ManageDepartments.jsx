import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

// ── Component ─────────────────────────────────────────────────────────────────
export default function ManageDepartments() {
  const navigate = useNavigate();

  const [departments, setDepartments]   = useState([]);
  const [loading,     setLoading]       = useState(true);
  const [error,       setError]         = useState("");
  const [actionMsg,   setActionMsg]     = useState("");
  const [actionErr,   setActionErr]     = useState("");

  // Create modal
  const [showModal,   setShowModal]     = useState(false);
  const [form,        setForm]          = useState({ name: "", code: "" });
  const [formErrors,  setFormErrors]    = useState({});
  const [submitting,  setSubmitting]    = useState(false);

  // Deactivate confirm
  const [deactivateId, setDeactivateId] = useState(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await api.get("/departments");
      const data = res.data?.data ?? res.data;
      setDepartments(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load departments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  // ── Create ────────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Department name is required.";
    if (!form.code.trim()) errs.code = "Department code is required.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setActionErr("");
    try {
      await api.post("/departments", { name: form.name.trim(), code: form.code.trim().toUpperCase() });
      setActionMsg("Department created successfully.");
      setShowModal(false);
      setForm({ name: "", code: "" });
      fetchDepartments();
    } catch (err) {
      setActionErr(err?.response?.data?.message ?? "Failed to create department.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Deactivate ────────────────────────────────────────────────────────────
  const handleDeactivate = async () => {
    if (!deactivateId) return;
    setActionErr("");
    try {
      await api.put(`/departments/${deactivateId}/deactivate`);
      setActionMsg("Department deactivated.");
      setDeactivateId(null);
      fetchDepartments();
    } catch (err) {
      setActionErr(err?.response?.data?.message ?? "Failed to deactivate department.");
      setDeactivateId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>
        ← Back to Dashboard
      </button>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Manage Departments</h1>
          <p style={styles.subtitle}>{departments.length} department(s) active</p>
        </div>
        <button onClick={() => { setShowModal(true); setActionMsg(""); setActionErr(""); }}
          style={styles.primaryBtn}>
          + Add Department
        </button>
      </div>

      {/* Feedback */}
      {actionMsg && <div style={styles.successBanner}>✓ {actionMsg}</div>}
      {actionErr && <div style={styles.errorBanner}>⚠ {actionErr}</div>}

      {/* Table */}
      {loading ? (
        <div style={styles.centered}><div style={styles.spinner} /></div>
      ) : error ? (
        <div style={styles.errorBanner}>{error}</div>
      ) : departments.length === 0 ? (
        <div style={styles.empty}>No departments found. Add one to get started.</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Code", "Name", "Actions"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departments.map((d, i) => (
                <tr key={d.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  <td style={styles.td}>
                    <span style={styles.codeBadge}>{d.code}</span>
                  </td>
                  <td style={styles.td}>{d.name}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => { setDeactivateId(d.id); setActionMsg(""); setActionErr(""); }}
                      style={styles.deactivateBtn}>
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <Modal title="Add Department" onClose={() => { setShowModal(false); setForm({ name: "", code: "" }); setFormErrors({}); }}>
          <form onSubmit={handleCreate} noValidate style={styles.modalForm}>
            <FormField label="Department Name" error={formErrors.name}>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                style={inputStyle(formErrors.name)} placeholder="e.g. College of Engineering" />
            </FormField>
            <FormField label="Code" error={formErrors.code}>
              <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                style={inputStyle(formErrors.code)} placeholder="e.g. COE" maxLength={10} />
            </FormField>
            {actionErr && <div style={styles.errorBanner}>⚠ {actionErr}</div>}
            <div style={styles.modalBtns}>
              <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>Cancel</button>
              <button type="submit" disabled={submitting} style={styles.primaryBtn}>
                {submitting ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Deactivate confirm */}
      {deactivateId && (
        <Modal title="Confirm Deactivation" onClose={() => setDeactivateId(null)}>
          <p style={{ color: "#374151", marginBottom: "1.25rem", lineHeight: "1.6" }}>
            Are you sure you want to deactivate this department? It will no longer appear in registration.
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

// ── Shared sub-components ─────────────────────────────────────────────────────
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
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#374151" }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: "0.78rem", color: "#dc2626" }}>{error}</span>}
    </div>
  );
}

const inputStyle = (err) => ({
  padding        : "0.65rem 0.9rem",
  border         : `1.5px solid ${err ? "#dc2626" : "#d1d5db"}`,
  borderRadius   : "8px",
  fontSize       : "0.9rem",
  color          : "#111827",
  backgroundColor: "#fff",
  width          : "100%",
  boxSizing      : "border-box",
});

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page        : { padding: "2rem 2.5rem", maxWidth: "900px", margin: "0 auto", fontFamily: "'Sora', 'Segoe UI', sans-serif" },
  backBtn     : { background: "none", border: "none", color: "#1a56db", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", padding: 0, marginBottom: "1.5rem" },
  header      : { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" },
  title       : { fontSize: "1.75rem", fontWeight: "700", color: "#111827", margin: "0 0 0.2rem", letterSpacing: "-0.02em" },
  subtitle    : { color: "#6b7280", fontSize: "0.9rem", margin: 0 },
  primaryBtn  : { padding: "0.65rem 1.2rem", backgroundColor: "#1a56db", color: "#fff", border: "none", borderRadius: "8px", fontSize: "0.9rem", fontWeight: "600", cursor: "pointer" },
  cancelBtn   : { flex: 1, padding: "0.7rem", backgroundColor: "transparent", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "0.9rem", cursor: "pointer", color: "#6b7280", fontWeight: "600" },
  dangerBtn   : { flex: 1, padding: "0.7rem", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", fontSize: "0.9rem", fontWeight: "600", cursor: "pointer" },
  successBanner: { padding: "0.75rem 1rem", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#14532d", fontSize: "0.875rem", marginBottom: "1rem" },
  errorBanner : { padding: "0.75rem 1rem", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "0.875rem", marginBottom: "1rem" },
  centered    : { display: "flex", justifyContent: "center", padding: "3rem" },
  spinner     : { width: "32px", height: "32px", border: "3px solid #e5e7eb", borderTop: "3px solid #1a56db", borderRadius: "50%", animation: "spin 0.7s linear infinite" },
  empty       : { textAlign: "center", color: "#9ca3af", padding: "3rem", fontSize: "0.95rem" },
  tableWrap   : { borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  table       : { width: "100%", borderCollapse: "collapse" },
  th          : { padding: "0.85rem 1.25rem", textAlign: "left", fontSize: "0.78rem", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" },
  td          : { padding: "0.9rem 1.25rem", fontSize: "0.9rem", color: "#111827", borderBottom: "1px solid #f3f4f6" },
  codeBadge   : { padding: "0.25rem 0.65rem", backgroundColor: "#eff6ff", color: "#1a56db", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "700" },
  deactivateBtn: { padding: "0.35rem 0.85rem", backgroundColor: "transparent", border: "1.5px solid #fca5a5", color: "#dc2626", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer" },
  modalForm   : { display: "flex", flexDirection: "column", gap: "1rem" },
  modalBtns   : { display: "flex", gap: "0.5rem", marginTop: "0.5rem" },
};

const modalStyles = {
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 },
  box     : { backgroundColor: "#fff", borderRadius: "14px", padding: "1.75rem", width: "100%", maxWidth: "440px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },
  header  : { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" },
  title   : { fontSize: "1.1rem", fontWeight: "700", color: "#111827", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: "1.1rem", cursor: "pointer", color: "#9ca3af", padding: 0 },
};
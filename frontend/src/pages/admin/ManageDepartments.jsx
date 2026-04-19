import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

export default function ManageDepartments() {
  const [depts,    setDepts]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ name: "", code: "" });
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get("/departments");
      setDepts(res.data?.data ?? res.data ?? []);
    } catch (e) {
      setError(e?.response?.data?.message ?? "Failed to load departments.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = depts.filter(d =>
    (d.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (d.code ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async e => {
    e.preventDefault();
    setSaving(true); setSaveMsg(null);
    try {
      await api.post("/departments", form);
      setSaveMsg({ type: "success", text: "✅ Department created." });
      setForm({ name: "", code: "" });
      setShowForm(false);
      load();
    } catch (err) {
      setSaveMsg({ type: "error", text: "❌ " + (err?.response?.data?.message ?? "Create failed.") });
    } finally { setSaving(false); }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"?`)) return;
    try {
      await api.put(`/departments/${id}/deactivate`);
      load();
    } catch (err) {
      alert(err?.response?.data?.message ?? "Deactivate failed.");
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 860 }}>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <input
          className="form-input" style={{ width: 260 }}
          placeholder="🔍 Search departments…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" onClick={() => { setShowForm(f => !f); setSaveMsg(null); }}>
          {showForm ? "✕ Cancel" : "+ Add Department"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20, borderColor: "var(--primary-light)" }}>
          <h3 className="card-title" style={{ fontSize: 15 }}>New Department</h3>
          {saveMsg && (
            <div className={`alert ${saveMsg.type === "success" ? "alert-success" : "alert-error"}`}>
              {saveMsg.text}
            </div>
          )}
          <form onSubmit={handleCreate}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Department Name</label>
                <input className="form-input" value={form.name} required
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="College of Nursing" />
              </div>
              <div className="form-group">
                <label className="form-label">Code</label>
                <input className="form-input" value={form.code} required
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="CON" maxLength={20} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Create Department"}
            </button>
          </form>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="tc-table">
          <thead>
            <tr>
              <th>Department Name</th>
              <th>Code</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>No departments found.</td></tr>
            ) : filtered.map(d => (
              <tr key={d.id}>
                <td style={{ fontWeight: 600 }}>{d.name}</td>
                <td>
                  <span style={{ background:"rgba(52,196,124,0.1)", color:"#1A6A2A", padding:"3px 10px", borderRadius:6, fontSize:12, fontWeight:700, border:"1px solid rgba(52,196,124,0.2)" }}>
                    {d.code}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${d.active || d.isActive ? "status-active" : "status-inactive"}`}>
                    {d.active || d.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  {(d.active || d.isActive) && (
                    <button
                      className="btn btn-sm btn-outline"
                      style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                      onClick={() => handleDeactivate(d.id, d.name)}
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>
        {filtered.length} department{filtered.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
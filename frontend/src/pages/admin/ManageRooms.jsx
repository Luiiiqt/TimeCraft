import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

export default function ManageRooms() {
  const [rooms,    setRooms]    = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const [campusFilter, setCampusFilter] = useState("");
  const [typeFilter,   setTypeFilter]   = useState("");
  const [search,       setSearch]       = useState("");
  const [showForm,     setShowForm]     = useState(false);
  const [form, setForm] = useState({ campusId: "", name: "", roomNumber: "", capacity: "", roomType: "LECTURE" });
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  // Load campuses once
  useEffect(() => {
    api.get("/rooms/campuses")
      .then(r => setCampuses(r.data?.data ?? r.data ?? []))
      .catch(() => {});
  }, []);

  const loadRooms = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = {};
      if (campusFilter) params.campusId = campusFilter;
      if (typeFilter)   params.roomType = typeFilter;
      const res = await api.get("/rooms", { params });
      setRooms(res.data?.data ?? res.data ?? []);
    } catch (e) {
      setError(e?.response?.data?.message ?? "Failed to load rooms.");
    } finally { setLoading(false); }
  }, [campusFilter, typeFilter]);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  const filtered = rooms.filter(r =>
    (r.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (r.roomNumber ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async e => {
    e.preventDefault(); setSaving(true); setSaveMsg(null);
    try {
      await api.post("/rooms", {
        campusId:   Number(form.campusId),
        name:       form.name,
        roomNumber: form.roomNumber,
        capacity:   Number(form.capacity),
        roomType:   form.roomType,
      });
      setSaveMsg({ type: "success", text: "✅ Room created." });
      setForm({ campusId: "", name: "", roomNumber: "", capacity: "", roomType: "LECTURE" });
      setShowForm(false);
      loadRooms();
    } catch (err) {
      setSaveMsg({ type: "error", text: "❌ " + (err?.response?.data?.message ?? "Create failed.") });
    } finally { setSaving(false); }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate room "${name}"?`)) return;
    try {
      await api.put(`/rooms/${id}/deactivate`);
      loadRooms();
    } catch (err) {
      alert(err?.response?.data?.message ?? "Failed.");
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 960 }}>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            className="form-input" style={{ width: 220 }}
            placeholder="🔍 Search rooms…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <select className="form-select" style={{ width: 160 }}
            value={campusFilter} onChange={e => setCampusFilter(e.target.value)}>
            <option value="">All Campuses</option>
            {campuses.map(c => <option key={c.id} value={c.id}>{c.name || c.code}</option>)}
          </select>
          <select className="form-select" style={{ width: 140 }}
            value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="LECTURE">Lecture</option>
            <option value="LABORATORY">Laboratory</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(f => !f); setSaveMsg(null); }}>
          {showForm ? "✕ Cancel" : "+ Add Room"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20, borderColor: "var(--green-mid)" }}>
          <h3 className="card-title" style={{ fontSize: 15, color: "var(--green-mid)" }}>New Room</h3>
          {saveMsg && (
            <div className={`alert ${saveMsg.type === "success" ? "alert-success" : "alert-error"}`}>
              {saveMsg.text}
            </div>
          )}
          <form onSubmit={handleCreate}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Campus</label>
                <select className="form-select" value={form.campusId} required
                  onChange={e => setForm(f => ({ ...f, campusId: e.target.value }))}>
                  <option value="">Select campus…</option>
                  {campuses.map(c => <option key={c.id} value={c.id}>{c.name || c.code}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Room Type</label>
                <select className="form-select" value={form.roomType}
                  onChange={e => setForm(f => ({ ...f, roomType: e.target.value }))}>
                  <option value="LECTURE">Lecture</option>
                  <option value="LABORATORY">Laboratory</option>
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Room Name</label>
                <input className="form-input" value={form.name} required
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="LI Lecture Room 101" />
              </div>
              <div className="form-group">
                <label className="form-label">Room Number</label>
                <input className="form-input" value={form.roomNumber}
                  onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))}
                  placeholder="101" />
              </div>
            </div>
            <div className="form-group" style={{ maxWidth: 200 }}>
              <label className="form-label">Capacity</label>
              <input className="form-input" type="number" min={1} value={form.capacity} required
                onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                placeholder="45" />
            </div>
            <button type="submit" className="btn btn-success" disabled={saving}>
              {saving ? "Saving…" : "Create Room"}
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
              <th>Room Name</th>
              <th>Number</th>
              <th>Campus</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>No rooms found.</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td style={{ color: "var(--text-secondary)" }}>{r.roomNumber || "—"}</td>
                <td>{r.campus?.name || r.campus?.code || "—"}</td>
                <td>
                  <span style={{
                    padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: r.roomType === "LABORATORY" ? "#F0FBF4" : "#EEF4FF",
                    color: r.roomType === "LABORATORY" ? "var(--green-mid)" : "var(--primary)",
                  }}>
                    {r.roomType === "LABORATORY" ? "🔬 Lab" : "🎓 Lecture"}
                  </span>
                </td>
                <td>{r.capacity}</td>
                <td>
                  <span className={`status-badge ${r.active || r.isActive ? "status-active" : "status-inactive"}`}>
                    {r.active || r.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  {(r.active || r.isActive) && (
                    <button
                      className="btn btn-sm btn-outline"
                      style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                      onClick={() => handleDeactivate(r.id, r.name)}
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
        {filtered.length} room{filtered.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
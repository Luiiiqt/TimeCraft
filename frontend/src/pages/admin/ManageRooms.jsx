import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

const TC_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');

  @keyframes tcFadeUp   { from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);} }
  @keyframes tcSlideIn  { from{opacity:0;transform:translateY(-8px) scale(0.98);}to{opacity:1;transform:translateY(0) scale(1);} }
  @keyframes tcBlink    { 0%,100%{opacity:1;}50%{opacity:0;} }
  @keyframes tcSpin     { to{transform:rotate(360deg);} }

  .tc-rm * { box-sizing:border-box; }
  .tc-rm { animation:tcFadeUp 0.45s ease both; }

  .tc-rm-input {
    padding:10px 13px; width:100%;
    background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.08);
    border-radius:10px; font-size:13px; color:#fff; outline:none;
    font-family:'DM Sans',sans-serif;
    transition:border-color 0.2s,background 0.2s,box-shadow 0.2s;
  }
  .tc-rm-input::placeholder { color:rgba(255,255,255,0.18); }
  .tc-rm-input:focus { border-color:rgba(34,197,94,0.45); background:rgba(34,197,94,0.04); box-shadow:0 0 0 3px rgba(34,197,94,0.07); }
  .tc-rm-input option { background:#0d1626; color:#fff; }

  .tc-rm-label { display:block; font-size:10px; font-weight:700; color:rgba(255,255,255,0.3); margin-bottom:5px; letter-spacing:0.12em; text-transform:uppercase; font-family:'DM Mono',monospace; }

  .tc-rm-btn-primary {
    display:inline-flex; align-items:center; gap:7px;
    padding:10px 20px; border:none; border-radius:10px;
    background:linear-gradient(135deg,#22C55E,#16A34A);
    color:#fff; font-size:13px; font-weight:700;
    cursor:pointer; font-family:'DM Sans',sans-serif;
    transition:all 0.2s; box-shadow:0 4px 16px rgba(34,197,94,0.28); white-space:nowrap;
  }
  .tc-rm-btn-primary:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(34,197,94,0.42); }
  .tc-rm-btn-primary:disabled { opacity:0.45; cursor:not-allowed; }

  .tc-rm-btn-ghost {
    display:inline-flex; align-items:center; gap:7px;
    padding:9px 18px; border-radius:10px;
    border:1.5px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03);
    color:rgba(255,255,255,0.55); font-size:13px; font-weight:600;
    cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s;
  }
  .tc-rm-btn-ghost:hover { background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.85); border-color:rgba(255,255,255,0.2); }

  .tc-rm-btn-danger {
    display:inline-flex; align-items:center; gap:5px;
    padding:6px 13px; border-radius:8px; font-size:11px; font-weight:700;
    border:1px solid rgba(220,38,38,0.25); background:rgba(220,38,38,0.08);
    color:#fca5a5; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s;
  }
  .tc-rm-btn-danger:hover { background:rgba(220,38,38,0.18); border-color:rgba(220,38,38,0.4); }

  .tc-rm-table-wrap {
    background:rgba(15,23,42,0.6); backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,0.07); border-radius:18px; overflow:hidden;
    box-shadow:0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.03) inset;
  }
  .tc-rm-table { width:100%; border-collapse:collapse; }
  .tc-rm-table thead tr { background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.07); }
  .tc-rm-table th { padding:13px 20px; text-align:left; font-size:10px; font-weight:700; color:rgba(255,255,255,0.28); letter-spacing:0.12em; text-transform:uppercase; font-family:'DM Mono',monospace; }
  .tc-rm-table td { padding:14px 20px; font-size:13px; color:rgba(255,255,255,0.7); border-bottom:1px solid rgba(255,255,255,0.04); font-family:'DM Sans',sans-serif; transition:background 0.15s; }
  .tc-rm-table tbody tr:last-child td { border-bottom:none; }
  .tc-rm-table tbody tr:hover td { background:rgba(34,197,94,0.04); }

  .tc-rm-alert-ok  { padding:11px 16px; border-radius:10px; background:rgba(34,197,94,0.09);  border:1px solid rgba(34,197,94,0.2);  color:#86efac; font-size:13px; margin-bottom:16px; font-family:'DM Sans',sans-serif; animation:tcSlideIn 0.25s ease both; }
  .tc-rm-alert-err { padding:11px 16px; border-radius:10px; background:rgba(220,38,38,0.09);  border:1px solid rgba(220,38,38,0.2);  color:#fca5a5; font-size:13px; margin-bottom:16px; font-family:'DM Sans',sans-serif; animation:tcSlideIn 0.25s ease both; }

  .tc-rm-create-panel {
    background:rgba(34,197,94,0.04); border:1px solid rgba(34,197,94,0.18);
    border-radius:16px; padding:24px 26px; margin-bottom:22px;
    animation:tcSlideIn 0.3s ease both; backdrop-filter:blur(12px);
  }

  .tc-rm-search-wrap { position:relative; }
  .tc-rm-search-wrap .tc-rm-input { padding-left:36px; }
  .tc-rm-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:13px; color:rgba(255,255,255,0.22); pointer-events:none; }
`;

const ROOM_TYPES = ["LECTURE","LABORATORY"];

export default function ManageRooms() {
  const [rooms,    setRooms]    = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const [campusFilter, setCampusFilter] = useState("");
  const [typeFilter,   setTypeFilter]   = useState("");
  const [search,       setSearch]       = useState("");
  const [showForm,     setShowForm]     = useState(false);
  const [form, setForm] = useState({ campusId:"", name:"", roomNumber:"", capacity:"", roomType:"LECTURE" });
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

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
      setSaveMsg({ ok: true, text: "Room created successfully." });
      setForm({ campusId:"", name:"", roomNumber:"", capacity:"", roomType:"LECTURE" });
      setShowForm(false);
      loadRooms();
    } catch (err) {
      setSaveMsg({ ok: false, text: err?.response?.data?.message ?? "Create failed." });
    } finally { setSaving(false); }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate room "${name}"?`)) return;
    try { await api.put(`/rooms/${id}/deactivate`); loadRooms(); }
    catch (err) { alert(err?.response?.data?.message ?? "Failed."); }
  };

  // Derived stats
  const activeCount    = rooms.filter(r => r.active || r.isActive).length;
  const labCount       = rooms.filter(r => r.roomType === "LABORATORY").length;
  const lectureCount   = rooms.filter(r => r.roomType === "LECTURE").length;

  return (
    <div className="tc-rm" style={{ color:"#fff", fontFamily:"'DM Sans',sans-serif", background:"#070f1e", minHeight:"100vh", padding:"32px" }}>
      <style>{TC_STYLES}</style>

      {/* ── Page header ──────────────────────────────────────────── */}
      <div style={{ marginBottom:30 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.22)", borderRadius:100, padding:"5px 14px", marginBottom:14 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"#22C55E", display:"inline-block", animation:"tcBlink 2s ease infinite" }} />
          <span style={{ fontSize:10, fontWeight:700, color:"#4ADE80", letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"'DM Mono',monospace" }}>Admin · Facilities</span>
        </div>
        <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:28, fontWeight:800, color:"#fff", letterSpacing:"-0.03em", margin:"0 0 6px" }}>Rooms</h1>
        <p style={{ fontSize:14, color:"rgba(255,255,255,0.38)", margin:0 }}>Manage classrooms, labs, and lecture halls across all campuses.</p>
      </div>

      {/* ── Stats strip ──────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:14, marginBottom:28, flexWrap:"wrap" }}>
        {[
          { label:"Total Rooms",   value:rooms.length,  color:"#22C55E" },
          { label:"Active",        value:activeCount,   color:"#3B82F6" },
          { label:"Laboratories",  value:labCount,      color:"#8B5CF6" },
          { label:"Lecture Rooms", value:lectureCount,  color:"#F59E0B" },
        ].map(s => (
          <div key={s.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"12px 20px", display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontFamily:"'Sora',sans-serif", fontSize:24, fontWeight:800, color:s.color, letterSpacing:"-0.03em", lineHeight:1 }}>{s.value}</span>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'DM Mono',monospace" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, gap:10, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
          {/* Search */}
          <div className="tc-rm-search-wrap" style={{ width:240 }}>
            <span className="tc-rm-search-icon">🔍</span>
            <input className="tc-rm-input" placeholder="Search rooms…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {/* Campus filter */}
          <select className="tc-rm-input" style={{ width:160 }} value={campusFilter} onChange={e => setCampusFilter(e.target.value)}>
            <option value="">All Campuses</option>
            {campuses.map(c => <option key={c.id} value={c.id}>{c.name ?? c.code}</option>)}
          </select>
          {/* Type filter */}
          <select className="tc-rm-input" style={{ width:150 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="LECTURE">Lecture</option>
            <option value="LABORATORY">Laboratory</option>
          </select>
        </div>
        <button className={showForm ? "tc-rm-btn-ghost" : "tc-rm-btn-primary"}
          onClick={() => { setShowForm(f => !f); setSaveMsg(null); }}>
          {showForm ? "✕  Cancel" : "+ Add Room"}
        </button>
      </div>

      {/* ── Create form ──────────────────────────────────────────── */}
      {showForm && (
        <div className="tc-rm-create-panel">
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:"rgba(34,197,94,0.15)", border:"1px solid rgba(34,197,94,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>🏫</div>
            <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:14, fontWeight:700, color:"#86efac", margin:0 }}>New Room</h3>
          </div>

          {saveMsg && <div className={saveMsg.ok ? "tc-rm-alert-ok" : "tc-rm-alert-err"}>{saveMsg.text}</div>}

          <form onSubmit={handleCreate}>
            {/* Row 1 */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
              <div>
                <label className="tc-rm-label">Campus</label>
                <select className="tc-rm-input" value={form.campusId} required onChange={e => setForm(f => ({ ...f, campusId:e.target.value }))}>
                  <option value="">Select campus…</option>
                  {campuses.map(c => <option key={c.id} value={c.id}>{c.name ?? c.code}</option>)}
                </select>
              </div>
              <div>
                <label className="tc-rm-label">Room Type</label>
                <select className="tc-rm-input" value={form.roomType} onChange={e => setForm(f => ({ ...f, roomType:e.target.value }))}>
                  <option value="LECTURE">🎓 Lecture</option>
                  <option value="LABORATORY">🔬 Laboratory</option>
                </select>
              </div>
            </div>
            {/* Row 2 */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
              <div>
                <label className="tc-rm-label">Room Name</label>
                <input className="tc-rm-input" value={form.name} required
                  onChange={e => setForm(f => ({ ...f, name:e.target.value }))}
                  placeholder="e.g. LI Lecture Room 101" />
              </div>
              <div>
                <label className="tc-rm-label">Room Number</label>
                <input className="tc-rm-input" value={form.roomNumber}
                  onChange={e => setForm(f => ({ ...f, roomNumber:e.target.value }))}
                  placeholder="e.g. 101" />
              </div>
            </div>
            {/* Row 3 */}
            <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:14, marginBottom:18, alignItems:"end" }}>
              <div>
                <label className="tc-rm-label">Capacity</label>
                <input className="tc-rm-input" type="number" min={1} value={form.capacity} required
                  onChange={e => setForm(f => ({ ...f, capacity:e.target.value }))}
                  placeholder="e.g. 45" />
              </div>
              <div />
            </div>
            <button type="submit" className="tc-rm-btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Create Room"}
            </button>
          </form>
        </div>
      )}

      {error && <div className="tc-rm-alert-err">{error}</div>}

      {/* ── Table ────────────────────────────────────────────────── */}
      <div className="tc-rm-table-wrap">
        {/* Chrome bar */}
        <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ display:"flex", gap:5 }}>
              {["#FF5F57","#FFBD2E","#28C840"].map((c, i) => (
                <div key={i} style={{ width:9, height:9, borderRadius:"50%", background:c }} />
              ))}
            </div>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.2)", fontFamily:"'DM Mono',monospace", letterSpacing:"0.08em", marginLeft:6 }}>
              ROOMS — {filtered.length} RECORDS
            </span>
          </div>
          {loading && <div style={{ width:13, height:13, border:"2px solid rgba(34,197,94,0.15)", borderTopColor:"#22C55E", borderRadius:"50%", animation:"tcSpin 0.7s linear infinite" }} />}
        </div>

        <table className="tc-rm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Room Name</th>
              <th>Number</th>
              <th>Campus</th>
              <th>Type</th>
              <th>Cap.</th>
              <th>Status</th>
              <th style={{ textAlign:"right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign:"center", padding:48, color:"rgba(255,255,255,0.2)" }}>
                  <div style={{ display:"inline-block", width:20, height:20, border:"2px solid rgba(34,197,94,0.2)", borderTopColor:"#22C55E", borderRadius:"50%", animation:"tcSpin 0.7s linear infinite" }} />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign:"center", padding:56, color:"rgba(255,255,255,0.18)", fontFamily:"'DM Mono',monospace", fontSize:12, letterSpacing:"0.06em" }}>
                  NO ROOMS FOUND
                </td>
              </tr>
            ) : filtered.map((r, i) => {
              const isActive = r.active || r.isActive;
              const isLab    = r.roomType === "LABORATORY";
              return (
                <tr key={r.id}>
                  <td style={{ color:"rgba(255,255,255,0.2)", fontFamily:"'DM Mono',monospace", fontSize:11 }}>
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td style={{ fontWeight:600, color:"#fff" }}>{r.name}</td>
                  <td>
                    {r.roomNumber
                      ? <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"rgba(255,255,255,0.45)", background:"rgba(255,255,255,0.05)", padding:"3px 9px", borderRadius:6, border:"1px solid rgba(255,255,255,0.08)" }}>{r.roomNumber}</span>
                      : <span style={{ color:"rgba(255,255,255,0.2)" }}>—</span>
                    }
                  </td>
                  <td style={{ color:"rgba(255,255,255,0.55)" }}>{r.campus?.name ?? r.campus?.code ?? "—"}</td>
                  <td>
                    <span style={{
                      display:"inline-flex", alignItems:"center", gap:5,
                      padding:"4px 11px", borderRadius:7, fontSize:11, fontWeight:700,
                      background: isLab ? "rgba(139,92,246,0.1)" : "rgba(59,130,246,0.1)",
                      color:      isLab ? "#c4b5fd"             : "#93c5fd",
                      border:     `1px solid ${isLab ? "rgba(139,92,246,0.25)" : "rgba(59,130,246,0.25)"}`,
                    }}>
                      {isLab ? "🔬 Lab" : "🎓 Lecture"}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"rgba(255,255,255,0.5)", fontWeight:700 }}>{r.capacity}</span>
                  </td>
                  <td>
                    <span style={{
                      display:"inline-flex", alignItems:"center", gap:5,
                      padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:700,
                      background: isActive ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
                      color:      isActive ? "#86efac"             : "rgba(255,255,255,0.28)",
                      border:     `1px solid ${isActive ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)"}`,
                    }}>
                      <span style={{ width:5, height:5, borderRadius:"50%", background:isActive ? "#22C55E" : "rgba(255,255,255,0.2)", display:"inline-block" }} />
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ textAlign:"right" }}>
                    {isActive && (
                      <button className="tc-rm-btn-danger" onClick={() => handleDeactivate(r.id, r.name)}>
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop:12, fontSize:11, color:"rgba(255,255,255,0.2)", fontFamily:"'DM Mono',monospace", letterSpacing:"0.06em" }}>
        {filtered.length} ROOM{filtered.length !== 1 ? "S" : ""}
        {search && ` · FILTERED FROM ${rooms.length}`}
      </div>
    </div>
  );
}
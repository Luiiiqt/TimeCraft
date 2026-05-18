import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

const TC_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');

  @keyframes tcFadeUp   { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
  @keyframes tcSlideIn  { from{opacity:0;transform:translateY(-8px) scale(0.98);}to{opacity:1;transform:translateY(0) scale(1);} }
  @keyframes tcBlink    { 0%,100%{opacity:1;} 50%{opacity:0;} }
  @keyframes tcSpin     { to{transform:rotate(360deg);} }

  .tc-page * { box-sizing:border-box; }
  .tc-page { animation:tcFadeUp 0.45s ease both; }

  .tc-input {
    width:100%; padding:10px 14px;
    background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.08);
    border-radius:10px; font-size:13px; color:#fff; outline:none;
    font-family:'DM Sans',sans-serif;
    transition:border-color 0.2s,background 0.2s,box-shadow 0.2s;
  }
  .tc-input::placeholder { color:rgba(255,255,255,0.18); }
  .tc-input:focus { border-color:rgba(34,197,94,0.5); background:rgba(34,197,94,0.04); box-shadow:0 0 0 3px rgba(34,197,94,0.08); }
  .tc-input option { background:#0f1a2e; color:#fff; }

  .tc-label { display:block; font-size:10px; font-weight:700; color:rgba(255,255,255,0.3); margin-bottom:5px; letter-spacing:0.12em; text-transform:uppercase; font-family:'DM Mono',monospace; }

  .tc-btn-primary {
    display:inline-flex; align-items:center; gap:7px;
    padding:10px 20px; border:none; border-radius:10px;
    background:linear-gradient(135deg,#22C55E,#16A34A);
    color:#fff; font-size:13px; font-weight:700;
    cursor:pointer; font-family:'DM Sans',sans-serif;
    transition:all 0.2s; letter-spacing:0.01em;
    box-shadow:0 4px 16px rgba(34,197,94,0.3); white-space:nowrap;
  }
  .tc-btn-primary:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(34,197,94,0.45); }
  .tc-btn-primary:disabled { opacity:0.5; cursor:not-allowed; }

  .tc-btn-ghost {
    display:inline-flex; align-items:center; gap:7px;
    padding:9px 18px; border-radius:10px;
    border:1.5px solid rgba(255,255,255,0.1);
    background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.55);
    font-size:13px; font-weight:600;
    cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s;
    white-space:nowrap;
  }
  .tc-btn-ghost:hover { background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.85); border-color:rgba(255,255,255,0.2); }

  .tc-btn-danger {
    display:inline-flex; align-items:center; gap:5px;
    padding:6px 13px; border-radius:8px; font-size:11px; font-weight:700;
    border:1px solid rgba(220,38,38,0.25); background:rgba(220,38,38,0.08);
    color:#fca5a5; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s;
    white-space:nowrap;
  }
  .tc-btn-danger:hover { background:rgba(220,38,38,0.18); border-color:rgba(220,38,38,0.4); }

  .tc-table-wrap {
    background:rgba(15,23,42,0.6); backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,0.07); border-radius:18px;
    overflow:hidden; overflow-x:auto; -webkit-overflow-scrolling:touch;
    box-shadow:0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.03) inset;
  }
  .tc-table { width:100%; border-collapse:collapse; min-width:400px; }
  .tc-table thead tr { background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.07); }
  .tc-table th { padding:13px 16px; text-align:left; font-size:10px; font-weight:700; color:rgba(255,255,255,0.28); letter-spacing:0.12em; text-transform:uppercase; font-family:'DM Mono',monospace; white-space:nowrap; }
  .tc-table td { padding:13px 16px; font-size:13px; color:rgba(255,255,255,0.7); border-bottom:1px solid rgba(255,255,255,0.04); font-family:'DM Sans',sans-serif; transition:background 0.15s; }
  .tc-table tbody tr:last-child td { border-bottom:none; }
  .tc-table tbody tr:hover td { background:rgba(34,197,94,0.04); }

  .tc-alert-ok { padding:11px 16px; border-radius:10px; background:rgba(34,197,94,0.09); border:1px solid rgba(34,197,94,0.2); color:#86efac; font-size:13px; margin-bottom:16px; font-family:'DM Sans',sans-serif; animation:tcSlideIn 0.25s ease both; }
  .tc-alert-err { padding:11px 16px; border-radius:10px; background:rgba(220,38,38,0.09); border:1px solid rgba(220,38,38,0.2); color:#fca5a5; font-size:13px; margin-bottom:16px; font-family:'DM Sans',sans-serif; animation:tcSlideIn 0.25s ease both; }

  .tc-create-panel { background:rgba(34,197,94,0.04); border:1px solid rgba(34,197,94,0.18); border-radius:16px; padding:clamp(16px,3vw,24px) clamp(16px,3vw,26px); margin-bottom:22px; animation:tcSlideIn 0.3s ease both; backdrop-filter:blur(12px); }

  .tc-search-wrap { position:relative; width:100%; max-width:300px; }
  .tc-search-wrap .tc-input { padding-left:36px; }
  .tc-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:13px; color:rgba(255,255,255,0.22); pointer-events:none; }

  /* Stats strip */
  .tc-stats-strip { display:flex; gap:14px; margin-bottom:28px; flex-wrap:wrap; }
  .tc-stat-item { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:12px 16px; display:flex; align-items:center; gap:12px; flex:1 1 100px; }

  /* Toolbar */
  .tc-toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; gap:12px; flex-wrap:wrap; }

  /* Form grid responsive */
  .tc-form-grid-2 { display:grid; grid-template-columns:1fr 200px; gap:14px; margin-bottom:16px; }

  @media (max-width:600px) {
    .tc-search-wrap { max-width:100%; }
    .tc-toolbar { flex-direction:column; align-items:stretch; }
    .tc-toolbar .tc-btn-primary, .tc-toolbar .tc-btn-ghost { width:100%; justify-content:center; }
    .tc-form-grid-2 { grid-template-columns:1fr; }
  }
`;

export default function ManageDepartments() {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", code: "" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get("/departments");
      setDepts(res.data?.data ?? res.data ?? []);
    } catch (e) { setError(e?.response?.data?.message ?? "Failed to load departments."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = depts.filter(d =>
    (d.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (d.code ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async e => {
    e.preventDefault(); setSaving(true); setSaveMsg(null);
    try {
      await api.post("/departments", form);
      setSaveMsg({ ok: true, text: "Department created successfully." });
      setForm({ name: "", code: "" }); setShowForm(false); load();
    } catch (err) { setSaveMsg({ ok: false, text: err?.response?.data?.message ?? "Create failed." }); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"?`)) return;
    try { await api.put(`/departments/${id}/deactivate`); load(); }
    catch (err) { alert(err?.response?.data?.message ?? "Deactivate failed."); }
  };

  return (
    <div className="tc-page" style={{ color: "#fff", fontFamily: "'DM Sans',sans-serif", background: "#070f1e", minHeight: "100vh", padding: "clamp(16px,4vw,32px)" }}>
      <style>{TC_STYLES}</style>

      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.22)", borderRadius: 100, padding: "5px 14px", marginBottom: 14 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block", animation: "tcBlink 2s ease infinite" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "#4ADE80", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono',monospace" }}>Admin · Academic Structure</span>
        </div>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(22px,5vw,28px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", margin: "0 0 6px" }}>Departments</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.38)", margin: 0, lineHeight: 1.6 }}>Manage academic departments and their codes across Lorma College.</p>
      </div>

      {/* Stats strip */}
      <div className="tc-stats-strip">
        {[
          { label: "Total",    value: depts.length,                                       color: "#22C55E" },
          { label: "Active",   value: depts.filter(d => d.active || d.isActive).length,   color: "#3B82F6" },
          { label: "Inactive", value: depts.filter(d => !(d.active || d.isActive)).length, color: "rgba(255,255,255,0.25)" },
        ].map(s => (
          <div key={s.label} className="tc-stat-item">
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(20px,4vw,24px)", fontWeight: 800, color: s.color, letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'DM Mono',monospace" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="tc-toolbar">
        <div className="tc-search-wrap">
          <span className="tc-search-icon">🔍</span>
          <input className="tc-input" placeholder="Search departments…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className={showForm ? "tc-btn-ghost" : "tc-btn-primary"} onClick={() => { setShowForm(f => !f); setSaveMsg(null); }}>
          {showForm ? "✕  Cancel" : "+ Add Department"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="tc-create-panel">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🏫</div>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: "#86efac", margin: 0 }}>New Department</h3>
          </div>
          {saveMsg && <div className={saveMsg.ok ? "tc-alert-ok" : "tc-alert-err"}>{saveMsg.text}</div>}
          <form onSubmit={handleCreate}>
            <div className="tc-form-grid-2">
              <div>
                <label className="tc-label">Department Name</label>
                <input className="tc-input" value={form.name} required onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. College of Nursing" />
              </div>
              <div>
                <label className="tc-label">Code</label>
                <input className="tc-input" value={form.code} required maxLength={20} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. CON" />
              </div>
            </div>
            <button type="submit" className="tc-btn-primary" disabled={saving}>{saving ? "Saving…" : "Create Department"}</button>
          </form>
        </div>
      )}

      {error && <div className="tc-alert-err">{error}</div>}

      {/* Table */}
      <div className="tc-table-wrap">
        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 5 }}>
              {["#FF5F57", "#FFBD2E", "#28C840"].map((c, i) => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono',monospace", letterSpacing: "0.08em", marginLeft: 6 }}>DEPARTMENTS — {filtered.length} RECORDS</span>
          </div>
          {loading && <div style={{ width: 14, height: 14, border: "2px solid rgba(34,197,94,0.2)", borderTopColor: "#22C55E", borderRadius: "50%", animation: "tcSpin 0.7s linear infinite" }} />}
        </div>

        <table className="tc-table">
          <thead>
            <tr><th>#</th><th>Department Name</th><th>Code</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 48, color: "rgba(255,255,255,0.2)" }}>
                <div style={{ display: "inline-block", width: 20, height: 20, border: "2px solid rgba(34,197,94,0.2)", borderTopColor: "#22C55E", borderRadius: "50%", animation: "tcSpin 0.7s linear infinite" }} />
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 56, color: "rgba(255,255,255,0.18)", fontFamily: "'DM Mono',monospace", fontSize: 12, letterSpacing: "0.06em" }}>NO DEPARTMENTS FOUND</td></tr>
            ) : filtered.map((d, i) => {
              const isActive = d.active || d.isActive;
              return (
                <tr key={d.id}>
                  <td style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{String(i + 1).padStart(2, "0")}</td>
                  <td><div style={{ fontWeight: 600, color: "#fff", fontSize: 14 }}>{d.name}</div></td>
                  <td>
                    <span style={{ background: "rgba(34,197,94,0.1)", color: "#86efac", padding: "4px 11px", borderRadius: 7, fontSize: 11, fontWeight: 700, border: "1px solid rgba(34,197,94,0.2)", fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em" }}>{d.code}</span>
                  </td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: isActive ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)", color: isActive ? "#86efac" : "rgba(255,255,255,0.28)", border: `1px solid ${isActive ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)"}` }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: isActive ? "#22C55E" : "rgba(255,255,255,0.2)", display: "inline-block" }} />
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {isActive && <button className="tc-btn-danger" onClick={() => handleDeactivate(d.id, d.name)}>Deactivate</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em" }}>
        {filtered.length} DEPARTMENT{filtered.length !== 1 ? "S" : ""}{search && ` · FILTERED FROM ${depts.length}`}
      </div>
    </div>
  );
}
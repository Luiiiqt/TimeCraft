import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

const TC = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');
  @keyframes tcFadeUp { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);} }

  .tc-dept * { box-sizing:border-box; }

  .tc-input-dark {
    width:100%; padding:9px 12px;
    background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.08);
    border-radius:8px; font-size:13px; color:#fff; outline:none;
    font-family:'DM Sans',sans-serif; transition:border-color 0.2s,background 0.2s;
  }
  .tc-input-dark::placeholder{color:rgba(255,255,255,0.2);}
  .tc-input-dark:focus{border-color:rgba(34,197,94,0.5);background:rgba(34,197,94,0.04);}
  .tc-input-dark option{background:#0f1a2e;}

  .tc-label-dark {
    display:block; font-size:10px; font-weight:700;
    color:rgba(255,255,255,0.3); margin-bottom:5px;
    letter-spacing:0.1em; text-transform:uppercase;
    font-family:'DM Mono',monospace;
  }

  .tc-btn-green {
    padding:9px 20px; border-radius:9px; border:none;
    background:linear-gradient(135deg,#22C55E,#16A34A);
    color:#fff; font-size:13px; font-weight:700;
    cursor:pointer; font-family:'DM Sans',sans-serif;
    transition:all 0.2s; box-shadow:0 4px 16px rgba(34,197,94,0.25);
    white-space:nowrap;
  }
  .tc-btn-green:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px rgba(34,197,94,0.4);}
  .tc-btn-green:disabled{opacity:.5;cursor:not-allowed;}

  .tc-btn-ghost {
    padding:8px 16px; border-radius:9px;
    border:1.5px solid rgba(255,255,255,0.1);
    background:rgba(255,255,255,0.03);
    color:rgba(255,255,255,0.5); font-size:13px; font-weight:600;
    cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s;
  }
  .tc-btn-ghost:hover{background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.8);}

  .tc-btn-danger-sm {
    padding:5px 12px; border-radius:7px; font-size:11px; font-weight:700;
    border:1px solid rgba(220,38,38,0.25); background:rgba(220,38,38,0.08);
    color:#fca5a5; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s;
  }
  .tc-btn-danger-sm:hover{background:rgba(220,38,38,0.18);}

  .tc-table-wrap {
    background:rgba(255,255,255,0.025);
    border:1px solid rgba(255,255,255,0.07);
    border-radius:14px; overflow:hidden;
  }
  .tc-table { width:100%; border-collapse:collapse; }
  .tc-table thead tr { background:rgba(255,255,255,0.04); border-bottom:1px solid rgba(255,255,255,0.07); }
  .tc-table th {
    padding:12px 18px; text-align:left;
    font-size:10px; font-weight:700; color:rgba(255,255,255,0.3);
    letter-spacing:0.1em; text-transform:uppercase; font-family:'DM Mono',monospace;
  }
  .tc-table td { padding:12px 18px; font-size:13px; color:rgba(255,255,255,0.75); border-bottom:1px solid rgba(255,255,255,0.04); font-family:'DM Sans',sans-serif; }
  .tc-table tbody tr:last-child td { border-bottom:none; }
  .tc-table tbody tr:hover td { background:rgba(255,255,255,0.03); }

  .tc-alert-ok  { padding:10px 14px; border-radius:9px; background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.2); color:#86efac; font-size:13px; margin-bottom:14px; font-family:'DM Sans',sans-serif; }
  .tc-alert-err { padding:10px 14px; border-radius:9px; background:rgba(220,38,38,0.1); border:1px solid rgba(220,38,38,0.2); color:#fca5a5; font-size:13px; margin-bottom:14px; font-family:'DM Sans',sans-serif; }

  .tc-create-panel {
    background:rgba(34,197,94,0.04); border:1px solid rgba(34,197,94,0.15);
    border-radius:14px; padding:22px 24px; margin-bottom:20px;
    animation:tcFadeUp 0.3s ease both;
  }
`;

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
      setForm({ name: "", code: "" });
      setShowForm(false);
      load();
    } catch (err) {
      setSaveMsg({ ok: false, text: err?.response?.data?.message ?? "Create failed." });
    } finally { setSaving(false); }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"?`)) return;
    try { await api.put(`/departments/${id}/deactivate`); load(); }
    catch (err) { alert(err?.response?.data?.message ?? "Deactivate failed."); }
  };

  return (
    <div className="tc-dept" style={{ color: "#fff", fontFamily: "'DM Sans',sans-serif", animation: "tcFadeUp 0.4s ease both" }}>
      <style>{TC}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", margin: 0 }}>
          Departments
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
          Manage academic departments and their codes.
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "rgba(255,255,255,0.25)" }}>🔍</span>
          <input className="tc-input-dark" style={{ paddingLeft: 32, width: 260 }}
            placeholder="Search departments…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className={showForm ? "tc-btn-ghost" : "tc-btn-green"}
          onClick={() => { setShowForm(f => !f); setSaveMsg(null); }}>
          {showForm ? "✕ Cancel" : "+ Add Department"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="tc-create-panel">
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: "#86efac", marginBottom: 16 }}>
            New Department
          </h3>
          {saveMsg && <div className={saveMsg.ok ? "tc-alert-ok" : "tc-alert-err"}>{saveMsg.text}</div>}
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 12, marginBottom: 14 }}>
              <div>
                <label className="tc-label-dark">Department Name</label>
                <input className="tc-input-dark" value={form.name} required
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="College of Nursing" />
              </div>
              <div>
                <label className="tc-label-dark">Code</label>
                <input className="tc-input-dark" value={form.code} required
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="CON" maxLength={20} />
              </div>
            </div>
            <button type="submit" className="tc-btn-green" disabled={saving}>
              {saving ? "Saving…" : "Create Department"}
            </button>
          </form>
        </div>
      )}

      {error && <div className="tc-alert-err">{error}</div>}

      {/* Table */}
      <div className="tc-table-wrap">
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
              <tr><td colSpan={4} style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.25)" }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.25)" }}>No departments found.</td></tr>
            ) : filtered.map(d => (
              <tr key={d.id}>
                <td style={{ fontWeight: 600, color: "#fff" }}>{d.name}</td>
                <td>
                  <span style={{ background: "rgba(34,197,94,0.12)", color: "#86efac", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, border: "1px solid rgba(34,197,94,0.2)", fontFamily: "'DM Mono',monospace" }}>
                    {d.code}
                  </span>
                </td>
                <td>
                  <span style={{
                    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: (d.active || d.isActive) ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)",
                    color: (d.active || d.isActive) ? "#86efac" : "rgba(255,255,255,0.3)",
                    border: `1px solid ${(d.active || d.isActive) ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)"}`,
                  }}>
                    {(d.active || d.isActive) ? "● Active" : "○ Inactive"}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  {(d.active || d.isActive) && (
                    <button className="tc-btn-danger-sm" onClick={() => handleDeactivate(d.id, d.name)}>
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono',monospace" }}>
        {filtered.length} department{filtered.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
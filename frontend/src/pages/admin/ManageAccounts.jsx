import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

const TC_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');

  @keyframes tcFadeUp  { from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);} }
  @keyframes tcSlideIn { from{opacity:0;transform:translateY(-8px) scale(0.98);}to{opacity:1;transform:translateY(0) scale(1);} }
  @keyframes tcBlink   { 0%,100%{opacity:1;}50%{opacity:0;} }
  @keyframes tcSpin    { to{transform:rotate(360deg);} }

  .tc-ac * { box-sizing:border-box; }
  .tc-ac { animation:tcFadeUp 0.45s ease both; }

  .tc-ac-input {
    padding:10px 13px; width:100%;
    background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.08);
    border-radius:10px; font-size:13px; color:#fff; outline:none;
    font-family:'DM Sans',sans-serif;
    transition:border-color 0.2s,background 0.2s,box-shadow 0.2s;
  }
  .tc-ac-input::placeholder { color:rgba(255,255,255,0.18); }
  .tc-ac-input:focus { border-color:rgba(34,197,94,0.45); background:rgba(34,197,94,0.04); box-shadow:0 0 0 3px rgba(34,197,94,0.07); }
  .tc-ac-input option { background:#0d1626; color:#fff; }

  .tc-ac-label { display:block; font-size:10px; font-weight:700; color:rgba(255,255,255,0.3); margin-bottom:5px; letter-spacing:0.12em; text-transform:uppercase; font-family:'DM Mono',monospace; }

  .tc-ac-btn-primary {
    display:inline-flex; align-items:center; gap:7px;
    padding:10px 20px; border:none; border-radius:10px;
    background:linear-gradient(135deg,#22C55E,#16A34A);
    color:#fff; font-size:13px; font-weight:700;
    cursor:pointer; font-family:'DM Sans',sans-serif;
    transition:all 0.2s; box-shadow:0 4px 16px rgba(34,197,94,0.28); white-space:nowrap;
  }
  .tc-ac-btn-primary:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(34,197,94,0.42); }
  .tc-ac-btn-primary:disabled { opacity:0.45; cursor:not-allowed; }

  .tc-ac-btn-ghost {
    display:inline-flex; align-items:center; gap:7px;
    padding:9px 18px; border-radius:10px;
    border:1.5px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03);
    color:rgba(255,255,255,0.55); font-size:13px; font-weight:600;
    cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s;
  }
  .tc-ac-btn-ghost:hover { background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.85); border-color:rgba(255,255,255,0.2); }

  .tc-ac-btn-edit {
    display:inline-flex; align-items:center; gap:5px;
    padding:6px 13px; border-radius:8px; font-size:11px; font-weight:700;
    border:1px solid rgba(34,197,94,0.25); background:rgba(34,197,94,0.08);
    color:#86efac; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s;
  }
  .tc-ac-btn-edit:hover { background:rgba(34,197,94,0.18); border-color:rgba(34,197,94,0.4); }

  .tc-ac-table-wrap {
    background:rgba(15,23,42,0.6); backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,0.07); border-radius:18px; overflow:hidden;
    box-shadow:0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.03) inset;
  }
  .tc-ac-table { width:100%; border-collapse:collapse; }
  .tc-ac-table thead tr { background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.07); }
  .tc-ac-table th { padding:13px 20px; text-align:left; font-size:10px; font-weight:700; color:rgba(255,255,255,0.28); letter-spacing:0.12em; text-transform:uppercase; font-family:'DM Mono',monospace; }
  .tc-ac-table td { padding:14px 20px; font-size:13px; color:rgba(255,255,255,0.7); border-bottom:1px solid rgba(255,255,255,0.04); font-family:'DM Sans',sans-serif; transition:background 0.15s; }
  .tc-ac-table tbody tr:last-child td { border-bottom:none; }
  .tc-ac-table tbody tr:hover td { background:rgba(34,197,94,0.03); }

  .tc-ac-alert-ok  { padding:11px 16px; border-radius:10px; background:rgba(34,197,94,0.09);  border:1px solid rgba(34,197,94,0.2);  color:#86efac; font-size:13px; margin-bottom:16px; font-family:'DM Sans',sans-serif; animation:tcSlideIn 0.25s ease both; }
  .tc-ac-alert-err { padding:11px 16px; border-radius:10px; background:rgba(220,38,38,0.09);  border:1px solid rgba(220,38,38,0.2);  color:#fca5a5; font-size:13px; margin-bottom:16px; font-family:'DM Sans',sans-serif; animation:tcSlideIn 0.25s ease both; }

  .tc-ac-search-wrap { position:relative; }
  .tc-ac-search-wrap .tc-ac-input { padding-left:36px; }
  .tc-ac-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:13px; color:rgba(255,255,255,0.22); pointer-events:none; }

  .tc-ac-tab {
    flex:1; padding:9px 16px; border-radius:9px; border:none; cursor:pointer;
    background:transparent; color:rgba(255,255,255,0.4);
    font-size:13px; font-weight:600; font-family:'DM Sans',sans-serif;
    transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:7px;
  }
  .tc-ac-tab.active { background:rgba(34,197,94,0.15); color:#86efac; box-shadow:inset 0 0 0 1px rgba(34,197,94,0.2); }
  .tc-ac-tab:hover:not(.active) { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.7); }
`;

const ROLE_TABS = [
  { key: "DEAN",         label: "Deans",          icon: "🎓", color: "#F59E0B" },
  { key: "PROGRAM_HEAD", label: "Program Heads",  icon: "📋", color: "#EC4899" },
  { key: "TEACHER",      label: "Teachers",       icon: "👨‍🏫", color: "#3B82F6" },
  { key: "STUDENT",      label: "Students",       icon: "📚", color: "#8B5CF6" },
];

const ROLE_COLOR = {
  DEAN:         { bg:"rgba(245,158,11,0.1)",  color:"#fde68a", border:"rgba(245,158,11,0.25)"  },
  PROGRAM_HEAD: { bg:"rgba(236,72,153,0.1)",  color:"#f9a8d4", border:"rgba(236,72,153,0.25)"  },
  TEACHER:      { bg:"rgba(59,130,246,0.1)",  color:"#93c5fd", border:"rgba(59,130,246,0.25)"  },
  STUDENT:      { bg:"rgba(139,92,246,0.1)",  color:"#c4b5fd", border:"rgba(139,92,246,0.25)"  },
};

function RoleBadge({ role }) {
  const m = ROLE_COLOR[role] ?? { bg:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.4)", border:"rgba(255,255,255,0.1)" };
  const label = role?.replace("_", " ") ?? "—";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 11px", background:m.bg, color:m.color, border:`1px solid ${m.border}`, borderRadius:7, fontSize:11, fontWeight:700, fontFamily:"'DM Mono',monospace", letterSpacing:"0.06em" }}>
      {label}
    </span>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ user, departments, courses, onClose, onSaved }) {
  const [form, setForm] = useState({
    fullName:     user.fullName     ?? "",
    email:        user.email        ?? "",
    departmentId: user.departmentId ?? user.department?.id ?? "",
    courseId:     user.courseId     ?? user.course?.id     ?? "",
    password:     "",
    confirmPassword: "",
  });
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState(null);

  const filteredCourses = courses.filter(c =>
    !form.departmentId || String(c.departmentId) === String(form.departmentId)
  );

  const handleSubmit = async () => {
    if (form.password && form.password !== form.confirmPassword) {
      setMsg({ ok: false, text: "Passwords do not match." });
      return;
    }
    setSaving(true); setMsg(null);
    try {
      const payload = {
        fullName:     form.fullName     || undefined,
        email:        form.email        || undefined,
        departmentId: form.departmentId || undefined,
        courseId:     form.courseId     || undefined,
      };
      if (form.password) payload.password = form.password;

      await api.put(`/users/${user.id}`, payload);
      setMsg({ ok: true, text: "Account updated successfully." });
      setTimeout(() => { onSaved(); onClose(); }, 700);
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.message ?? "Update failed." });
    } finally { setSaving(false); }
  };

  const showDept   = ["DEAN","PROGRAM_HEAD","TEACHER"].includes(user.role);
  const showCourse = ["PROGRAM_HEAD","STUDENT"].includes(user.role);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{
        background:"rgba(10,18,32,0.98)", border:"1px solid rgba(255,255,255,0.1)",
        borderRadius:20, padding:"28px 30px", width:500, maxWidth:"95vw",
        boxShadow:"0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
        animation:"tcSlideIn 0.25s ease both", fontFamily:"'DM Sans',sans-serif",
        maxHeight:"90vh", overflowY:"auto",
      }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:22 }}>
          <div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, marginBottom:8 }}>
              <RoleBadge role={user.role} />
            </div>
            <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:17, fontWeight:800, color:"#fff", margin:"0 0 3px", letterSpacing:"-0.02em" }}>Edit Account</h3>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.35)", margin:0 }}>ID #{user.id} · {user.email}</p>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"rgba(255,255,255,0.5)", fontSize:14 }}>✕</button>
        </div>

        {msg && <div className={msg.ok ? "tc-ac-alert-ok" : "tc-ac-alert-err"}>{msg.text}</div>}

        {/* Full Name */}
        <div style={{ marginBottom:14 }}>
          <label className="tc-ac-label">Full Name</label>
          <input className="tc-ac-input" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="Full name" />
        </div>

        {/* Email */}
        <div style={{ marginBottom:14 }}>
          <label className="tc-ac-label">Email</label>
          <input className="tc-ac-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Email address" />
        </div>

        {/* Department */}
        {showDept && (
          <div style={{ marginBottom:14 }}>
            <label className="tc-ac-label">Department</label>
            <select className="tc-ac-input" value={form.departmentId} onChange={e => setForm(p => ({ ...p, departmentId: e.target.value, courseId: "" }))}>
              <option value="">— No department —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        )}

        {/* Course */}
        {showCourse && (
          <div style={{ marginBottom:14 }}>
            <label className="tc-ac-label">Course</label>
            <select className="tc-ac-input" value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}>
              <option value="">— No course —</option>
              {filteredCourses.map(c => <option key={c.id} value={c.id}>{c.name ?? c.code}</option>)}
            </select>
          </div>
        )}

        {/* Divider */}
        <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"18px 0" }} />
        <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginBottom:14, fontFamily:"'DM Mono',monospace", letterSpacing:"0.08em" }}>CHANGE PASSWORD — LEAVE BLANK TO KEEP CURRENT</p>

        {/* Password */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
          <div>
            <label className="tc-ac-label">New Password</label>
            <input className="tc-ac-input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
          </div>
          <div>
            <label className="tc-ac-label">Confirm Password</label>
            <input className="tc-ac-input" type="password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="••••••••" />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:22 }}>
          <button onClick={onClose} className="tc-ac-btn-ghost">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="tc-ac-btn-primary">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ManageAccounts() {
  const [activeRole,   setActiveRole]   = useState("DEAN");
  const [users,        setUsers]        = useState([]);
  const [departments,  setDepartments]  = useState([]);
  const [courses,      setCourses]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState("");
  const [editing,      setEditing]      = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get("/users", { params: { role: activeRole } });
      setUsers(res.data?.data ?? res.data ?? []);
    } catch (e) {
      setError(e?.response?.data?.message ?? "Failed to load accounts.");
    } finally { setLoading(false); }
  }, [activeRole]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  useEffect(() => {
    api.get("/departments").then(r => setDepartments(r.data?.data ?? r.data ?? [])).catch(() => {});
    api.get("/courses").then(r => setCourses(r.data?.data ?? r.data ?? [])).catch(() => {});
  }, []);

  const filtered = users.filter(u =>
    (u.fullName ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email    ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const showDept   = ["DEAN","TEACHER"].includes(activeRole);
  const showCourse = ["PROGRAM_HEAD","STUDENT"].includes(activeRole);

  return (
    <div className="tc-ac" style={{ color:"#fff", fontFamily:"'DM Sans',sans-serif", background:"#060d1a", minHeight:"100vh", padding:"32px" }}>
      <style>{TC_STYLES}</style>

      {/* ── Page header ─────────────────────────────────────────── */}
      <div style={{ marginBottom:30 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.22)", borderRadius:100, padding:"5px 14px", marginBottom:14 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"#22C55E", display:"inline-block", animation:"tcBlink 2s ease infinite" }} />
          <span style={{ fontSize:10, fontWeight:700, color:"#4ADE80", letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"'DM Mono',monospace" }}>Admin · User Management</span>
        </div>
        <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:28, fontWeight:800, color:"#fff", letterSpacing:"-0.03em", margin:"0 0 6px" }}>Accounts</h1>
        <p style={{ fontSize:14, color:"rgba(255,255,255,0.38)", margin:0 }}>Manage user accounts, departments, courses, and passwords.</p>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:14, marginBottom:28, flexWrap:"wrap" }}>
        {ROLE_TABS.map(t => (
          <div key={t.key} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"12px 20px", display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:18 }}>{t.icon}</span>
            <div>
              <div style={{ fontFamily:"'Sora',sans-serif", fontSize:11, fontWeight:700, color:t.color, letterSpacing:"0.06em", textTransform:"uppercase", fontFamily:"'DM Mono',monospace" }}>{t.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Role Tabs ────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:4, marginBottom:22, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:4 }}>
        {ROLE_TABS.map(t => (
          <button key={t.key} className={`tc-ac-tab${activeRole === t.key ? " active" : ""}`} onClick={() => { setActiveRole(t.key); setSearch(""); }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        <div className="tc-ac-search-wrap" style={{ width:280 }}>
          <span className="tc-ac-search-icon">🔍</span>
          <input className="tc-ac-input" placeholder={`Search ${activeRole.replace("_"," ").toLowerCase()}s…`} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="tc-ac-btn-ghost" onClick={loadUsers} disabled={loading} style={{ marginLeft:"auto" }}>
          {loading ? "Loading…" : "⟳  Refresh"}
        </button>
      </div>

      {error && <div className="tc-ac-alert-err">{error}</div>}

      {/* ── Table ────────────────────────────────────────────────── */}
      <div className="tc-ac-table-wrap">
        {/* Chrome bar */}
        <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ display:"flex", gap:5 }}>
              {["#FF5F57","#FFBD2E","#28C840"].map((c, i) => (
                <div key={i} style={{ width:9, height:9, borderRadius:"50%", background:c }} />
              ))}
            </div>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.2)", fontFamily:"'DM Mono',monospace", letterSpacing:"0.08em", marginLeft:6 }}>
              {activeRole.replace("_"," ")}S — {filtered.length} RECORDS
            </span>
          </div>
          {loading && <div style={{ width:13, height:13, border:"2px solid rgba(34,197,94,0.15)", borderTopColor:"#22C55E", borderRadius:"50%", animation:"tcSpin 0.7s linear infinite" }} />}
        </div>

        <table className="tc-ac-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              {showDept   && <th>Department</th>}
              {showCourse && <th>Course</th>}
              <th style={{ textAlign:"right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign:"center", padding:48 }}>
                  <div style={{ display:"inline-block", width:20, height:20, border:"2px solid rgba(34,197,94,0.2)", borderTopColor:"#22C55E", borderRadius:"50%", animation:"tcSpin 0.7s linear infinite" }} />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign:"center", padding:56, color:"rgba(255,255,255,0.18)", fontFamily:"'DM Mono',monospace", fontSize:12, letterSpacing:"0.06em" }}>
                  NO {activeRole.replace("_"," ")}S FOUND
                </td>
              </tr>
            ) : filtered.map((u, i) => (
              <tr key={u.id}>
                <td style={{ color:"rgba(255,255,255,0.2)", fontFamily:"'DM Mono',monospace", fontSize:11 }}>
                  {String(i + 1).padStart(2, "0")}
                </td>
                <td>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{
                      width:30, height:30, borderRadius:"50%",
                      background: ROLE_COLOR[u.role]?.bg ?? "rgba(255,255,255,0.06)",
                      border: `1.5px solid ${ROLE_COLOR[u.role]?.border ?? "rgba(255,255,255,0.1)"}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:10, fontWeight:800,
                      color: ROLE_COLOR[u.role]?.color ?? "rgba(255,255,255,0.5)",
                      fontFamily:"'DM Mono',monospace", flexShrink:0,
                    }}>
                      {(u.fullName || "U").split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase()}
                    </div>
                    <span style={{ fontWeight:600, color:"#fff" }}>{u.fullName ?? "—"}</span>
                  </div>
                </td>
                <td style={{ color:"rgba(255,255,255,0.5)", fontFamily:"'DM Mono',monospace", fontSize:12 }}>{u.email ?? "—"}</td>
                <td><RoleBadge role={u.role} /></td>
                {showDept   && <td style={{ color:"rgba(255,255,255,0.55)" }}>{u.department?.name ?? u.departmentName ?? "—"}</td>}
                {showCourse && <td style={{ color:"rgba(255,255,255,0.55)" }}>{u.course?.name ?? u.course?.code ?? u.courseName ?? "—"}</td>}
                <td style={{ textAlign:"right" }}>
                  <button className="tc-ac-btn-edit" onClick={() => setEditing(u)}>
                    ✎ Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop:12, fontSize:11, color:"rgba(255,255,255,0.2)", fontFamily:"'DM Mono',monospace", letterSpacing:"0.06em" }}>
        {filtered.length} ACCOUNT{filtered.length !== 1 ? "S" : ""}
        {search && ` · FILTERED FROM ${users.length}`}
      </div>

      {/* ── Edit Modal ───────────────────────────────────────────── */}
      {editing && (
        <EditModal
          user={editing}
          departments={departments}
          courses={courses}
          onClose={() => setEditing(null)}
          onSaved={loadUsers}
        />
      )}
    </div>
  );
}
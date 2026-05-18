import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import useConflict from "../../hooks/useConflict";

const SEMESTER_OPTIONS = [
  { value: "FIRST",  label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "SUMMER", label: "Summer" },
];
const SCHOOL_YEARS = ["2024-2025", "2025-2026", "2026-2027"];
const TABS = [
  { label: "Conflicts",        icon: "⚠️" },
  { label: "Teaching Load",    icon: "👨‍🏫" },
  { label: "Room Utilisation", icon: "🏫" },
];

const TC_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');

  @keyframes tcFadeUp  { from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);} }
  @keyframes tcSlideIn { from{opacity:0;transform:translateY(-8px) scale(0.98);}to{opacity:1;transform:translateY(0) scale(1);} }
  @keyframes tcBlink   { 0%,100%{opacity:1;} 50%{opacity:0;} }
  @keyframes tcSpin    { to{transform:rotate(360deg);} }

  .tc-rp * { box-sizing:border-box; }
  .tc-rp { animation:tcFadeUp 0.45s ease both; }

  .tc-rp-input {
    padding:9px 13px; width:100%;
    background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.08);
    border-radius:9px; font-size:13px; color:#fff; outline:none;
    font-family:'DM Sans',sans-serif; transition:border-color 0.2s,box-shadow 0.2s;
  }
  .tc-rp-input::placeholder{color:rgba(255,255,255,0.18);}
  .tc-rp-input:focus{border-color:rgba(34,197,94,0.45);box-shadow:0 0 0 3px rgba(34,197,94,0.07);}
  .tc-rp-input option{background:#0d1626;color:#fff;}

  .tc-rp-btn-primary {
    display:inline-flex;align-items:center;gap:6px;
    padding:9px 20px;border:none;border-radius:9px;
    background:linear-gradient(135deg,#22C55E,#16A34A);
    color:#fff;font-size:13px;font-weight:700;
    cursor:pointer;font-family:'DM Sans',sans-serif;
    transition:all 0.2s;box-shadow:0 4px 16px rgba(34,197,94,0.28);white-space:nowrap;
  }
  .tc-rp-btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px rgba(34,197,94,0.42);}
  .tc-rp-btn-primary:disabled{opacity:.45;cursor:not-allowed;}
  .tc-rp-btn-primary:active{transform:scale(0.97);}

  .tc-rp-btn-secondary {
    display:inline-flex;align-items:center;gap:6px;
    padding:9px 18px;border-radius:9px;
    border:1.5px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03);
    color:rgba(255,255,255,0.55);font-size:13px;font-weight:600;
    cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;white-space:nowrap;
  }
  .tc-rp-btn-secondary:hover:not(:disabled){background:rgba(255,255,255,0.07);color:#fff;border-color:rgba(255,255,255,0.2);}
  .tc-rp-btn-secondary:disabled{opacity:.45;cursor:not-allowed;}

  .tc-rp-table-wrap {
    background:rgba(15,23,42,0.55);backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;
    box-shadow:0 16px 48px rgba(0,0,0,0.3),0 0 0 1px rgba(255,255,255,0.03) inset;
  }

  /* Scrollable table container */
  .tc-rp-table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .tc-rp-table { width:100%;border-collapse:collapse;min-width:500px; }
  .tc-rp-table thead tr { background:rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.06); }
  .tc-rp-table th { padding:12px 16px;text-align:left;font-size:10px;font-weight:700;color:rgba(255,255,255,0.28);letter-spacing:0.12em;text-transform:uppercase;font-family:'DM Mono',monospace;white-space:nowrap; }
  .tc-rp-table td { padding:12px 16px;font-size:13px;color:rgba(255,255,255,0.72);border-bottom:1px solid rgba(255,255,255,0.04);font-family:'DM Sans',sans-serif; }
  .tc-rp-table tbody tr:last-child td { border-bottom:none; }
  .tc-rp-table tbody tr:hover td { background:rgba(34,197,94,0.03); }

  .tc-rp-banner-ok  { padding:11px 16px;border-radius:10px;background:rgba(34,197,94,0.09);border:1px solid rgba(34,197,94,0.2);color:#86efac;font-size:13px;margin-bottom:16px;font-family:'DM Sans',sans-serif;animation:tcSlideIn 0.25s ease both; }
  .tc-rp-banner-err { padding:11px 16px;border-radius:10px;background:rgba(220,38,38,0.09);border:1px solid rgba(220,38,38,0.2);color:#fca5a5;font-size:13px;margin-bottom:16px;font-family:'DM Sans',sans-serif;animation:tcSlideIn 0.25s ease both; }

  .tc-rp-resolve-btn {
    padding:5px 12px;background:rgba(34,197,94,0.09);border:1px solid rgba(34,197,94,0.2);
    color:#86efac;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;
    font-family:'DM Sans',sans-serif;transition:all 0.15s;white-space:nowrap;
  }
  .tc-rp-resolve-btn:hover{background:rgba(34,197,94,0.18);}

  .tc-rp-dismiss-btn {
    padding:5px 12px;background:transparent;border:1px solid rgba(255,255,255,0.09);
    color:rgba(255,255,255,0.4);border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;
    font-family:'DM Sans',sans-serif;transition:all 0.15s;white-space:nowrap;
  }
  .tc-rp-dismiss-btn:hover{border-color:rgba(255,255,255,0.2);color:rgba(255,255,255,0.7);}

  /* Mobile card view for conflicts */
  .tc-conflict-card {
    background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);
    border-radius:12px;padding:14px 16px;margin-bottom:10px;
  }

  /* ── Responsive ── */
  @media (max-width:640px) {
    .tc-rp-page { padding:16px !important; }
    .tc-rp-page-title { font-size:22px !important; }
    .tc-term-filter { flex-direction:column !important; gap:8px !important; }
    .tc-term-filter select { width:100% !important; }
    .tc-tab-label { display:none !important; }
    .tc-tab-icon  { font-size:18px !important; }
    .tc-summary-grid { grid-template-columns:1fr 1fr !important; }
    .tc-btn-row { flex-direction:column !important; }
    .tc-btn-row button { width:100% !important; justify-content:center; }
    .tc-room-filter { flex-direction:column !important; }
    .tc-room-filter select, .tc-room-filter button { width:100% !important; }
    /* Hide table on mobile, show cards */
    .tc-table-mobile-hide { display:none !important; }
    .tc-mobile-cards { display:block !important; }
  }
  @media (min-width:641px) {
    .tc-mobile-cards { display:none !important; }
  }
  @media (max-width:900px) {
    .tc-modal-inner { width:95vw !important; padding:20px 18px !important; }
    .tc-modal-fields { grid-template-columns:1fr !important; }
  }
`;

const CONFLICT_META = {
  TEACHER_OVERLAP : { bg:"rgba(239,68,68,0.1)",  color:"#fca5a5", border:"rgba(239,68,68,0.25)",  icon:"👨‍🏫" },
  ROOM_OVERLAP    : { bg:"rgba(245,158,11,0.1)",  color:"#fde68a", border:"rgba(245,158,11,0.25)", icon:"🏫" },
  STUDENT_OVERLAP : { bg:"rgba(99,102,241,0.1)",  color:"#c7d2fe", border:"rgba(99,102,241,0.25)", icon:"📚" },
};

function ConflictBadge({ type }) {
  const m = CONFLICT_META[type] ?? { bg:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.4)", border:"rgba(255,255,255,0.1)", icon:"⚠️" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", background:m.bg, color:m.color, border:`1px solid ${m.border}`, borderRadius:7, fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>
      {m.icon} {type?.replace("_"," ") ?? "—"}
    </span>
  );
}

function UtilBar({ pct }) {
  const num   = typeof pct === "number" ? Math.min(100, Math.round(pct)) : 0;
  const color = num > 80 ? "#ef4444" : num > 50 ? "#f59e0b" : "#22C55E";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ flex:1, height:5, background:"rgba(255,255,255,0.07)", borderRadius:3, overflow:"hidden", minWidth:60 }}>
        <div style={{ width:`${num}%`, height:"100%", background:color, borderRadius:3, transition:"width 0.8s ease" }} />
      </div>
      <span style={{ fontSize:12, color:"rgba(255,255,255,0.55)", fontWeight:700, fontFamily:"'DM Mono',monospace", minWidth:36 }}>{num}%</span>
    </div>
  );
}

function SummaryCard({ label, value, color, icon }) {
  return (
    <div style={{
      background:"rgba(255,255,255,0.03)", border:`1px solid rgba(255,255,255,0.07)`,
      borderTop:`2px solid ${color}`, borderRadius:14,
      padding:"16px 18px", fontFamily:"'DM Sans',sans-serif",
      display:"flex", alignItems:"center", gap:12,
    }}>
      <div style={{ width:38, height:38, borderRadius:10, background:`${color}18`, border:`1px solid ${color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontFamily:"'Sora',sans-serif", fontSize:24, fontWeight:800, color, lineHeight:1, letterSpacing:"-0.03em" }}>{value ?? "—"}</div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:3, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'DM Mono',monospace" }}>{label}</div>
      </div>
    </div>
  );
}

function TableChrome({ title, count, loading, children }) {
  return (
    <div className="tc-rp-table-wrap">
      <div style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
          <div style={{ display:"flex", gap:5, flexShrink:0 }}>
            {["#FF5F57","#FFBD2E","#28C840"].map((c, i) => (
              <div key={i} style={{ width:9, height:9, borderRadius:"50%", background:c }} />
            ))}
          </div>
          <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)", fontFamily:"'DM Mono',monospace", letterSpacing:"0.08em", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {title}{count !== undefined ? ` — ${count} RECORDS` : ""}
          </span>
        </div>
        {loading && <div style={{ width:13, height:13, border:"2px solid rgba(34,197,94,0.15)", borderTopColor:"#22C55E", borderRadius:"50%", animation:"tcSpin 0.7s linear infinite", flexShrink:0 }} />}
      </div>
      {children}
    </div>
  );
}

function ResolveModal({ resolving, resolveForm, setResolveForm, resolveMsg, resolveLoading, onSubmit, onClose, teachers, rooms, timeslots }) {
  if (!resolving) return null;
  const fields = [
    { label:"New Teacher",    key:"teacherId",   opts:teachers,  labelFn: t  => t.fullName },
    { label:"New Room",       key:"roomId",      opts:rooms,     labelFn: r  => `${r.name ?? r.roomNumber} (${r.roomType})` },
    { label:"New Timeslot 1", key:"timeslotId",  opts:timeslots, labelFn: ts => ts.label },
    { label:"New Timeslot 2", key:"timeslot2Id", opts:timeslots, labelFn: ts => ts.label },
  ];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}>
      <div className="tc-modal-inner" style={{
        background:"rgba(13,22,38,0.98)", border:"1px solid rgba(255,255,255,0.1)",
        borderRadius:20, padding:"24px 24px", width:460, maxWidth:"100%",
        boxShadow:"0 32px 80px rgba(0,0,0,0.55)",
        animation:"tcSlideIn 0.25s ease both", fontFamily:"'DM Sans',sans-serif",
        maxHeight:"90vh", overflowY:"auto",
      }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:18, gap:12 }}>
          <div style={{ minWidth:0 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:6, padding:"3px 10px", marginBottom:8 }}>
              <span style={{ fontSize:10, color:"#fca5a5", fontWeight:700, letterSpacing:"0.08em", fontFamily:"'DM Mono',monospace" }}>SCHEDULE #{resolving.schedule?.id}</span>
            </div>
            <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:17, fontWeight:800, color:"#fff", margin:"0 0 4px" }}>Resolve Conflict</h3>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.35)", margin:0, lineHeight:1.5 }}>{resolving.conflictType} · {resolving.description}</p>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"rgba(255,255,255,0.5)", fontSize:14, flexShrink:0 }}>✕</button>
        </div>

        <p style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginBottom:16, fontFamily:"'DM Mono',monospace", letterSpacing:"0.06em" }}>LEAVE BLANK TO KEEP CURRENT VALUE</p>

        <div className="tc-modal-fields" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={{ display:"block", fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.3)", marginBottom:5, letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"'DM Mono',monospace" }}>{f.label}</label>
              <select
                className="tc-rp-input"
                value={resolveForm[f.key]}
                onChange={e => setResolveForm(p => ({ ...p, [f.key]: e.target.value }))}
              >
                <option value="">— Keep current —</option>
                {f.opts.map(o => <option key={o.id} value={o.id}>{f.labelFn(o)}</option>)}
              </select>
            </div>
          ))}
        </div>

        {resolveMsg && (
          <div className={resolveMsg.startsWith("✓") ? "tc-rp-banner-ok" : "tc-rp-banner-err"} style={{ marginTop:14 }}>
            {resolveMsg}
          </div>
        )}

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:18, flexWrap:"wrap" }}>
          <button onClick={onClose} className="tc-rp-btn-secondary">Cancel</button>
          <button onClick={onSubmit} disabled={resolveLoading} className="tc-rp-btn-primary">
            {resolveLoading ? "Saving…" : "Save & Resolve"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mobile card for a single conflict ──
function ConflictCard({ c, onReassign, onDismiss, actionLoading }) {
  return (
    <div className="tc-conflict-card">
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, marginBottom:8 }}>
        <ConflictBadge type={c.conflictType} />
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.35)" }}>#{c.schedule?.id ?? "—"}</span>
      </div>
      <p style={{ fontSize:12, color:"rgba(255,255,255,0.55)", margin:"0 0 12px", lineHeight:1.5 }}>{c.description ?? "—"}</p>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        <button className="tc-rp-resolve-btn" onClick={() => onReassign(c)}>Reassign</button>
        {c.schedule?.id && (
          <button className="tc-rp-dismiss-btn" onClick={() => onDismiss(c.schedule.id)} disabled={actionLoading}>Dismiss All</button>
        )}
      </div>
    </div>
  );
}

export default function Reports() {
  const navigate = useNavigate();
  const { conflicts, loading: conflictLoading, error: conflictError,
          unresolvedCount, fetchConflicts, resolveOne,
          resolveAllForSchedule, auditTerm, actionLoading, actionError } = useConflict();

  const [activeTab,  setActiveTab]  = useState(0);
  const [semester,   setSemester]   = useState("FIRST");
  const [schoolYear, setSchoolYear] = useState("2024-2025");

  const [loadReport,  setLoadReport]  = useState([]);
  const [loadLoading, setLoadLoading] = useState(false);
  const [loadError,   setLoadError]   = useState("");

  const [campuses,       setCampuses]       = useState([]);
  const [selectedCampus, setSelectedCampus] = useState("");
  const [roomReport,     setRoomReport]     = useState([]);
  const [roomLoading,    setRoomLoading]    = useState(false);
  const [roomError,      setRoomError]      = useState("");

  const [conflictSummary, setConflictSummary] = useState(null);
  const [auditResult,     setAuditResult]     = useState(null);
  const [summaryLoading,  setSummaryLoading]  = useState(false);

  const [resolving,      setResolving]      = useState(null);
  const [resolveForm,    setResolveForm]    = useState({ teacherId:"", roomId:"", timeslotId:"", timeslot2Id:"" });
  const [resolveMsg,     setResolveMsg]     = useState("");
  const [resolveLoading, setResolveLoading] = useState(false);
  const [teachers,       setTeachers]       = useState([]);
  const [rooms,          setRooms]          = useState([]);
  const [timeslots,      setTimeslots]      = useState([]);

  const openResolveModal = async (conflict) => {
    setResolving(conflict);
    setResolveForm({ teacherId:"", roomId:"", timeslotId:"", timeslot2Id:"" });
    setResolveMsg("");
    try {
      const [t, r, ts] = await Promise.all([api.get("/teachers"), api.get("/rooms"), api.get("/timeslots")]);
      setTeachers(t.data?.data ?? t.data ?? []);
      setRooms(r.data?.data ?? r.data ?? []);
      setTimeslots(ts.data?.data ?? ts.data ?? []);
    } catch {}
  };

  const submitResolve = async () => {
    if (!resolving?.schedule?.id) return;
    setResolveLoading(true); setResolveMsg("");
    try {
      await api.put(`/schedules/${resolving.schedule.id}/resolve`, {
        teacherId:   resolveForm.teacherId   || null,
        roomId:      resolveForm.roomId      || null,
        timeslotId:  resolveForm.timeslotId  || null,
        timeslot2Id: resolveForm.timeslot2Id || null,
      });
      await resolveOne(resolving.id);
      setResolveMsg("✓ Resolved successfully");
      setTimeout(() => { setResolving(null); handleFetchConflicts(); }, 800);
    } catch (e) {
      setResolveMsg("✗ " + (e.response?.data?.message ?? "Failed"));
    } finally { setResolveLoading(false); }
  };

  const ensureCampuses = useCallback(async () => {
    if (campuses.length > 0) return;
    try {
      const res = await api.get("/rooms/campuses");
      const data = res.data?.data ?? res.data;
      setCampuses(Array.isArray(data) ? data : []);
    } catch {}
  }, [campuses]);

  const handleTabChange = (idx) => {
    setActiveTab(idx);
    if (idx === 2) ensureCampuses();
  };

  const handleFetchConflicts = async () => {
    await fetchConflicts({ semester, schoolYear });
    fetchConflictSummary();
  };

  const fetchConflictSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await api.get("/reports/conflicts", { params: { semester, schoolYear } });
      setConflictSummary(res.data?.data ?? res.data);
    } catch { setConflictSummary(null); }
    finally { setSummaryLoading(false); }
  };

  const handleAudit = async () => {
    const res = await auditTerm(semester, schoolYear);
    if (res.success) { setAuditResult(res.data); handleFetchConflicts(); }
  };

  const handleFetchLoad = async () => {
    setLoadLoading(true); setLoadError("");
    try {
      const res = await api.get("/reports/teaching-load", { params: { semester, schoolYear } });
      const data = res.data?.data ?? res.data;
      setLoadReport(Array.isArray(data) ? data : []);
    } catch { setLoadError("Failed to load teaching load report."); }
    finally { setLoadLoading(false); }
  };

  const handleFetchRooms = async () => {
    if (!selectedCampus) return;
    setRoomLoading(true); setRoomError("");
    try {
      const res = await api.get("/reports/room-utilisation", { params: { campusId: selectedCampus, semester, schoolYear } });
      const data = res.data?.data ?? res.data;
      setRoomReport(Array.isArray(data) ? data : []);
    } catch { setRoomError("Failed to load room utilisation report."); }
    finally { setRoomLoading(false); }
  };

  return (
    <div className="tc-rp tc-rp-page" style={{ color:"#fff", fontFamily:"'DM Sans',sans-serif", background:"#070f1e", minHeight:"100vh", padding:"24px 24px" }}>
      <style>{TC_STYLES}</style>

      {/* Page header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.22)", borderRadius:100, padding:"5px 14px", marginBottom:12 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"#22C55E", display:"inline-block", animation:"tcBlink 2s ease infinite" }} />
          <span style={{ fontSize:10, fontWeight:700, color:"#4ADE80", letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"'DM Mono',monospace" }}>Admin · Analytics</span>
        </div>
        <h1 className="tc-rp-page-title" style={{ fontFamily:"'Sora',sans-serif", fontSize:26, fontWeight:800, color:"#fff", letterSpacing:"-0.03em", margin:"0 0 5px" }}>Reports</h1>
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.38)", margin:0 }}>View and manage scheduling conflicts, teaching load, and room utilisation.</p>
      </div>

      {/* Term selector */}
      <div className="tc-term-filter" style={{
        display:"flex", alignItems:"center", gap:10, marginBottom:22,
        padding:"12px 16px",
        background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
        borderRadius:14, flexWrap:"wrap",
      }}>
        <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:"'DM Mono',monospace", letterSpacing:"0.1em", textTransform:"uppercase", whiteSpace:"nowrap" }}>Term</span>
        <div style={{ width:1, height:18, background:"rgba(255,255,255,0.08)", flexShrink:0 }} />
        <select className="tc-rp-input" style={{ width:160, flex:"1 1 140px", minWidth:0 }} value={semester} onChange={e => setSemester(e.target.value)}>
          {SEMESTER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="tc-rp-input" style={{ width:140, flex:"1 1 120px", minWidth:0 }} value={schoolYear} onChange={e => setSchoolYear(e.target.value)}>
          {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:22, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:4 }}>
        {TABS.map((t, i) => (
          <button key={t.label} onClick={() => handleTabChange(i)} style={{
            flex:1, padding:"9px 10px", borderRadius:9, border:"none", cursor:"pointer",
            background:activeTab === i ? "rgba(34,197,94,0.15)" : "transparent",
            color:activeTab === i ? "#86efac" : "rgba(255,255,255,0.4)",
            fontSize:13, fontWeight:activeTab === i ? 700 : 600,
            fontFamily:"'DM Sans',sans-serif",
            transition:"all 0.2s",
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            boxShadow:activeTab === i ? "inset 0 0 0 1px rgba(34,197,94,0.2)" : "none",
          }}>
            <span className="tc-tab-icon">{t.icon}</span>
            <span className="tc-tab-label">{t.label}</span>
            {i === 0 && unresolvedCount > 0 && (
              <span style={{ background:"#ef4444", color:"#fff", borderRadius:99, padding:"1px 6px", fontSize:10, fontWeight:800, flexShrink:0 }}>{unresolvedCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 0: Conflicts */}
      {activeTab === 0 && (
        <div>
          <div className="tc-btn-row" style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
            <button className="tc-rp-btn-primary" onClick={handleFetchConflicts} disabled={conflictLoading}>
              {conflictLoading ? "Loading…" : "⟳  Load Conflicts"}
            </button>
            <button className="tc-rp-btn-secondary" onClick={handleAudit} disabled={actionLoading}>
              {actionLoading ? "Auditing…" : "🔍  Run Audit"}
            </button>
          </div>

          {auditResult && (
            <div className="tc-rp-banner-ok">Audit complete — {auditResult.newConflictsFound} new conflict(s) found.</div>
          )}

          {conflictSummary && (
            <div className="tc-summary-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12, marginBottom:20 }}>
              <SummaryCard label="Total Unresolved" value={conflictSummary.totalUnresolved} color="#ef4444" icon="⚠️" />
              <SummaryCard label="This Term"        value={conflictSummary.termUnresolved}  color="#f59e0b" icon="📅" />
            </div>
          )}

          {conflictError && <div className="tc-rp-banner-err">{conflictError}</div>}
          {actionError   && <div className="tc-rp-banner-err">{actionError}</div>}

          {conflicts.length === 0 && !conflictLoading ? (
            <div style={{ textAlign:"center", padding:"52px 24px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, color:"rgba(255,255,255,0.2)", fontFamily:"'DM Mono',monospace", fontSize:12, letterSpacing:"0.08em" }}>
              NO UNRESOLVED CONFLICTS FOR THIS TERM
            </div>
          ) : conflicts.length > 0 && (
            <>
              {/* Desktop table */}
              <div className="tc-table-mobile-hide">
                <TableChrome title="CONFLICTS" count={conflicts.length} loading={conflictLoading}>
                  <div className="tc-rp-table-scroll">
                    <table className="tc-rp-table">
                      <thead>
                        <tr><th>Type</th><th>Description</th><th>Schedule ID</th><th style={{ textAlign:"right" }}>Actions</th></tr>
                      </thead>
                      <tbody>
                        {conflicts.map((c) => (
                          <tr key={c.id}>
                            <td><ConflictBadge type={c.conflictType} /></td>
                            <td style={{ color:"rgba(255,255,255,0.6)", maxWidth:260 }}>{c.description ?? "—"}</td>
                            <td><span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"rgba(255,255,255,0.4)" }}>#{c.schedule?.id ?? "—"}</span></td>
                            <td>
                              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                                <button className="tc-rp-resolve-btn" onClick={() => openResolveModal(c)}>Reassign</button>
                                {c.schedule?.id && (
                                  <button className="tc-rp-dismiss-btn" onClick={() => resolveAllForSchedule(c.schedule.id)} disabled={actionLoading}>Dismiss All</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TableChrome>
              </div>

              {/* Mobile cards */}
              <div className="tc-mobile-cards">
                <div style={{ marginBottom:10, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:"'DM Mono',monospace", letterSpacing:"0.1em" }}>CONFLICTS — {conflicts.length} RECORDS</span>
                </div>
                {conflicts.map((c) => (
                  <ConflictCard key={c.id} c={c} onReassign={openResolveModal} onDismiss={resolveAllForSchedule} actionLoading={actionLoading} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 1: Teaching Load */}
      {activeTab === 1 && (
        <div>
          <div className="tc-btn-row" style={{ display:"flex", gap:10, marginBottom:18 }}>
            <button className="tc-rp-btn-primary" onClick={handleFetchLoad} disabled={loadLoading}>
              {loadLoading ? "Loading…" : "⟳  Load Report"}
            </button>
          </div>
          {loadError && <div className="tc-rp-banner-err">{loadError}</div>}

          {loadReport.length === 0 && !loadLoading ? (
            <div style={{ textAlign:"center", padding:"52px 24px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, color:"rgba(255,255,255,0.2)", fontFamily:"'DM Mono',monospace", fontSize:12, letterSpacing:"0.08em" }}>
              CLICK LOAD REPORT TO VIEW TEACHING LOAD DATA
            </div>
          ) : loadReport.length > 0 && (
            <TableChrome title="TEACHING LOAD" count={loadReport.length} loading={loadLoading}>
              <div className="tc-rp-table-scroll">
                <table className="tc-rp-table">
                  <thead>
                    <tr><th>Teacher</th><th>Department</th><th>Units</th><th>Sections</th></tr>
                  </thead>
                  <tbody>
                    {loadReport.map((row, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight:600, color:"#fff" }}>{row[0] ?? "—"}</td>
                        <td style={{ color:"rgba(255,255,255,0.55)" }}>{row[1] ?? "—"}</td>
                        <td><span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:"#86efac", fontWeight:700 }}>{row[2] ?? "—"}</span></td>
                        <td style={{ color:"rgba(255,255,255,0.5)" }}>{row[3] ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TableChrome>
          )}
        </div>
      )}

      {/* Tab 2: Room Utilisation */}
      {activeTab === 2 && (
        <div>
          <div className="tc-room-filter" style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
            <select className="tc-rp-input" style={{ width:200, flex:"1 1 160px", minWidth:0 }} value={selectedCampus} onChange={e => setSelectedCampus(e.target.value)}>
              <option value="">Select Campus…</option>
              {campuses.map(c => <option key={c.id} value={c.id}>{c.name ?? c.code}</option>)}
            </select>
            <button className="tc-rp-btn-primary" onClick={handleFetchRooms} disabled={roomLoading || !selectedCampus}>
              {roomLoading ? "Loading…" : "⟳  Load Report"}
            </button>
          </div>
          {roomError && <div className="tc-rp-banner-err">{roomError}</div>}

          {roomReport.length === 0 && !roomLoading ? (
            <div style={{ textAlign:"center", padding:"52px 24px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, color:"rgba(255,255,255,0.2)", fontFamily:"'DM Mono',monospace", fontSize:12, letterSpacing:"0.08em" }}>
              SELECT A CAMPUS AND CLICK LOAD REPORT
            </div>
          ) : roomReport.length > 0 && (
            <TableChrome title="ROOM UTILISATION" count={roomReport.length} loading={roomLoading}>
              <div className="tc-rp-table-scroll">
                <table className="tc-rp-table">
                  <thead>
                    <tr><th>Room</th><th>Type</th><th>Slots Used</th><th>Utilisation</th></tr>
                  </thead>
                  <tbody>
                    {roomReport.map((row, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight:600, color:"#fff" }}>{row[0] ?? "—"}</td>
                        <td>
                          <span style={{
                            padding:"3px 10px", borderRadius:6, fontSize:11, fontWeight:700,
                            background: row[1] === "LABORATORY" ? "rgba(34,197,94,0.1)" : "rgba(59,130,246,0.1)",
                            color:      row[1] === "LABORATORY" ? "#86efac"             : "#93c5fd",
                            border:     `1px solid ${row[1] === "LABORATORY" ? "rgba(34,197,94,0.2)" : "rgba(59,130,246,0.2)"}`,
                            whiteSpace:"nowrap",
                          }}>
                            {row[1] === "LABORATORY" ? "🔬 Lab" : "🎓 Lecture"}
                          </span>
                        </td>
                        <td><span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"rgba(255,255,255,0.5)" }}>{row[2] ?? "—"}</span></td>
                        <td style={{ minWidth:120 }}><UtilBar pct={row[3] ?? 0} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TableChrome>
          )}
        </div>
      )}

      <ResolveModal
        resolving={resolving} resolveForm={resolveForm} setResolveForm={setResolveForm}
        resolveMsg={resolveMsg} resolveLoading={resolveLoading}
        onSubmit={submitResolve} onClose={() => setResolving(null)}
        teachers={teachers} rooms={rooms} timeslots={timeslots}
      />
    </div>
  );
}
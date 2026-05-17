import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes slideUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin     { to { transform:rotate(360deg); } }
  @keyframes pulse    { 0%,100%{ opacity:.6; } 50%{ opacity:1; } }
  @keyframes pulse-glow { 0%,100%{ opacity:0.5; } 50%{ opacity:1; } }

  .tc-panel { background:rgba(15,23,42,0.72); backdrop-filter:blur(20px); border-radius:18px; border:1px solid rgba(255,255,255,0.07); padding:26px 28px; transition:border-color .25s ease; }

  .tc-select { width:100%; padding:9px 12px; border-radius:10px; border:1.5px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:#F1F5F9; font-size:13px; font-family:'DM Sans',sans-serif; outline:none; cursor:pointer; transition:border-color .2s; }
  .tc-select:focus { border-color:rgba(34,197,94,0.45); }
  .tc-select option { background:#0f172a; color:#F1F5F9; }

  .tc-num-input { width:100%; padding:8px 10px; border-radius:9px; border:1.5px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:#F1F5F9; font-size:13px; font-family:'DM Mono',monospace; outline:none; text-align:center; transition:border-color .2s; }
  .tc-num-input:focus { border-color:rgba(34,197,94,0.45); }
  .tc-num-input::-webkit-inner-spin-button { opacity:.3; }

  .tc-btn-primary { width:100%; padding:11px; border-radius:10px; border:none; background:linear-gradient(135deg,#22C55E,#16A34A); color:#fff; font-size:14px; font-weight:700; cursor:pointer; font-family:'Sora',sans-serif; letter-spacing:-.01em; transition:all .2s ease; box-shadow:0 4px 16px rgba(34,197,94,0.3); }
  .tc-btn-primary:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(34,197,94,0.45); }
  .tc-btn-primary:disabled { background:rgba(255,255,255,0.08); box-shadow:none; cursor:not-allowed; color:rgba(255,255,255,0.3); }

  .tc-btn-ghost { flex:1; padding:9px; background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.1); border-radius:9px; font-size:13px; cursor:pointer; color:rgba(255,255,255,0.5); font-weight:600; font-family:'DM Sans',sans-serif; transition:all .2s; }
  .tc-btn-ghost:hover:not(:disabled) { background:rgba(255,255,255,0.08); color:#fff; }

  .tc-btn-confirm { flex:1; padding:9px; background:linear-gradient(135deg,#8B5CF6,#7C3AED); border:none; border-radius:9px; font-size:13px; cursor:pointer; color:#fff; font-weight:700; font-family:'DM Sans',sans-serif; transition:all .2s; box-shadow:0 4px 14px rgba(139,92,246,0.3); }
  .tc-btn-confirm:hover:not(:disabled) { box-shadow:0 6px 20px rgba(139,92,246,0.5); }
  .tc-btn-confirm:disabled { opacity:.5; cursor:not-allowed; }

  .tc-btn-view { width:100%; padding:11px; border-radius:10px; border:none; background:linear-gradient(135deg,#3B82F6,#2563EB); color:#fff; font-size:13px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s; box-shadow:0 4px 14px rgba(59,130,246,0.3); }
  .tc-btn-view:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(59,130,246,0.45); }

  .tc-label { font-size:11px; font-weight:700; color:rgba(255,255,255,0.4); display:block; margin-bottom:6px; letter-spacing:.09em; text-transform:uppercase; font-family:'DM Mono',monospace; }

  .tc-save-btn { width:100%; margin-top:10px; padding:8px; border-radius:9px; border:none; background:rgba(16,185,129,0.2); color:#34D399; font-size:12px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s; border:1px solid rgba(16,185,129,0.25); }
  .tc-save-btn:hover:not(:disabled) { background:rgba(16,185,129,0.3); }
  .tc-save-btn:disabled { opacity:.5; cursor:not-allowed; }
`;

const SEMESTER_OPTIONS = [
  { value:"FIRST",  label:"1st Semester" },
  { value:"SECOND", label:"2nd Semester" },
  { value:"SUMMER", label:"Summer" },
];
const SCHOOL_YEARS = ["2024-2025","2025-2026","2026-2027"];

export default function ProgramHeadGenerateSchedule() {
  const navigate = useNavigate();
  const { user }  = useAuth();

  const [form, setForm] = useState({ semester:"FIRST", schoolYear:"2024-2025", autoPublish:false, courseId:null });
  const [courses,       setCourses]       = useState([]);
  const [result,        setResult]        = useState(null);
  const [error,         setError]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [confirmed,     setConfirmed]     = useState(false);
  const [readiness,     setReadiness]     = useState([]);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [isLocked,      setIsLocked]      = useState(false);
  const [lockChecking,  setLockChecking]  = useState(false);
  const [sectionConfigs, setSectionConfigs] = useState({ 1:1, 2:1, 3:1, 4:1 });
  const [savingConfig,  setSavingConfig]  = useState(false);

  useEffect(() => {
    api.get("/dean/my-courses").then(r=>{
      const list=r.data?.data??[]; setCourses(list);
      if (list.length>0) setForm(f=>({...f,courseId:list[0].id}));
    }).catch(()=>{});
  }, []);

  const checkLock = async (courseId, semester, schoolYear) => {
    if (!courseId) return; setLockChecking(true);
    try { const res=await api.get(`/schedules/is-locked?courseId=${courseId}&semester=${semester}&schoolYear=${schoolYear}`); setIsLocked(res.data?.data??false); }
    catch { setIsLocked(false); } finally { setLockChecking(false); }
  };

  const checkReadiness = async (semester, schoolYear) => {
    setReadinessLoading(true);
    try { const res=await api.get(`/dean/readiness?semester=${semester}&schoolYear=${schoolYear}`); setReadiness(res.data?.data??[]); }
    catch { setReadiness([]); } finally { setReadinessLoading(false); }
  };

  useEffect(() => {
    if (form.courseId) {
      checkLock(form.courseId, form.semester, form.schoolYear);
      checkReadiness(form.semester, form.schoolYear);
      api.get(`/sections/config?courseId=${form.courseId}&semester=${form.semester}&schoolYear=${form.schoolYear}`)
        .then(r=>{ const list=r.data?.data??[]; const map={1:1,2:1,3:1,4:1}; list.forEach(c=>{map[c.yearLevel]=c.sectionCount;}); setSectionConfigs(map); })
        .catch(()=>{});
    }
  }, [form.courseId, form.semester, form.schoolYear]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f=>({...f,[name]:type==="checkbox"?checked:name==="courseId"?Number(value):value}));
    setResult(null); setError(""); setConfirmed(false);
  };

  const handleGenerate = async () => {
    setError(""); setResult(null); setLoading(true);
    try {
      const res = await api.post(`/schedules/generate`,{ semester:form.semester, schoolYear:form.schoolYear, autoPublish:form.autoPublish, clearDraftsFirst:true },{ timeout:120000 });
      setResult(res.data?.data??res.data);
    } catch(e) { setError(`Schedule generation failed. ${e.response?.data?.message??e.message??""}`.trim()); }
    finally { setLoading(false); setConfirmed(false); }
  };

  const handleSaveConfigs = async () => {
    setSavingConfig(true);
    try {
      for (const course of courses) for (const yearLevel of [1,2,3,4])
        await api.post("/sections/config",{ courseId:course.id, yearLevel, sectionCount:sectionConfigs[yearLevel], semester:form.semester, schoolYear:form.schoolYear });
    } catch(e) { setError(e.response?.data?.message??"Failed to save section config."); }
    finally { setSavingConfig(false); }
  };

  const semLabel = SEMESTER_OPTIONS.find(s=>s.value===form.semester)?.label;
  const notReady = readiness.length>0 && readiness.some(r=>!r.ready);
  const noReadiness = readiness.length===0;

  return (
    <div style={{ minHeight:"100vh", background:"#060D1A", color:"#F1F5F9", fontFamily:"'DM Sans',sans-serif", padding:"2rem 2.5rem" }}>
      <style>{STYLES}</style>

      {/* Ambient */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-15%", right:"15%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(139,92,246,0.07) 0%,transparent 70%)", filter:"blur(60px)", animation:"pulse-glow 9s ease infinite" }} />
        <div style={{ position:"absolute", bottom:"5%", left:"5%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(34,197,94,0.05) 0%,transparent 70%)", filter:"blur(60px)", animation:"pulse-glow 12s ease infinite 3s" }} />
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", position:"relative", zIndex:1 }}>

        {/* Header */}
        <div style={{ marginBottom:28, animation:"slideUp .5s ease both" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#8B5CF6", boxShadow:"0 0 8px #8B5CF6" }} />
            <span style={{ fontSize:11, fontWeight:700, color:"#A78BFA", letterSpacing:".12em", textTransform:"uppercase", fontFamily:"'DM Mono',monospace" }}>Program Head Portal</span>
          </div>
          <h1 style={{ fontSize:"2rem", fontWeight:800, color:"#fff", letterSpacing:"-.03em", fontFamily:"'Sora',sans-serif" }}>Generate Schedule</h1>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:14, marginTop:4 }}>{user?.departmentName} · Only finalized assignments will be used.</p>
        </div>

        {/* Readiness report */}
        {readinessLoading ? (
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"12px 18px", marginBottom:20, fontSize:13, color:"rgba(255,255,255,0.4)", animation:"pulse 2s ease infinite" }}>
            Checking course readiness…
          </div>
        ) : readiness.length>0 && (
          <div style={{ marginBottom:22, display:"flex", flexDirection:"column", gap:8, animation:"slideUp .4s ease both" }}>
            {readiness.map(r=>(
              <div key={r.courseId} style={{
                background: r.ready?"rgba(34,197,94,0.07)":"rgba(239,68,68,0.07)",
                border:`1px solid ${r.ready?"rgba(34,197,94,0.2)":"rgba(239,68,68,0.2)"}`,
                borderRadius:10, padding:"10px 16px",
                color: r.ready?"#4ADE80":"#f87171",
                fontSize:13, display:"flex", alignItems:"center", gap:10,
              }}>
                <span>{r.ready?"✅":"❌"}</span>
                <div><strong style={{ fontFamily:"'DM Mono',monospace" }}>{r.courseCode}</strong> <span style={{ color:"rgba(255,255,255,0.4)" }}>—</span> {r.courseName}</div>
                {r.ready && <span style={{ marginLeft:"auto", fontSize:11, color:"rgba(34,197,94,0.6)", fontWeight:700 }}>READY</span>}
              </div>
            ))}
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, animation:"slideUp .5s ease .1s both" }}>

          {/* ── Config panel ── */}
          <div className="tc-panel">
            <h2 style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:20, fontFamily:"'Sora',sans-serif" }}>Term Configuration</h2>

            <div style={{ display:"flex", flexDirection:"column", gap:16, marginBottom:22 }}>
              <div>
                <label className="tc-label">Semester</label>
                <select className="tc-select" name="semester" value={form.semester} onChange={handleChange}>
                  {SEMESTER_OPTIONS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div>
                <label className="tc-label">School Year</label>
                <select className="tc-select" name="schoolYear" value={form.schoolYear} onChange={handleChange}>
                  {SCHOOL_YEARS.map(y=><option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div>
                <label className="tc-label">Sections per Year Level</label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:4 }}>
                  {[1,2,3,4].map(y=>(
                    <div key={y} style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:"'DM Mono',monospace", width:28, flexShrink:0 }}>Yr {y}</span>
                      <input type="number" className="tc-num-input" min={1} max={10} value={sectionConfigs[y]}
                        onChange={e=>setSectionConfigs(p=>({...p,[y]:Number(e.target.value)}))} />
                    </div>
                  ))}
                </div>
                <button className="tc-save-btn" onClick={handleSaveConfigs} disabled={savingConfig}>
                  {savingConfig?"Saving…":"Save Section Config"}
                </button>
              </div>

              {/* Auto-publish toggle */}
              <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"10px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.02)", transition:"background .2s" }}>
                <div style={{ position:"relative", width:38, height:21, flexShrink:0 }}>
                  <input type="checkbox" id="autoPublish" name="autoPublish" checked={form.autoPublish} onChange={handleChange}
                    style={{ opacity:0, width:0, height:0, position:"absolute" }} />
                  <div style={{ position:"absolute", inset:0, borderRadius:99, background:form.autoPublish?"#22C55E":"rgba(255,255,255,0.1)", transition:"background .2s", cursor:"pointer" }} onClick={()=>setForm(f=>({...f,autoPublish:!f.autoPublish}))} />
                  <div style={{ position:"absolute", top:3, left:form.autoPublish?18:3, width:15, height:15, borderRadius:"50%", background:"#fff", transition:"left .2s", boxShadow:"0 1px 4px rgba(0,0,0,0.3)", pointerEvents:"none" }} />
                </div>
                <div>
                  <div style={{ fontSize:13, color:"#F1F5F9", fontWeight:600 }}>Auto-publish</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>Publish immediately if no conflicts found</div>
                </div>
              </label>
            </div>

            {/* Locked warning */}
            {isLocked && (
              <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:13, marginBottom:14, display:"flex", gap:8 }}>
                🔒 A published schedule already exists for this term. Generation is locked.
              </div>
            )}

            {/* Generate / Confirm buttons */}
            {!confirmed ? (
              <button className="tc-btn-primary" onClick={()=>setConfirmed(true)}
                disabled={loading||isLocked||lockChecking||noReadiness||notReady}
                style={{ background:(isLocked||notReady)?"rgba(255,255,255,0.06)":undefined }}>
                {lockChecking?"Checking lock…":noReadiness?"Loading readiness…":notReady?"Not Ready — Fix Assignments First":"Review & Generate ⚡"}
              </button>
            ) : (
              <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:12, padding:16 }}>
                <p style={{ fontSize:13, color:"#FCD34D", marginBottom:14, lineHeight:1.6 }}>
                  ⚠️ This will replace existing <strong>draft</strong> schedules for <strong>{semLabel} {form.schoolYear}</strong>. Continue?
                </p>
                <div style={{ display:"flex", gap:10 }}>
                  <button className="tc-btn-ghost" onClick={()=>setConfirmed(false)} disabled={loading}>Cancel</button>
                  <button className="tc-btn-confirm" onClick={handleGenerate} disabled={loading}>
                    {loading?"Generating…":"Confirm & Generate"}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div style={{ marginTop:14, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:13 }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* ── Result panel ── */}
          <div className="tc-panel" style={{ display:"flex", flexDirection:"column" }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:20, fontFamily:"'Sora',sans-serif" }}>Generation Result</h2>

            {!result && !loading && (
              <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:240, color:"rgba(255,255,255,0.2)", textAlign:"center", gap:14 }}>
                <div style={{ width:60, height:60, borderRadius:18, background:"rgba(139,92,246,0.1)", border:"1px solid rgba(139,92,246,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>⚡</div>
                <div style={{ fontSize:14, color:"rgba(255,255,255,0.25)" }}>Results will appear here after generation.</div>
              </div>
            )}

            {loading && (
              <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:240, gap:16 }}>
                <div style={{ width:48, height:48, borderRadius:"50%", border:"3px solid rgba(139,92,246,0.15)", borderTopColor:"#8B5CF6", animation:"spin 1s linear infinite" }} />
                <div style={{ fontSize:14, color:"rgba(255,255,255,0.4)", fontFamily:"'DM Mono',monospace" }}>Running scheduling engine…</div>
              </div>
            )}

            {result && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {/* Stats */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, paddingBottom:18, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                  {[
                    { label:"Total",      value:result.total,       color:"#3B82F6" },
                    { label:"Successful", value:result.successful,   color:"#22C55E" },
                    { label:"Conflicts",  value:result.conflicted,   color:result.conflicted>0?"#f87171":"#22C55E" },
                  ].map(s=>(
                    <div key={s.label} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:30, fontWeight:800, color:s.color, fontFamily:"'Sora',sans-serif", letterSpacing:"-.03em" }}>{s.value}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:3, textTransform:"uppercase", letterSpacing:".08em", fontWeight:600 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                <div style={{ display:"flex", gap:8 }}>
                  {[result.semester??form.semester, result.schoolYear??form.schoolYear].map(t=>(
                    <span key={t} style={{ padding:"3px 10px", background:"rgba(255,255,255,0.06)", borderRadius:99, fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700, fontFamily:"'DM Mono',monospace", border:"1px solid rgba(255,255,255,0.08)" }}>{t}</span>
                  ))}
                </div>

                {/* Status banner */}
                {result.conflicted===0 ? (
                  <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:10, padding:"10px 14px", color:"#4ADE80", fontSize:13 }}>
                    ✓ Schedule generated with no conflicts.{form.autoPublish&&" Auto-published."}
                  </div>
                ) : (
                  <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:13 }}>
                    ⚠️ {result.conflicted} conflict(s) detected. Review with your admin.
                  </div>
                )}

                {/* View button */}
                <button className="tc-btn-view" onClick={()=>navigate(`/dean/schedule-view?semester=${form.semester}&schoolYear=${form.schoolYear}`)}>
                  📅 View Generated Schedule
                </button>

                {/* AI Summary */}
                {result.aiSummary && result.aiSummary!=="AI summary unavailable." && (
                  <div style={{ background:"rgba(59,130,246,0.07)", border:"1px solid rgba(59,130,246,0.2)", borderRadius:10, padding:"14px 16px" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#60A5FA", marginBottom:8, letterSpacing:".08em", textTransform:"uppercase", fontFamily:"'DM Mono',monospace" }}>🤖 AI Summary</div>
                    <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.7, margin:0 }}>{result.aiSummary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
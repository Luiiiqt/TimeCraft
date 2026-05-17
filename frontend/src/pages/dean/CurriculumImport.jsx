import { useState, useEffect } from "react";
import api from "../../services/api";

const YEAR_LABELS = { 1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year" };
const SEM_LABELS = { FIRST: "1st Semester", SECOND: "2nd Semester", SUMMER: "Summer" };
const SEM_ORDER = ["FIRST", "SECOND", "SUMMER"];

const TYPE_CONFIG = {
  MAJOR_LECTURE:     { label: "Major — Lecture Only",  color: "#3B82F6", bg: "rgba(59,130,246,0.12)",  dot: "#3B82F6" },
  MAJOR_LECTURE_LAB: { label: "Major — Lecture + Lab", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", dot: "#8B5CF6" },
  MINOR:             { label: "Minor (GE)",             color: "#22C55E", bg: "rgba(34,197,94,0.12)",  dot: "#22C55E" },
};

function getSubjectType(cs) {
  if (cs.subject?.subjectType === "MINOR") return "MINOR";
  if (cs.subject?.hasLab) return "MAJOR_LECTURE_LAB";
  return "MAJOR_LECTURE";
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
  @keyframes pulse-glow { 0%,100%{ opacity:0.5; } 50%{ opacity:1; } }

  .tc-tab-btn { background:transparent; border:none; cursor:pointer; padding:10px 22px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; transition:all .2s ease; }
  .tc-tab-btn:hover { color:#fff; }

  .tc-card { background:rgba(15,23,42,0.7); backdrop-filter:blur(20px); border-radius:16px; border:1px solid rgba(255,255,255,0.07); padding:24px 26px; transition:border-color .2s ease; }
  .tc-card:hover { border-color:rgba(255,255,255,0.12); }

  .tc-input { width:100%; padding:9px 13px; border-radius:9px; border:1.5px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:#F1F5F9; font-size:13px; font-family:'DM Sans',sans-serif; transition:border-color .2s; outline:none; }
  .tc-input:focus { border-color:rgba(34,197,94,0.5); }
  .tc-input::placeholder { color:rgba(255,255,255,0.25); }

  .tc-select { padding:8px 12px; border-radius:9px; border:1.5px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:#F1F5F9; font-size:13px; font-family:'DM Sans',sans-serif; outline:none; cursor:pointer; }
  .tc-select:focus { border-color:rgba(34,197,94,0.5); }
  .tc-select option { background:#0f172a; color:#F1F5F9; }

  .tc-btn-primary { padding:9px 22px; border-radius:9px; border:none; background:linear-gradient(135deg,#22C55E,#16A34A); color:#fff; font-size:13px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s ease; box-shadow:0 4px 16px rgba(34,197,94,0.3); }
  .tc-btn-primary:hover { transform:translateY(-1px); box-shadow:0 8px 24px rgba(34,197,94,0.45); }
  .tc-btn-primary:disabled { background:#374151; box-shadow:none; cursor:not-allowed; transform:none; }

  .tc-btn-ghost { padding:8px 16px; border-radius:8px; border:1.5px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.6); font-size:12px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s ease; }
  .tc-btn-ghost:hover { background:rgba(255,255,255,0.08); color:#fff; border-color:rgba(255,255,255,0.2); }

  .tc-badge { font-size:11px; padding:3px 10px; border-radius:6px; font-weight:700; font-family:'DM Mono',monospace; letter-spacing:.04em; white-space:nowrap; display:inline-flex; align-items:center; gap:5px; }

  .tc-table th { padding:10px 14px; text-align:left; font-size:11px; font-weight:700; color:rgba(255,255,255,0.4); letter-spacing:.08em; text-transform:uppercase; font-family:'DM Mono',monospace; white-space:nowrap; border-bottom:1px solid rgba(255,255,255,0.06); }
  .tc-table td { padding:10px 14px; font-size:13px; color:rgba(255,255,255,0.7); border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
  .tc-table tr:last-child td { border-bottom:none; }
  .tc-table tr:hover td { background:rgba(255,255,255,0.025); }

  .tc-col-guide-item { font-size:11px; color:rgba(255,255,255,0.45); }
  .tc-col-guide-item strong { color:#F1F5F9; }

  @media print {
    @page { size:A4; margin:15mm; }
    body * { visibility:hidden; }
    #checklist-print, #checklist-print * { visibility:visible; }
    #checklist-print { position:absolute; left:0; top:0; width:100%; font-family:Arial,sans-serif; font-size:11px; color:#000; }
    #checklist-print table { width:100%; border-collapse:collapse; margin-bottom:8px; }
    #checklist-print th { background:#1e293b !important; color:#fff !important; padding:6px 10px; text-align:left; font-size:10px; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    #checklist-print td { padding:5px 10px; border-bottom:1px solid #e5e7eb; font-size:10px; }
    .year-block { break-after:page !important; }
    .year-block:last-child { break-after:avoid !important; }
  }
`;

export default function CurriculumImport() {
  const [courses, setCourses]       = useState([]);
  const [curricula, setCurricula]   = useState([]);
  const [checklist, setChecklist]   = useState([]);
  const [form, setForm]             = useState({ courseId:"", effectiveYear:"", curriculumName:"", file:null });
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState({ type:"", text:"" });
  const [assignments, setAssignments] = useState([]);
  const [term]                      = useState(() => {
    const now = new Date(); const m = now.getMonth()+1; const y = now.getFullYear();
    return { semester: m>=6&&m<=10?"FIRST":"SECOND", schoolYear:`${y}-${y+1}` };
  });
  const [activeTab,   setActiveTab]   = useState("import");
  const [filterYear,  setFilterYear]  = useState("ALL");
  const [filterSem,   setFilterSem]   = useState("ALL");
  const [filterType,  setFilterType]  = useState("ALL");
  const [search,      setSearch]      = useState("");

  useEffect(() => {
    api.get("/dean/my-courses").then(r => {
      const list = r.data?.data ?? [];
      setCourses(list);
      if (list.length > 0) {
        const id = list[0].id;
        setForm(f => ({ ...f, courseId: id }));
        loadCurricula(id); loadChecklist(id); loadAssignments(id);
      }
    }).catch(() => {});
  }, [term]);

  const loadCurricula  = id => api.get(`/curriculum?courseId=${id}`).then(r => setCurricula(r.data?.data ?? [])).catch(() => setCurricula([]));
  const loadChecklist  = id => api.get(`/subjects/course/${id}/curriculum`).then(r => setChecklist(r.data?.data ?? [])).catch(() => setChecklist([]));
  const loadAssignments= id => api.get(`/dean/assignments?semester=${term.semester}&schoolYear=${term.schoolYear}`).then(r => setAssignments(r.data?.data ?? [])).catch(() => setAssignments([]));

  const handleCourseChange = id => {
    setForm(f => ({ ...f, courseId:id }));
    loadCurricula(id); loadChecklist(id); loadAssignments(id);
  };

  const handleSubmit = async () => {
    if (!form.courseId||!form.effectiveYear||!form.curriculumName||!form.file) { setMsg({ type:"error", text:"All fields and a file are required." }); return; }
    setSaving(true); setMsg({ type:"", text:"" });
    try {
      const data = new FormData();
      data.append("courseId", form.courseId); data.append("effectiveYear", form.effectiveYear);
      data.append("curriculumName", form.curriculumName); data.append("file", form.file);
      await api.post("/curriculum/import", data, { headers:{ "Content-Type":"multipart/form-data" } });
      setMsg({ type:"success", text:"Curriculum imported successfully." });
      loadCurricula(form.courseId); loadChecklist(form.courseId); setActiveTab("checklist");
    } catch(e) { setMsg({ type:"error", text: e.response?.data?.message ?? "Import failed." }); }
    finally { setSaving(false); }
  };

  const filtered = checklist.filter(cs => {
    const t = getSubjectType(cs);
    const q = search.toLowerCase();
    return (filterYear==="ALL"||String(cs.yearLevel)===filterYear)
      && (filterSem==="ALL"||cs.semester===filterSem)
      && (filterType==="ALL"||t===filterType)
      && (!q||cs.subject?.code?.toLowerCase().includes(q)||cs.subject?.name?.toLowerCase().includes(q));
  });

  const grouped = {};
  for (const cs of filtered) {
    const y = cs.yearLevel, s = cs.semester;
    if (!grouped[y]) grouped[y]={};
    if (!grouped[y][s]) grouped[y][s]=[];
    grouped[y][s].push(cs);
  }

  const totalSubjects = checklist.length;
  const majorLec    = checklist.filter(cs=>getSubjectType(cs)==="MAJOR_LECTURE").length;
  const majorLecLab = checklist.filter(cs=>getSubjectType(cs)==="MAJOR_LECTURE_LAB").length;
  const minor       = checklist.filter(cs=>getSubjectType(cs)==="MINOR").length;

  const buildPrintHTML = (forDownload=false) => {
    const courseName = courses.find(c=>String(c.id)===String(form.courseId))?.name ?? "Curriculum";
    const pages = Object.keys(grouped).sort((a,b)=>a-b).map(year => {
      const sems = SEM_ORDER.filter(s=>grouped[year][s]);
      const semTables = sems.map(sem => {
        const rows = grouped[year][sem].map((cs,i)=>{
          const t=getSubjectType(cs); const tl=TYPE_CONFIG[t]?.label??t;
          return `<tr><td>${i+1}</td><td><b>${cs.subject?.code??"—"}</b></td><td>${cs.subject?.name??"—"}</td><td style="text-align:center">${cs.subject?.units??"—"}</td><td>${cs.subject?.prerequisite?.code??"none"}</td><td>${tl}</td></tr>`;
        }).join("");
        return `<h3 style="margin:12px 0 4px;font-size:11px;color:#555">${SEM_LABELS[sem]}</h3><table><thead><tr><th>#</th><th>Code</th><th>Subject Name</th><th>Units</th><th>Prerequisite</th><th>Type</th></tr></thead><tbody>${rows}</tbody></table>`;
      }).join("");
      return `<div class="year-page"><h2 style="margin:0 0 10px;font-size:14px;background:#1e293b;color:#fff;padding:8px 12px;border-radius:4px">${YEAR_LABELS[year]??`Year ${year}`}</h2>${semTables}</div>`;
    }).join("");
    return `<html><head><title>${courseName} Checklist</title><style>*{box-sizing:border-box;}body{font-family:Arial,sans-serif;font-size:10px;margin:0;padding:10mm;}h1{font-size:13px;text-align:center;margin-bottom:4px;}table{width:100%;border-collapse:collapse;margin-bottom:6px;font-size:9px;}th{background:#1e293b;color:#fff;padding:5px 8px;text-align:left;}td{padding:4px 8px;border-bottom:1px solid #e5e7eb;}tr:nth-child(even)td{background:#f8fafc;}.year-page{page-break-after:always;padding-bottom:10px;}.year-page:last-child{page-break-after:avoid;}${forDownload?"":"@media print{#actions{display:none!important;}}"}</style></head><body><h1>${courseName} — Curriculum Checklist</h1><p style="text-align:center;font-size:9px;color:#888;margin-bottom:12px">Generated: ${new Date().toLocaleDateString()}</p>${pages}</body></html>`;
  };

  const handlePrint = () => { const w=window.open("","_blank"); w.document.write(buildPrintHTML()); w.document.close(); w.onload=()=>w.print(); };
  const handleDownload = () => {
    const courseName = courses.find(c=>String(c.id)===String(form.courseId))?.name??"Curriculum";
    const blob=new Blob([buildPrintHTML(true)],{type:"text/html"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a");
    a.href=url; a.download=`${courseName}_Checklist.html`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#060D1A", color:"#F1F5F9", fontFamily:"'DM Sans',sans-serif", padding:"2rem 2.5rem" }}>
      <style>{STYLES}</style>

      {/* Ambient bg */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-20%", right:"10%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(34,197,94,0.06) 0%,transparent 70%)", filter:"blur(60px)" }} />
        <div style={{ position:"absolute", bottom:"10%", left:"-5%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(139,92,246,0.05) 0%,transparent 70%)", filter:"blur(60px)" }} />
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", position:"relative", zIndex:1 }}>

        {/* Header */}
        <div style={{ marginBottom:28, animation:"slideUp .5s ease both" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#22C55E", boxShadow:"0 0 8px #22C55E" }} />
            <span style={{ fontSize:11, fontWeight:700, color:"#22C55E", letterSpacing:".12em", textTransform:"uppercase", fontFamily:"'DM Mono',monospace" }}>Dean Portal</span>
          </div>
          <h1 style={{ fontSize:"1.9rem", fontWeight:800, color:"#fff", letterSpacing:"-.02em", fontFamily:"'Sora',sans-serif" }}>Curriculum Management</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:14, marginTop:4 }}>Import a 4-year curriculum and review subject checklists per year level.</p>
        </div>

        {/* Course selector */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:22, animation:"slideUp .5s ease .05s both" }}>
          <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)", letterSpacing:".1em", textTransform:"uppercase", fontFamily:"'DM Mono',monospace" }}>Course</span>
          <select className="tc-select" value={form.courseId} onChange={e=>handleCourseChange(e.target.value)}>
            {courses.map(c=><option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </select>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.08)", marginBottom:28, animation:"slideUp .5s ease .1s both" }}>
          {[["import","⬆ Import"],["checklist",`📋 Checklist (${totalSubjects})`]].map(([key,label])=>(
            <button key={key} className="tc-tab-btn" onClick={()=>setActiveTab(key)} style={{
              color: activeTab===key?"#22C55E":"rgba(255,255,255,0.4)",
              borderBottom: `2px solid ${activeTab===key?"#22C55E":"transparent"}`,
              marginBottom:-1,
            }}>{label}</button>
          ))}
        </div>

        {/* ── IMPORT TAB ── */}
        {activeTab==="import" && (
          <div style={{ animation:"slideUp .4s ease both" }}>
            {msg.text && (
              <div style={{ background: msg.type==="error"?"rgba(220,38,38,0.1)":"rgba(34,197,94,0.1)", border:`1px solid ${msg.type==="error"?"rgba(220,38,38,0.3)":"rgba(34,197,94,0.3)"}`, borderRadius:10, padding:"10px 16px", marginBottom:16, color:msg.type==="error"?"#f87171":"#4ADE80", fontSize:13, display:"flex", gap:8, alignItems:"center" }}>
                {msg.type==="error"?"⚠️":"✅"} {msg.text}
              </div>
            )}

            <div className="tc-card" style={{ marginBottom:22 }}>
              <h2 style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:4, fontFamily:"'Sora',sans-serif" }}>Upload Curriculum File</h2>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:20 }}>
                Required columns: <code style={{ color:"#86EFAC", background:"rgba(34,197,94,0.1)", padding:"1px 6px", borderRadius:4, fontSize:11 }}>subject_code, subject_name, units, prerequisite, year_level, semester, subject_type, session_type, has_lab</code>
              </p>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)", display:"block", marginBottom:5, letterSpacing:".08em", textTransform:"uppercase" }}>Effective Year</label>
                  <input className="tc-input" placeholder="e.g. 2024-2025" value={form.effectiveYear} onChange={e=>setForm(f=>({...f,effectiveYear:e.target.value}))} />
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)", display:"block", marginBottom:5, letterSpacing:".08em", textTransform:"uppercase" }}>Curriculum Name</label>
                  <input className="tc-input" placeholder="e.g. BSIT Curriculum 2024" value={form.curriculumName} onChange={e=>setForm(f=>({...f,curriculumName:e.target.value}))} />
                </div>
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)", display:"block", marginBottom:5, letterSpacing:".08em", textTransform:"uppercase" }}>File (.xlsx or .csv)</label>
                <input type="file" accept=".xlsx,.csv" onChange={e=>setForm(f=>({...f,file:e.target.files[0]}))} style={{ fontSize:13, color:"rgba(255,255,255,0.6)" }} />
              </div>

              {/* Column guide */}
              <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid rgba(255,255,255,0.07)", padding:"14px 18px", marginBottom:22 }}>
                <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", marginBottom:10, letterSpacing:".1em", textTransform:"uppercase" }}>Column Guide</p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  {[["subject_code","e.g. IT-DSA"],["subject_name","Full subject name"],["units","e.g. 3"],["prerequisite","Code or blank"],["year_level","1 – 4"],["semester","FIRST / SECOND / SUMMER"],["subject_type","MAJOR or MINOR"],["session_type","LECTURE ONLY / LECTURE & LABORATORY"],["has_lab","TRUE or FALSE"]].map(([col,hint])=>(
                    <div key={col} className="tc-col-guide-item"><strong>{col}</strong> — {hint}</div>
                  ))}
                </div>
              </div>

              <button className="tc-btn-primary" onClick={handleSubmit} disabled={saving}>{saving?"Importing…":"Import Curriculum"}</button>
            </div>

            {/* Existing curricula */}
            <div className="tc-card">
              <h2 style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:16, fontFamily:"'Sora',sans-serif" }}>Imported Curricula</h2>
              <table className="tc-table" style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr>{["Name","Effective Year","Imported At","Status"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {curricula.length===0
                    ? <tr><td colSpan={4} style={{ textAlign:"center", color:"rgba(255,255,255,0.25)", padding:32 }}>No curricula imported yet.</td></tr>
                    : curricula.map(c=>(
                      <tr key={c.id}>
                        <td style={{ fontWeight:600, color:"#F1F5F9" }}>{c.name}</td>
                        <td><span style={{ color:"#22C55E", fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:700 }}>{c.effectiveYear}</span></td>
                        <td style={{ color:"rgba(255,255,255,0.35)", fontSize:12, fontFamily:"'DM Mono',monospace" }}>{c.importedAt?new Date(c.importedAt).toLocaleDateString():"—"}</td>
                        <td><span className="tc-badge" style={{ background:c.active?"rgba(34,197,94,0.12)":"rgba(255,255,255,0.05)", color:c.active?"#4ADE80":"rgba(255,255,255,0.3)", border:`1px solid ${c.active?"rgba(34,197,94,0.3)":"rgba(255,255,255,0.08)"}` }}>{c.active?"● ACTIVE":"INACTIVE"}</span></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CHECKLIST TAB ── */}
        {activeTab==="checklist" && (
          <div style={{ animation:"slideUp .4s ease both" }}>
            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
              {[
                { label:"Total Subjects",     value:totalSubjects, color:"#fff",    accent:"rgba(255,255,255,0.06)" },
                { label:"Major (Lec Only)",   value:majorLec,      color:"#3B82F6", accent:"rgba(59,130,246,0.08)" },
                { label:"Major (Lec + Lab)",  value:majorLecLab,   color:"#8B5CF6", accent:"rgba(139,92,246,0.08)" },
                { label:"Minor (GE)",         value:minor,         color:"#22C55E", accent:"rgba(34,197,94,0.08)" },
              ].map(s=>(
                <div key={s.label} className="tc-card" style={{ padding:"18px 20px", background:s.accent, borderColor:`${s.color}20` }}>
                  <div style={{ fontSize:30, fontWeight:800, color:s.color, fontFamily:"'Sora',sans-serif", letterSpacing:"-.02em" }}>{s.value}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4, fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display:"flex", gap:16, marginBottom:16, flexWrap:"wrap" }}>
              {Object.entries(TYPE_CONFIG).map(([k,v])=>(
                <div key={k} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"rgba(255,255,255,0.5)" }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:v.dot, display:"inline-block" }} />
                  {v.label}
                </div>
              ))}
            </div>

            {/* Filters row */}
            <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
              <input className="tc-input" placeholder="Search subject…" value={search} onChange={e=>setSearch(e.target.value)} style={{ width:220 }} />
              <select className="tc-select" value={filterYear} onChange={e=>setFilterYear(e.target.value)}>
                <option value="ALL">All Year Levels</option>
                {[1,2,3,4].map(y=><option key={y} value={String(y)}>Year {y}</option>)}
              </select>
              <select className="tc-select" value={filterSem} onChange={e=>setFilterSem(e.target.value)}>
                <option value="ALL">All Semesters</option>
                {SEM_ORDER.map(s=><option key={s} value={s}>{SEM_LABELS[s]}</option>)}
              </select>
              <select className="tc-select" value={filterType} onChange={e=>setFilterType(e.target.value)}>
                <option value="ALL">All Types</option>
                {Object.entries(TYPE_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
              {(search||filterYear!=="ALL"||filterSem!=="ALL"||filterType!=="ALL") && (
                <button className="tc-btn-ghost" onClick={()=>{setSearch("");setFilterYear("ALL");setFilterSem("ALL");setFilterType("ALL");}}>Clear filters</button>
              )}
              <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
                <button className="tc-btn-ghost" onClick={handlePrint}>🖨 Print</button>
                <button className="tc-btn-primary" style={{ padding:"8px 16px" }} onClick={handleDownload}>⬇ Download</button>
              </div>
            </div>

            <div id="checklist-print">
              {checklist.length===0 ? (
                <div className="tc-card" style={{ textAlign:"center", padding:64 }}>
                  <div style={{ fontSize:44, marginBottom:14 }}>📂</div>
                  <p style={{ color:"rgba(255,255,255,0.3)", fontSize:14 }}>No curriculum imported yet. Go to the Import tab to upload a file.</p>
                </div>
              ) : filtered.length===0 ? (
                <div className="tc-card" style={{ textAlign:"center", padding:40, color:"rgba(255,255,255,0.3)", fontSize:14 }}>No subjects match your filters.</div>
              ) : (
                Object.keys(grouped).sort((a,b)=>a-b).map(year=>(
                  <div key={year} className="year-block" style={{ marginBottom:32 }}>
                    {/* Year header */}
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                      <div style={{ background:"linear-gradient(135deg,rgba(34,197,94,0.2),rgba(34,197,94,0.08))", border:"1px solid rgba(34,197,94,0.25)", borderRadius:10, padding:"5px 16px", fontSize:12, fontWeight:800, color:"#4ADE80", fontFamily:"'DM Mono',monospace", letterSpacing:".06em", textTransform:"uppercase" }}>
                        {YEAR_LABELS[year]??`Year ${year}`}
                      </div>
                      <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }} />
                    </div>

                    {SEM_ORDER.filter(s=>grouped[year][s]).map(sem=>(
                      <div key={sem} style={{ marginBottom:16 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.3)", letterSpacing:".1em", textTransform:"uppercase", marginBottom:8, paddingLeft:2, fontFamily:"'DM Mono',monospace" }}>{SEM_LABELS[sem]??sem}</div>
                        <div className="tc-card" style={{ padding:0, overflow:"hidden" }}>
                          <table className="tc-table" style={{ width:"100%", borderCollapse:"collapse" }}>
                            <thead><tr>{["#","Code","Subject Name","Units","Prerequisite","Type","Assigned Teacher"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                            <tbody>
                              {grouped[year][sem].map((cs,i)=>{
                                const t=getSubjectType(cs); const cfg=TYPE_CONFIG[t];
                                const a=assignments.find(a=>a.subject?.id===cs.subject?.id);
                                return (
                                  <tr key={cs.id}>
                                    <td style={{ color:"rgba(255,255,255,0.2)", width:36 }}>{i+1}</td>
                                    <td style={{ fontWeight:700, color:"#4ADE80", fontFamily:"'DM Mono',monospace", fontSize:12 }}>{cs.subject?.code??"—"}</td>
                                    <td style={{ color:"#F1F5F9", fontWeight:500 }}>{cs.subject?.name??"—"}</td>
                                    <td style={{ textAlign:"center", fontFamily:"'DM Mono',monospace", fontSize:12 }}>{cs.subject?.units??"—"}</td>
                                    <td style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.35)" }}>{cs.subject?.prerequisite?.code??"—"}</td>
                                    <td>
                                      <span className="tc-badge" style={{ background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.color}40` }}>
                                        <span style={{ width:6, height:6, borderRadius:"50%", background:cfg.dot, display:"inline-block" }} />
                                        {cfg.label}
                                      </span>
                                    </td>
                                    <td>
                                      {a ? (
                                        <span className="tc-badge" style={{ background:a.finalized?"rgba(34,197,94,0.12)":"rgba(245,158,11,0.12)", color:a.finalized?"#4ADE80":"#FCD34D", border:`1px solid ${a.finalized?"rgba(34,197,94,0.3)":"rgba(245,158,11,0.3)"}` }}>
                                          {a.teacher?.fullName}
                                        </span>
                                      ) : <span style={{ color:"rgba(255,255,255,0.15)", fontSize:12 }}>—</span>}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
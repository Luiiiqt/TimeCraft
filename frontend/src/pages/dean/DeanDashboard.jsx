import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes slideUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse-glow { 0%,100%{ opacity:0.5; transform:scale(1); } 50%{ opacity:1; transform:scale(1.04); } }

  .tc-card { background:rgba(15,23,42,0.7); backdrop-filter:blur(20px); border-radius:16px; border:1px solid rgba(255,255,255,0.07); transition:border-color .25s ease, box-shadow .25s ease; }
  .tc-card:hover { border-color:rgba(255,255,255,0.13); }

  .tc-stat-card { background:rgba(15,23,42,0.7); backdrop-filter:blur(20px); border-radius:16px; border:1px solid rgba(255,255,255,0.07); padding:22px 24px; transition:all .25s ease; }
  .tc-stat-card:hover { transform:translateY(-2px); }

  .tc-input { width:100%; padding:8px 12px; border-radius:9px; border:1.5px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:#F1F5F9; font-size:13px; font-family:'DM Sans',sans-serif; transition:border-color .2s; outline:none; }
  .tc-input:focus { border-color:rgba(34,197,94,0.5); }
  .tc-input::-webkit-inner-spin-button { opacity:.4; }

  .tc-select { padding:8px 12px; border-radius:9px; border:1.5px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:#F1F5F9; font-size:13px; font-family:'DM Sans',sans-serif; outline:none; cursor:pointer; }
  .tc-select:focus { border-color:rgba(34,197,94,0.5); }
  .tc-select option { background:#0f172a; color:#F1F5F9; }

  .tc-btn-primary { padding:9px 22px; border-radius:9px; border:none; background:linear-gradient(135deg,#22C55E,#16A34A); color:#fff; font-size:13px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s ease; box-shadow:0 4px 16px rgba(34,197,94,0.3); }
  .tc-btn-primary:hover { transform:translateY(-1px); box-shadow:0 8px 24px rgba(34,197,94,0.45); }
  .tc-btn-primary:disabled { background:#374151; box-shadow:none; cursor:not-allowed; transform:none; }

  .tc-quick-link { display:block; border-radius:16px; padding:22px 20px; border:1px solid rgba(255,255,255,0.07); text-decoration:none; background:rgba(15,23,42,0.6); backdrop-filter:blur(12px); transition:all .25s ease; position:relative; overflow:hidden; }
  .tc-quick-link::before { content:''; position:absolute; inset:0; opacity:0; transition:opacity .25s ease; }
  .tc-quick-link:hover { transform:translateY(-3px); border-color:rgba(255,255,255,0.15); }
  .tc-quick-link:hover::before { opacity:1; }
`;

function getDefaultTerm() {
  const now = new Date(); const month = now.getMonth()+1; const year = now.getFullYear();
  const semester = month>=6&&month<=10?"FIRST":"SECOND";
  return { semester, schoolYear:`${year}-${year+1}` };
}
const { semester: SEMESTER, schoolYear: SCHOOL_YEAR } = getDefaultTerm();

const QUICK_LINKS = [
  { to:"/dean/assignments",  icon:"📋", label:"Manage Subject Assignments", color:"#3B82F6" },
  { to:"/dean/preferences",  icon:"✅", label:"Review Teacher Preferences",  color:"#22C55E" },
  { to:"/dean/generate",     icon:"⚡", label:"Generate Schedule",            color:"#8B5CF6" },
  { to:"/dean/subjects",     icon:"📚", label:"Manage Subjects",              color:"#06B6D4" },
  { to:"/dean/curriculum",   icon:"🗂️",  label:"Import Curriculum",            color:"#F59E0B" },
  { to:"/dean/irregular",    icon:"👤", label:"Irregular Students",           color:"#EC4899" },
];

export default function DeanDashboard() {
  const { user } = useAuth();
  const [assignments,      setAssignments]      = useState([]);
  const [pending,          setPending]          = useState([]);
  const [pendingIrregular, setPendingIrregular] = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [courses,          setCourses]          = useState([]);
  const [sectionForm, setSectionForm] = useState({ courseId:"", yearLevel:1, sectionCount:1 });
  const [sectionSaving, setSectionSaving] = useState(false);
  const [sectionMsg,    setSectionMsg]    = useState("");

  useEffect(() => {
    Promise.all([
      api.get(`/dean/assignments?semester=${SEMESTER}&schoolYear=${SCHOOL_YEAR}`),
      api.get(`/dean/preferences?semester=${SEMESTER}&schoolYear=${SCHOOL_YEAR}`),
      api.get(`/dean/my-courses`),
      api.get(`/students/pending-irregular`),
    ]).then(([aRes,pRes,cRes,iRes]) => {
      setAssignments(aRes.data?.data??[]);
      setPending((pRes.data?.data??[]).filter(p=>p.status==="PENDING"));
      setPendingIrregular(iRes.data?.data??[]);
      const courseList = cRes.data?.data??[];
      setCourses(courseList);
      if (courseList.length>0) setSectionForm(f=>({...f,courseId:courseList[0].id}));
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, []);

  const saveSectionConfig = async () => {
    if (!sectionForm.courseId) return;
    setSectionSaving(true); setSectionMsg("");
    try {
      await api.post("/sections/config",{
        courseId:Number(sectionForm.courseId), yearLevel:Number(sectionForm.yearLevel),
        sectionCount:Number(sectionForm.sectionCount), semester:SEMESTER, schoolYear:SCHOOL_YEAR,
      });
      setSectionMsg(`✓ ${sectionForm.sectionCount} section(s) created for Year ${sectionForm.yearLevel}`);
    } catch(e) { setSectionMsg("✗ "+(e.response?.data?.message??"Failed to save")); }
    finally { setSectionSaving(false); }
  };

  const finalized = assignments.filter(a=>a.finalized).length;
  const semLabel = SEMESTER==="FIRST"?"1st":SEMESTER==="SECOND"?"2nd":"Summer";

  return (
    <div style={{ minHeight:"100vh", background:"#060D1A", color:"#F1F5F9", fontFamily:"'DM Sans',sans-serif", padding:"2rem 2.5rem" }}>
      <style>{STYLES}</style>

      {/* Ambient blobs */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-10%", left:"30%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(34,197,94,0.07) 0%,transparent 70%)", filter:"blur(60px)", animation:"pulse-glow 8s ease infinite" }} />
        <div style={{ position:"absolute", bottom:"5%", right:"-5%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(139,92,246,0.05) 0%,transparent 70%)", filter:"blur(60px)", animation:"pulse-glow 11s ease infinite 3s" }} />
      </div>

      <div style={{ maxWidth:1000, margin:"0 auto", position:"relative", zIndex:1 }}>

        {/* Header */}
        <div style={{ marginBottom:32, animation:"slideUp .5s ease both" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#22C55E", boxShadow:"0 0 8px #22C55E" }} />
            <span style={{ fontSize:11, fontWeight:700, color:"#22C55E", letterSpacing:".12em", textTransform:"uppercase", fontFamily:"'DM Mono',monospace" }}>Dean Portal</span>
          </div>
          <h1 style={{ fontSize:"2rem", fontWeight:800, color:"#fff", letterSpacing:"-.03em", fontFamily:"'Sora',sans-serif" }}>
            Welcome back{user?.fullName?`, ${user.fullName.split(" ")[0]}`:""}
          </h1>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:14, marginTop:4 }}>
            {user?.departmentName} · {semLabel} Semester {SCHOOL_YEAR}
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:28, animation:"slideUp .5s ease .08s both" }}>
          {[
            { label:"Total Assignments",  value:loading?"…":assignments.length,       color:"#3B82F6", glow:"rgba(59,130,246,0.15)" },
            { label:"Finalized",          value:loading?"…":finalized,                color:"#22C55E", glow:"rgba(34,197,94,0.15)" },
            { label:"Pending Preferences",value:loading?"…":pending.length,           color:"#F59E0B", glow:"rgba(245,158,11,0.12)" },
            { label:"Pending Irregular",  value:loading?"…":pendingIrregular.length,  color:"#EC4899", glow:"rgba(236,72,153,0.12)" },
          ].map((s,i)=>(
            <div key={s.label} className="tc-stat-card" style={{ boxShadow:s.value&&s.value!=="…"&&Number(s.value)>0?`0 0 24px ${s.glow}`:"none" }}>
              <div style={{ fontSize:32, fontWeight:800, color:s.color, fontFamily:"'Sora',sans-serif", letterSpacing:"-.03em", lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:6, fontWeight:600, textTransform:"uppercase", letterSpacing:".08em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Section Setup */}
        <div className="tc-card" style={{ padding:"22px 24px", marginBottom:28, animation:"slideUp .5s ease .14s both" }}>
          <h2 style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:4, fontFamily:"'Sora',sans-serif" }}>Section Setup</h2>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:18 }}>Configure the number of sections per year level for this term.</p>

          <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"flex-end" }}>
            {courses.length>1 && (
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)", display:"block", marginBottom:5, letterSpacing:".08em", textTransform:"uppercase" }}>Course</label>
                <select className="tc-select" value={sectionForm.courseId} onChange={e=>setSectionForm(f=>({...f,courseId:e.target.value}))}>
                  {courses.map(c=><option key={c.id} value={c.id}>{c.code}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)", display:"block", marginBottom:5, letterSpacing:".08em", textTransform:"uppercase" }}>Year Level</label>
              <select className="tc-select" value={sectionForm.yearLevel} onChange={e=>setSectionForm(f=>({...f,yearLevel:e.target.value}))}>
                {[1,2,3,4].map(y=><option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)", display:"block", marginBottom:5, letterSpacing:".08em", textTransform:"uppercase" }}>No. of Sections</label>
              <input type="number" className="tc-input" min={1} max={10} value={sectionForm.sectionCount}
                onChange={e=>setSectionForm(f=>({...f,sectionCount:e.target.value}))} style={{ width:90 }} />
            </div>
            <button className="tc-btn-primary" onClick={saveSectionConfig} disabled={sectionSaving}>
              {sectionSaving?"Saving…":"Save & Create Sections"}
            </button>
          </div>

          {sectionMsg && (
            <p style={{ fontSize:12, marginTop:12, color:sectionMsg.startsWith("✓")?"#4ADE80":"#f87171", fontFamily:"'DM Mono',monospace" }}>
              {sectionMsg}
            </p>
          )}
        </div>

        {/* Quick links */}
        <div style={{ animation:"slideUp .5s ease .2s both" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.3)", letterSpacing:".12em", textTransform:"uppercase", marginBottom:14, fontFamily:"'DM Mono',monospace" }}>Quick Access</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
            {QUICK_LINKS.map((l,i)=>(
              <Link key={l.to} to={l.to} className="tc-quick-link" style={{ animationDelay:`${.22+i*.06}s`, animation:"slideUp .4s ease both" }}>
                {/* Glow accent */}
                <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${l.color}80,transparent)`, borderRadius:"16px 16px 0 0" }} />
                <div style={{ fontSize:26, marginBottom:10 }}>{l.icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9", letterSpacing:"-.01em", fontFamily:"'Sora',sans-serif", lineHeight:1.3 }}>{l.label}</div>
                <div style={{ fontSize:11, color:l.color, marginTop:8, fontWeight:700, letterSpacing:".04em" }}>→ Open</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
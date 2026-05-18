import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import useSchedule from "../../hooks/useSchedule";
import { Link } from "react-router-dom";

const DAY_ORDER = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const DAY_SHORT = {MONDAY:"Mon",TUESDAY:"Tue",WEDNESDAY:"Wed",THURSDAY:"Thu",FRIDAY:"Fri",SATURDAY:"Sat"};

function getDefaultTerm() {
  const now=new Date(), month=now.getMonth()+1, year=now.getFullYear();
  const semester=month>=6&&month<=10?"FIRST":month>=11||month<=3?"SECOND":"FIRST";
  return {semester,schoolYear:`${year}-${year+1}`};
}

function fmt12(time24) {
  if(!time24) return "";
  const [h,m]=time24.split(":").map(Number);
  return `${(h%12)||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`;
}

const SESSION_STYLE = {
  LECTURE:    {color:"#3B82F6",bg:"rgba(59,130,246,.1)",  border:"rgba(59,130,246,.25)", label:"LEC"},
  LABORATORY: {color:"#22C55E",bg:"rgba(34,197,94,.1)",   border:"rgba(34,197,94,.25)",  label:"LAB"},
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html { -webkit-text-size-adjust:100%; }

  @keyframes pulse-glow { 0%,100%{opacity:.6} 50%{opacity:1} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

  .dash-page {
    max-width:1100px; margin:0 auto;
    padding:20px 16px 64px;
    position:relative; z-index:1;
    animation:fadeIn .4s ease;
  }
  @media (min-width:480px) { .dash-page { padding:28px 20px 64px; } }
  @media (min-width:768px) { .dash-page { padding:36px 32px 64px; } }
  @media (min-width:1024px){ .dash-page { padding:44px 40px 64px; } }

  /* Stat cards */
  .stat-cards {
    display:grid;
    grid-template-columns:repeat(2,1fr);
    gap:10px; margin-bottom:20px;
  }
  @media (min-width:640px) { .stat-cards { gap:12px; margin-bottom:24px; } }
  @media (min-width:768px) { .stat-cards { grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:28px; } }

  /* Main grid */
  .dash-grid {
    display:grid;
    grid-template-columns:1fr;
    gap:14px;
  }
  @media (min-width:900px) {
    .dash-grid { grid-template-columns:1fr 290px; gap:16px; align-items:start; }
  }
  @media (min-width:1024px) {
    .dash-grid { grid-template-columns:1fr 310px; gap:20px; }
  }

  .dash-sidebar { display:flex; flex-direction:column; gap:12px; }

  /* Card base */
  .dash-card {
    background:rgba(255,255,255,.025);
    border:1px solid rgba(255,255,255,.08);
    border-radius:16px; padding:18px 16px;
  }
  @media (min-width:640px) { .dash-card { padding:20px 20px; border-radius:18px; } }

  /* Profile rows */
  .profile-row {
    display:flex; justify-content:space-between; align-items:flex-start;
    padding:8px 0; border-bottom:1px solid rgba(255,255,255,.05);
    font-size:13px; gap:8px;
  }
  .profile-row:last-child { border-bottom:none; }
  .profile-key { color:rgba(255,255,255,.35); white-space:nowrap; flex-shrink:0; font-size:12px; }
  .profile-val { color:#F1F5F9; font-weight:500; text-align:right; word-break:break-word; font-size:12px; }

  /* Schedule card */
  .sched-card {
    background:var(--bg); border:1px solid var(--border);
    border-radius:12px; padding:14px 16px;
    margin-bottom:10px; position:relative; overflow:hidden;
  }
  .sched-card:last-child { margin-bottom:0; }

  /* Quick link */
  .nav-link {
    display:flex; align-items:center; gap:10px;
    padding:11px 14px; border-radius:10px;
    text-decoration:none; font-size:13px; font-weight:600;
    margin-bottom:8px; transition:all .2s;
    font-family:'DM Sans',sans-serif;
    touch-action:manipulation; -webkit-tap-highlight-color:transparent;
  }
  .nav-link:last-child { margin-bottom:0; }
  .nav-link:hover { opacity:.85; transform:translateX(2px); }

  /* Section label */
  .dash-section-label {
    font-size:10px; font-weight:700; color:rgba(255,255,255,.3);
    letter-spacing:.1em; text-transform:uppercase;
    font-family:'DM Mono',monospace; margin-bottom:12px;
  }

  @media (max-width:360px) {
    .stat-cards { grid-template-columns:1fr; }
    .dash-card { padding:16px 14px; border-radius:14px; }
  }
`;

function StatCard({label,value,icon,color}) {
  return (
    <div style={{
      background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.08)",
      borderRadius:14, padding:"16px 16px",
      position:"relative", overflow:"hidden",
    }}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${color}90,transparent)`}}/>
      <div style={{
        width:32,height:32,borderRadius:8,
        background:color+"18",border:`1px solid ${color}30`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:14,marginBottom:10,
      }}>{icon}</div>
      <div style={{fontFamily:"'Sora',sans-serif",fontSize:"clamp(20px,5vw,28px)",fontWeight:800,color:"#fff",lineHeight:1,letterSpacing:"-.03em",marginBottom:4}}>
        {value}
      </div>
      <div style={{fontSize:"clamp(10px,2.5vw,12px)",color:"rgba(255,255,255,.4)",fontWeight:500,lineHeight:1.3}}>
        {label}
      </div>
    </div>
  );
}

function ScheduleCard({entry}) {
  const s = SESSION_STYLE[entry.sessionType]??SESSION_STYLE.LECTURE;
  return (
    <div className="sched-card" style={{"--bg":s.bg,"--border":s.border}}>
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:s.color}}/>
      <div style={{paddingLeft:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
          <span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:"clamp(12px,3vw,13px)",color:s.color}}>
            {entry.subjectCode}
          </span>
          <span style={{
            fontSize:9,fontWeight:700,color:s.color,
            background:s.border,borderRadius:4,padding:"2px 6px",
            letterSpacing:".08em",fontFamily:"'DM Mono',monospace",
            border:`1px solid ${s.border}`,
          }}>{s.label}</span>
        </div>
        <div style={{fontSize:"clamp(12px,3vw,13px)",color:"#F1F5F9",fontWeight:500,marginBottom:6,lineHeight:1.4}}>
          {entry.subjectName}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px 12px",fontSize:"clamp(11px,2.5vw,12px)",color:"rgba(255,255,255,.4)"}}>
          <span>👤 {entry.teacherName}</span>
          <span>🚪 {entry.roomName||entry.roomNumber}</span>
          <span>🏫 {entry.campusCode}</span>
        </div>
        <div style={{marginTop:8,fontSize:"clamp(11px,2.5vw,12px)",color:s.color,fontWeight:600,fontFamily:"'DM Mono',monospace"}}>
          {DAY_SHORT[entry.day1]} · {fmt12(entry.startTime1)}–{fmt12(entry.endTime1)}
          {entry.day2&&<> &nbsp;·&nbsp; {DAY_SHORT[entry.day2]} · {fmt12(entry.startTime2)}–{fmt12(entry.endTime2)}</>}
        </div>
      </div>
    </div>
  );
}

function TodaySchedule({schedules}) {
  const today=new Date().toLocaleDateString("en-US",{weekday:"long"}).toUpperCase();
  const todays=[...schedules.filter(s=>s.day1===today||s.day2===today)]
    .sort((a,b)=>(a.startTime1||"").localeCompare(b.startTime1||""));
  if(todays.length===0) return (
    <div style={{textAlign:"center",padding:"32px 0",color:"rgba(255,255,255,.3)"}}>
      <div style={{fontSize:32,marginBottom:8}}>🎉</div>
      <div style={{fontWeight:600,color:"rgba(255,255,255,.5)",fontSize:14}}>No classes today!</div>
      <div style={{fontSize:12,marginTop:5,color:"rgba(255,255,255,.25)"}}>Enjoy your free day.</div>
    </div>
  );
  return todays.map(s=><ScheduleCard key={s.id} entry={s}/>);
}

export default function StudentDashboard() {
  const {user}=useAuth();
  const {schedules,loading,error,fetchMySchedule}=useSchedule();
  const {semester,schoolYear}=getDefaultTerm();

  useEffect(()=>{
    fetchMySchedule(semester,schoolYear,user?.sectionId??null,{
      courseId:user?.courseId,yearLevel:user?.yearLevel,section:user?.section,
    });
  },[semester,schoolYear,user?.sectionId]);

  const uniqueSubjects=new Set(schedules.map(s=>s.subjectId)).size;
  const lectures=schedules.filter(s=>s.sessionType==="LECTURE").length;
  const labs=schedules.filter(s=>s.sessionType==="LABORATORY").length;
  const totalUnits=schedules.reduce((sum,s)=>sum+(s.units||3),0);
  const semLabel=semester==="FIRST"?"1st":semester==="SECOND"?"2nd":"Summer";

  return (
    <div style={{minHeight:"100vh",background:"#060D1A",color:"#fff",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{STYLES}</style>

      {/* Ambient */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-5%",left:"25%",width:"min(600px,80vw)",height:"min(600px,80vw)",borderRadius:"50%",background:"radial-gradient(circle,rgba(34,197,94,.07) 0%,transparent 70%)",filter:"blur(60px)",animation:"pulse-glow 8s ease infinite"}}/>
        <div style={{position:"absolute",bottom:"20%",right:"0%",width:"min(400px,60vw)",height:"min(400px,60vw)",borderRadius:"50%",background:"radial-gradient(circle,rgba(59,130,246,.05) 0%,transparent 70%)",filter:"blur(60px)",animation:"pulse-glow 10s ease infinite 2s"}}/>
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)",backgroundSize:"60px 60px",maskImage:"radial-gradient(ellipse at 50% 20%,black 25%,transparent 75%)",WebkitMaskImage:"radial-gradient(ellipse at 50% 20%,black 25%,transparent 75%)"}}/>
      </div>

      <div className="dash-page">

        {/* Header */}
        <div style={{marginBottom:20}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.25)",borderRadius:100,padding:"4px 12px",marginBottom:12}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#22C55E",display:"inline-block",animation:"blink 2s ease infinite"}}/>
            <span style={{fontSize:"clamp(9px,2.5vw,10px)",fontWeight:700,color:"#4ADE80",letterSpacing:".1em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>
              Student Portal · {semLabel} Sem {schoolYear}
            </span>
          </div>
          <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:"clamp(1.4rem,6vw,2.2rem)",fontWeight:800,letterSpacing:"-.03em",color:"#fff",marginBottom:6,lineHeight:1.15}}>
            Welcome back, {user?.fullName?.split(" ")[0]??"Student"}.
          </h1>
          <p style={{color:"rgba(255,255,255,.4)",fontSize:"clamp(12px,3vw,14px)",lineHeight:1.65}}>
            {user?.courseCode} · Year {user?.yearLevel}
            {user?.isIrregular?" · Irregular":user?.section?` · Section ${user.section}`:""}
          </p>
        </div>

        {/* Error */}
        {error&&(
          <div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.25)",borderRadius:10,padding:"11px 14px",marginBottom:18,color:"#FCA5A5",fontSize:13,display:"flex",gap:8,alignItems:"flex-start",lineHeight:1.5}}>
            ⚠️ {error}
          </div>
        )}

        {/* Stats */}
        <div className="stat-cards">
          <StatCard label="Subjects"   value={loading?"…":uniqueSubjects} icon="📚" color="#3B82F6"/>
          <StatCard label="Lectures"   value={loading?"…":lectures}       icon="🎓" color="#8B5CF6"/>
          <StatCard label="Lab Classes" value={loading?"…":labs}          icon="🔬" color="#22C55E"/>
          <StatCard label="Total Units" value={loading?"…":totalUnits}    icon="⭐" color="#F59E0B"/>
        </div>

        {/* Two-col */}
        <div className="dash-grid">

          {/* Today's Classes */}
          <div className="dash-card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,gap:10}}>
              <div>
                <div className="dash-section-label">Today</div>
                <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:"clamp(15px,4vw,18px)",fontWeight:700,color:"#fff",letterSpacing:"-.02em"}}>
                  Today's Classes
                </h2>
              </div>
              <Link to="/student/timetable" style={{fontSize:12,color:"#4ADE80",textDecoration:"none",fontWeight:700,fontFamily:"'DM Mono',monospace",letterSpacing:".03em",whiteSpace:"nowrap",flexShrink:0}}>
                Full Timetable →
              </Link>
            </div>
            {loading
              ? <div style={{color:"rgba(255,255,255,.25)",fontSize:13,fontFamily:"'DM Mono',monospace",padding:"16px 0"}}>Loading…</div>
              : <TodaySchedule schedules={schedules}/>
            }
          </div>

          {/* Sidebar */}
          <div className="dash-sidebar">

            {/* Profile */}
            <div className="dash-card">
              <div className="dash-section-label">My Profile</div>
              {[
                ["School ID",  user?.schoolId],
                ["Email",      user?.email],
                ["Course",     user?.courseName||user?.courseCode],
                ["Year",       user?.yearLevel?`Year ${user.yearLevel}`:"—"],
                ["Section",    user?.isIrregular?"Irregular":(user?.section||"—")],
                ["Department", user?.departmentName],
              ].map(([label,val])=>(
                <div key={label} className="profile-row">
                  <span className="profile-key">{label}</span>
                  <span className="profile-val" style={{fontFamily:label==="School ID"||label==="Email"?"'DM Mono',monospace":"'DM Sans',sans-serif"}}>
                    {val||"—"}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div className="dash-card">
              <div className="dash-section-label">Quick Links</div>
              <Link to="/student/timetable" className="nav-link"
                style={{background:"rgba(59,130,246,.1)",border:"1px solid rgba(59,130,246,.2)",color:"#93C5FD"}}>
                <span style={{fontSize:16}}>📅</span>
                <span>View Full Timetable</span>
              </Link>
              {user?.isIrregular&&(
                <Link to="/student/enrollment" className="nav-link"
                  style={{background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.2)",color:"#FCD34D"}}>
                  <span style={{fontSize:16}}>📋</span>
                  <span>Back Subject Enrollment</span>
                </Link>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
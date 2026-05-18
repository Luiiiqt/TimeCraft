import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName:"", middleName:"", lastName:"",
    schoolId:"", email:"", password:"",
    courseId:"", yearLevel:"1", isIrregular:false,
  });
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetch("/api/v1/courses/public")
      .then(r=>r.json())
      .then(data=>setCourses(data?.data??data??[]))
      .catch(()=>{});
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [focused, setFocused] = useState(null);
  const [showPw, setShowPw] = useState(false);

  const handleChange = e => {
    const {name,value,type,checked} = e.target;
    setForm(f=>({...f,[name]:type==="checkbox"?checked:value}));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        fullName:`${form.firstName} ${form.middleName} ${form.lastName}`.replace(/\s+/g," ").trim(),
        schoolId:form.schoolId, email:form.email, password:form.password,
        courseId:Number(form.courseId)||undefined,
        yearLevel:Number(form.yearLevel), userType:"STUDENT",
      });
      setSuccess(true);
      setTimeout(()=>navigate("/login"),2000);
    } catch(err) {
      setError(err?.response?.data?.message??"Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputProps = (name, extra={}) => ({
    className:"tc-input",
    name, value:form[name],
    onChange:handleChange,
    onFocus:()=>setFocused(name),
    onBlur:()=>setFocused(null),
    style:focused===name?focusStyle:{},
    ...extra,
  });

  return (
    <div style={shell}>
      <style>{STYLES}</style>

      <div style={ambientWrap}>
        <div style={blob1}/><div style={blob2}/><div style={blob3}/>
        <div style={gridPattern}/>
      </div>

      {/* Left panel */}
      <div className="tc-left-panel">
        <div style={brandRow}>
          <div style={logoBox}>⬡</div>
          <div>
            <div style={brandName}>TimeCraft</div>
            <div style={brandSub}>Lorma College</div>
          </div>
        </div>

        <div style={stepsWrap}>
          <div style={stepsTitle}>Get started in minutes</div>
          {[
            {icon:"📝",step:"01",title:"Create your account",    desc:"Fill in your student details and school credentials."},
            {icon:"✅",step:"02",title:"Account verification",   desc:"Your enrollment is reviewed and activated by admin."},
            {icon:"📅",step:"03",title:"View your timetable",    desc:"See your conflict-free schedule the moment it's published."},
          ].map((s,i)=>(
            <div key={i} style={stepRow}>
              <div style={stepNumWrap}>
                <div style={stepIconBox}>{s.icon}</div>
                {i<2&&<div style={stepConnector}/>}
              </div>
              <div style={stepContent}>
                <div style={stepNum}>{s.step}</div>
                <div style={stepTitle2}>{s.title}</div>
                <div style={stepDesc}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={leftBottom}>
          <div style={pillsCol}>
            {[
              {icon:"🎓",label:"Students",             color:"#22C55E"},
              {icon:"🏫",label:"All Courses",          color:"#3B82F6"},
              {icon:"📋",label:"Regular & Irregular",  color:"#8B5CF6"},
            ].map(p=>(
              <div key={p.label} style={{...tagPill,borderColor:p.color+"30",color:p.color}}>
                {p.icon} <span>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div style={rightPanel}>
        <div style={formWrap}>

          {/* Mobile brand */}
          <div className="tc-mobile-brand">
            <div style={logoBox}>⬡</div>
            <div>
              <div style={brandName}>TimeCraft</div>
              <div style={brandSub}>Lorma College</div>
            </div>
          </div>

          <div style={{marginBottom:22}}>
            <div style={eyebrow}><span style={eyebrowDot}/><span>Student Registration</span></div>
            <h1 style={formTitle}>Create your<br/>account</h1>
            <p style={formSub}>All fields are required to complete registration.</p>
          </div>

          {error&&<div className="tc-alert tc-alert-error"><span>⚠</span> {error}</div>}
          {success&&<div className="tc-alert tc-alert-success"><span>✓</span> Account created! Redirecting to login…</div>}

          <form onSubmit={handleSubmit}>

            {/* Name row */}
            <div className="tc-row-2">
              <div className="tc-field">
                <label className="tc-label">First Name</label>
                <input {...inputProps("firstName")} placeholder="Juan" required/>
              </div>
              <div className="tc-field">
                <label className="tc-label">Last Name</label>
                <input {...inputProps("lastName")} placeholder="dela Cruz" required/>
              </div>
            </div>

            <div className="tc-field">
              <label className="tc-label">Middle Name <span style={{opacity:.5,fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional)</span></label>
              <input {...inputProps("middleName")} placeholder="Santos"/>
            </div>

            <div className="tc-field">
              <label className="tc-label">School ID</label>
              <input {...inputProps("schoolId")} placeholder="2024-0001" required/>
            </div>

            <div className="tc-field">
              <label className="tc-label">Email Address</label>
              <input {...inputProps("email")} type="email" placeholder="student@lorma.edu" required/>
            </div>

            <div className="tc-field">
              <label className="tc-label">Password</label>
              <div style={{position:"relative"}}>
                <input
                  {...inputProps("password")}
                  type={showPw?"text":"password"}
                  placeholder="Min. 8 characters"
                  required minLength={8}
                  style={{...(focused==="password"?focusStyle:{}),paddingRight:44}}
                />
                <button type="button" onClick={()=>setShowPw(p=>!p)} style={eyeBtn}>
                  {showPw?"🙈":"👁"}
                </button>
              </div>
            </div>

            <div className="tc-field">
              <label className="tc-label">Course</label>
              <select className="tc-input" name="courseId" value={form.courseId}
                onChange={handleChange}
                onFocus={()=>setFocused("courseId")} onBlur={()=>setFocused(null)}
                style={focused==="courseId"?focusStyle:{}} required
              >
                <option value="">Select your course…</option>
                {courses.map(c=><option key={c.id} value={c.id}>{c.name??c.code}</option>)}
              </select>
            </div>

            <div className="tc-field">
              <label className="tc-label">Year Level</label>
              <select className="tc-input" name="yearLevel" value={form.yearLevel}
                onChange={handleChange}
                onFocus={()=>setFocused("yearLevel")} onBlur={()=>setFocused(null)}
                style={focused==="yearLevel"?focusStyle:{}}
              >
                {[1,2,3,4,5].map(y=><option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>

            {/* Irregular checkbox */}
            <div style={{margin:"4px 0 18px"}}>
              <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                <div style={{
                  width:20,height:20,borderRadius:5,flexShrink:0,cursor:"pointer",
                  background:form.isIrregular?"#22C55E":"rgba(255,255,255,.05)",
                  border:`1.5px solid ${form.isIrregular?"#22C55E":"rgba(255,255,255,.15)"}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  transition:"all .15s",
                }} onClick={()=>setForm(f=>({...f,isIrregular:!f.isIrregular}))}>
                  {form.isIrregular&&<span style={{fontSize:10,color:"#fff",fontWeight:900,lineHeight:1}}>✓</span>}
                </div>
                <span style={{fontSize:13,color:"rgba(255,255,255,.4)",lineHeight:1.5}}>
                  I am an <strong style={{color:"rgba(255,255,255,.7)"}}>irregular student</strong> — no fixed section
                </span>
              </label>
            </div>

            <button type="submit" disabled={loading||success} className="tc-btn">
              {loading
                ? <><span className="tc-spinner"/> Creating account…</>
                : success
                ? <><span>✓</span> Account Created!</>
                : <>Create Account <span style={{marginLeft:4}}>→</span></>
              }
            </button>
          </form>

          <p style={formFooter}>
            Already have an account?{" "}
            <Link to="/login" style={loginLink}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html { -webkit-text-size-adjust:100%; }

  @keyframes tcSlideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
  @keyframes tcPulse   { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
  @keyframes tcSpin    { to{transform:rotate(360deg)} }
  @keyframes tcShake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }

  .tc-mobile-brand {
    display:flex; align-items:center; gap:12px;
    margin-bottom:24px; padding-bottom:20px;
    border-bottom:1px solid rgba(255,255,255,.07);
  }

  .tc-left-panel {
    display:none;
    position:relative; z-index:1;
    width:360px; flex-shrink:0;
    flex-direction:column;
    padding:40px 32px;
    border-right:1px solid rgba(255,255,255,.05);
  }

  @media (min-width:1024px) {
    .tc-left-panel { display:flex; }
    .tc-mobile-brand { display:none !important; }
  }

  .tc-field { margin-bottom:14px; }

  .tc-label {
    display:block; font-size:10px; font-weight:700;
    color:rgba(255,255,255,.3); margin-bottom:6px;
    letter-spacing:.1em; text-transform:uppercase; font-family:'DM Mono',monospace;
  }

  .tc-input {
    width:100%; padding:11px 13px;
    background:rgba(255,255,255,.04);
    border:1.5px solid rgba(255,255,255,.09);
    border-radius:9px; font-size:15px; color:#fff; outline:none;
    font-family:'DM Sans',sans-serif;
    transition:border-color .2s,background .2s,box-shadow .2s;
    -webkit-appearance:none; appearance:none;
  }
  .tc-input::placeholder { color:rgba(255,255,255,.18); }
  .tc-input option { background:#0f1a2e; color:#fff; }

  .tc-row-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  @media (max-width:400px) { .tc-row-2 { grid-template-columns:1fr; gap:0; } }

  .tc-btn {
    width:100%; padding:14px; border:none; border-radius:11px;
    background:linear-gradient(135deg,#22C55E,#16A34A);
    color:#fff; font-size:15px; font-weight:700;
    cursor:pointer; font-family:'DM Sans',sans-serif;
    display:flex; align-items:center; justify-content:center; gap:8px;
    box-shadow:0 4px 24px rgba(34,197,94,.28); transition:all .2s; margin-top:6px;
    min-height:50px; touch-action:manipulation; -webkit-tap-highlight-color:transparent;
  }
  .tc-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 36px rgba(34,197,94,.42); }
  .tc-btn:active:not(:disabled) { transform:translateY(0); }
  .tc-btn:disabled { opacity:.55; cursor:not-allowed; }

  .tc-alert {
    padding:11px 14px; border-radius:9px; font-size:13px; margin-bottom:16px;
    display:flex; align-items:flex-start; gap:8px; line-height:1.5;
    font-family:'DM Sans',sans-serif;
  }
  .tc-alert-error  { background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.22); color:#FCA5A5; animation:tcShake .4s ease; }
  .tc-alert-success{ background:rgba(34,197,94,.1);  border:1px solid rgba(34,197,94,.22);  color:#86EFAC; }

  .tc-spinner {
    width:14px; height:14px; border:2px solid rgba(255,255,255,.3);
    border-top-color:#fff; border-radius:50%; animation:tcSpin .7s linear infinite;
    display:inline-block; flex-shrink:0;
  }

  @media (max-width:400px) {
    .tc-label { font-size:9px; }
    .tc-input { font-size:16px !important; padding:12px 13px !important; }
    .tc-btn   { font-size:15px; padding:14px; }
  }
`;

const focusStyle = {
  borderColor:"rgba(34,197,94,.5)",
  background:"rgba(34,197,94,.04)",
  boxShadow:"0 0 0 3px rgba(34,197,94,.08)",
};

const shell = {
  minHeight:"100vh", minHeight:"100dvh",
  display:"flex", background:"#060D1A",
  fontFamily:"'DM Sans',sans-serif", color:"#fff", overflow:"hidden",
};
const ambientWrap = { position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden" };
const mkBlob = (t,l,b,r,c,delay) => ({
  position:"absolute",top:t,left:l,bottom:b,right:r,
  width:"min(500px,80vw)",height:"min(500px,80vw)",borderRadius:"50%",
  background:`radial-gradient(circle,${c} 0%,transparent 70%)`,
  filter:"blur(60px)",animation:`tcPulse ${8+delay*2}s ease infinite ${delay}s`,
});
const blob1 = mkBlob("-5%","5%",undefined,undefined,"rgba(34,197,94,.08)",0);
const blob2 = mkBlob(undefined,"30%","0%",undefined,"rgba(59,130,246,.06)",2);
const blob3 = mkBlob("40%",undefined,undefined,"0%","rgba(139,92,246,.05)",4);
const gridPattern = {
  position:"absolute",inset:0,
  backgroundImage:"linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)",
  backgroundSize:"60px 60px",
  maskImage:"radial-gradient(ellipse at 30% 50%,black 20%,transparent 75%)",
  WebkitMaskImage:"radial-gradient(ellipse at 30% 50%,black 20%,transparent 75%)",
};

// Left panel
const brandRow  = { display:"flex",alignItems:"center",gap:12,marginBottom:36 };
const logoBox   = { width:38,height:38,borderRadius:11,background:"linear-gradient(135deg,#22C55E,#16A34A)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 4px 16px rgba(34,197,94,.35)",flexShrink:0 };
const brandName = { fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:16,color:"#fff",letterSpacing:"-.02em" };
const brandSub  = { fontSize:9,color:"rgba(255,255,255,.28)",letterSpacing:".12em",textTransform:"uppercase" };
const stepsWrap  = { flex:1,display:"flex",flexDirection:"column",gap:0 };
const stepsTitle = { fontSize:11,fontWeight:700,color:"rgba(255,255,255,.3)",letterSpacing:".12em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:22 };
const stepRow    = { display:"flex",gap:14,alignItems:"flex-start" };
const stepNumWrap= { display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0 };
const stepIconBox= { width:34,height:34,borderRadius:9,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15 };
const stepConnector={ width:1,height:26,background:"rgba(255,255,255,.07)",margin:"4px 0" };
const stepContent= { paddingBottom:18 };
const stepNum   = { fontSize:9,fontWeight:700,color:"rgba(34,197,94,.5)",fontFamily:"'DM Mono',monospace",letterSpacing:".1em",marginBottom:2 };
const stepTitle2= { fontSize:13,fontWeight:700,color:"rgba(255,255,255,.85)",marginBottom:4,fontFamily:"'Sora',sans-serif" };
const stepDesc  = { fontSize:12,color:"rgba(255,255,255,.35)",lineHeight:1.65 };
const leftBottom= { marginTop:"auto",paddingTop:22 };
const pillsCol  = { display:"flex",flexDirection:"column",gap:8 };
const tagPill   = { display:"inline-flex",alignItems:"center",gap:8,padding:"7px 12px",borderRadius:8,background:"rgba(255,255,255,.02)",border:"1.5px solid",fontSize:12,fontWeight:600 };

// Right panel
const rightPanel = {
  flex:1, position:"relative", zIndex:1,
  display:"flex", alignItems:"flex-start", justifyContent:"center",
  padding:"clamp(24px,5vw,48px) clamp(16px,5vw,40px)",
  overflowY:"auto", WebkitOverflowScrolling:"touch",
};
const formWrap = {
  width:"100%", maxWidth:440,
  paddingTop:16, paddingBottom:48,
  animation:"tcSlideIn .5s ease .1s both",
};

const eyebrow = { display:"inline-flex",alignItems:"center",gap:8,background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.2)",borderRadius:100,padding:"5px 13px",marginBottom:14,fontSize:10,fontWeight:700,color:"#4ADE80",letterSpacing:".1em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace" };
const eyebrowDot = { width:6,height:6,borderRadius:"50%",background:"#22C55E",display:"inline-block" };
const formTitle = { fontFamily:"'Sora',sans-serif",fontSize:"clamp(22px,6vw,28px)",fontWeight:800,color:"#fff",letterSpacing:"-.03em",lineHeight:1.1,marginBottom:8 };
const formSub   = { fontSize:13,color:"rgba(255,255,255,.32)",lineHeight:1.65 };

const eyeBtn = {
  position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
  background:"none",border:"none",cursor:"pointer",
  fontSize:16,color:"rgba(255,255,255,.3)",padding:"4px",lineHeight:1,
  touchAction:"manipulation",WebkitTapHighlightColor:"transparent",
};
const formFooter = { marginTop:18,textAlign:"center",fontSize:13,color:"rgba(255,255,255,.3)" };
const loginLink  = { color:"#22C55E",fontWeight:700,textDecoration:"none" };
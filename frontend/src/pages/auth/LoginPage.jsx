import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const userData = await login(form.email, form.password);
      if (userData.role === "PROGRAM_HEAD") navigate("/program-head");
      else if (userData.role === "ADMIN") navigate("/admin");
      else if (userData.role === "TEACHER") navigate("/teacher");
      else navigate("/student");
    } catch (err) {
      setError(err?.response?.data?.message ?? "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={shell}>
      <style>{STYLES}</style>

      {/* Ambient */}
      <div style={ambientWrap}>
        <div style={blob1} />
        <div style={blob2} />
        <div style={blob3} />
        <div style={gridPattern} />
      </div>

      {/* Left panel — hidden below 1024px */}
      <div className="tc-left-panel">
        <div style={brandRow}>
          <div style={logoBox}>⬡</div>
          <div>
            <div style={brandName}>TimeCraft</div>
            <div style={brandSub}>Lorma College</div>
          </div>
        </div>

        <div style={previewCard}>
          <div style={previewHeader}>
            <div style={dots}>
              {["#FF5F57","#FFBD2E","#28C840"].map((c,i)=>(
                <div key={i} style={{width:9,height:9,borderRadius:"50%",background:c}} />
              ))}
            </div>
            <div style={previewTitle}>S.Y. 2025–2026 · 1ST SEM</div>
            <div style={liveBadge}>● LIVE</div>
          </div>
          <MiniGrid />
        </div>

        <div style={leftBottom}>
          <p style={tagline}>Intelligent scheduling for<br />modern academic institutions.</p>
          <div style={statsRow}>
            {[{v:"5+",l:"Departments"},{v:"100%",l:"Conflict-Free"},{v:"<3s",l:"Generation"}].map(s=>(
              <div key={s.l}>
                <div style={statVal}>{s.v}</div>
                <div style={statLabel}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div style={rightPanel}>
        <div style={formCard}>

          {/* Mobile-only brand */}
          <div className="tc-mobile-brand">
            <div style={logoBox}>⬡</div>
            <div>
              <div style={brandName}>TimeCraft</div>
              <div style={brandSub}>Lorma College</div>
            </div>
          </div>

          <div style={{ marginBottom:28 }}>
            <div style={eyebrow}><span style={eyebrowDot} /><span>Welcome back</span></div>
            <h1 style={formTitle}>Sign in to<br />your account</h1>
            <p style={formSub}>Enter your Lorma College credentials below.</p>
          </div>

          {error && (
            <div className="tc-error">
              <span style={{ fontSize:15 }}>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="tc-field">
              <label className="tc-label">Email address</label>
              <div style={{ position:"relative" }}>
                <span style={{ ...inputIcon, opacity:focused==="email"?1:.35 }}>✉</span>
                <input
                  className="tc-input"
                  type="email" name="email"
                  value={form.email} onChange={handleChange}
                  placeholder="you@lorma.edu"
                  onFocus={()=>setFocused("email")}
                  onBlur={()=>setFocused(null)}
                  style={focused==="email"?focusStyle:{}}
                  required autoFocus
                />
              </div>
            </div>

            <div className="tc-field">
              <label className="tc-label">Password</label>
              <div style={{ position:"relative" }}>
                <span style={{ ...inputIcon, opacity:focused==="password"?1:.35 }}>🔑</span>
                <input
                  className="tc-input"
                  type={showPw?"text":"password"} name="password"
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••"
                  onFocus={()=>setFocused("password")}
                  onBlur={()=>setFocused(null)}
                  style={{ ...(focused==="password"?focusStyle:{}), paddingRight:44 }}
                  required
                />
                <button type="button" onClick={()=>setShowPw(p=>!p)} style={eyeBtn}>
                  {showPw?"🙈":"👁"}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="tc-btn">
              {loading ? <><span className="tc-spinner" /> Signing in…</> : <>Sign In <span style={{marginLeft:4}}>→</span></>}
            </button>
          </form>

          <div style={divider}>
            <div style={dividerLine} />
            <span style={dividerText}>or</span>
            <div style={dividerLine} />
          </div>

          <div style={rolesGrid}>
            {[
              {icon:"🛡️",label:"Admin",  color:"#F59E0B"},
              {icon:"🎓",label:"Dean",   color:"#22C55E"},
              {icon:"👨‍🏫",label:"Teacher",color:"#EC4899"},
              {icon:"📚",label:"Student",color:"#06B6D4"},
            ].map(r=>(
              <div key={r.label} style={{ ...rolePill, borderColor:r.color+"30", color:r.color }}>
                <span style={{fontSize:20}}>{r.icon}</span>
                <span style={{fontSize:10,fontWeight:700,letterSpacing:".04em"}}>{r.label}</span>
              </div>
            ))}
          </div>

          <p style={formFooter}>
            Don't have an account?{" "}
            <Link to="/register" style={registerLink}>Create one →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Mini Grid ─────────────────────────────────────────────────────────────────
const MINI_SLOTS = [
  {day:0,row:0,span:2,code:"CS101",color:"#22C55E"},
  {day:1,row:0,span:2,code:"MATH2",color:"#3B82F6"},
  {day:2,row:0,span:2,code:"ENG01",color:"#F59E0B"},
  {day:3,row:0,span:2,code:"PE001",color:"#EC4899"},
  {day:4,row:0,span:2,code:"PHYS1",color:"#8B5CF6"},
  {day:0,row:2,span:2,code:"MATH2",color:"#3B82F6"},
  {day:1,row:2,span:2,code:"CS101",color:"#22C55E"},
  {day:3,row:2,span:2,code:"ENG01",color:"#F59E0B"},
  {day:4,row:2,span:2,code:"PE001",color:"#EC4899"},
  {day:2,row:4,span:2,code:"PHYS1",color:"#8B5CF6"},
  {day:0,row:4,span:2,code:"PE001",color:"#EC4899"},
];
const DAYS = ["M","T","W","Th","F"];

function MiniGrid() {
  return (
    <div style={{padding:"10px 12px 12px"}}>
      <div style={{display:"grid",gridTemplateColumns:"32px repeat(5,1fr)",gap:2,marginBottom:2}}>
        <div/>
        {DAYS.map(d=>(
          <div key={d} style={{textAlign:"center",fontSize:8,fontWeight:800,color:"rgba(255,255,255,.3)",letterSpacing:".1em",fontFamily:"'DM Mono',monospace"}}>{d}</div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"32px repeat(5,1fr)",gridTemplateRows:"repeat(6,18px)",gap:2}}>
        {[0,1,2,3,4,5].map(r=>(
          <div key={r} style={{gridColumn:1,gridRow:r+1,display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:4}}>
            {r%2===0&&<span style={{fontSize:7,color:"rgba(255,255,255,.2)",fontFamily:"'DM Mono',monospace"}}>{7+r/2}:30</span>}
          </div>
        ))}
        {Array.from({length:6}).map((_,r)=>Array.from({length:5}).map((_,d)=>(
          <div key={`${r}-${d}`} style={{gridColumn:d+2,gridRow:r+1,background:"rgba(255,255,255,.02)",borderRadius:3,border:"1px solid rgba(255,255,255,.03)"}}/>
        )))}
        {MINI_SLOTS.map((s,i)=>(
          <div key={i} style={{
            gridColumn:s.day+2,gridRow:`${s.row+1}/${s.row+s.span+1}`,
            background:s.color+"18",border:`1px solid ${s.color}50`,borderLeft:`2px solid ${s.color}`,
            borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",
            opacity:0,animation:`tcFadeUp .4s ease ${.2+i*.05}s forwards`,
          }}>
            <span style={{fontSize:7,fontWeight:800,color:s.color,fontFamily:"'DM Mono',monospace"}}>{s.code}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html { -webkit-text-size-adjust:100%; }

  @keyframes tcFadeUp { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
  @keyframes tcPulse  { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
  @keyframes tcSpin   { to{transform:rotate(360deg)} }
  @keyframes tcSlideIn{ from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
  @keyframes tcShake  { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }

  /* Mobile brand — shown only on small screens */
  .tc-mobile-brand {
    display:flex; align-items:center; gap:12px;
    margin-bottom:24px; padding-bottom:20px;
    border-bottom:1px solid rgba(255,255,255,.07);
  }

  /* Left panel */
  .tc-left-panel {
    display:none;
    position:relative; z-index:1;
    width:400px; flex-shrink:0;
    flex-direction:column;
    padding:40px 36px;
    border-right:1px solid rgba(255,255,255,.05);
    overflow:hidden;
  }
  @media (min-width:1024px) {
    .tc-left-panel { display:flex; }
    .tc-mobile-brand { display:none !important; }
  }

  .tc-field { margin-bottom:16px; }

  .tc-label {
    display:block; font-size:10px; font-weight:700;
    color:rgba(255,255,255,.35); margin-bottom:7px;
    letter-spacing:.1em; text-transform:uppercase; font-family:'DM Mono',monospace;
  }

  .tc-input {
    width:100%; padding:12px 14px 12px 38px;
    background:rgba(255,255,255,.04);
    border:1.5px solid rgba(255,255,255,.09);
    border-radius:10px; font-size:15px; color:#fff; outline:none;
    font-family:'DM Sans',sans-serif;
    transition:border-color .2s,background .2s,box-shadow .2s;
    -webkit-appearance:none; appearance:none;
  }
  .tc-input::placeholder { color:rgba(255,255,255,.2); }

  .tc-btn {
    width:100%; padding:14px; border:none; border-radius:11px;
    background:linear-gradient(135deg,#22C55E,#16A34A);
    color:#fff; font-size:15px; font-weight:700;
    cursor:pointer; font-family:'DM Sans',sans-serif;
    display:flex; align-items:center; justify-content:center; gap:8px;
    box-shadow:0 4px 24px rgba(34,197,94,.3); transition:all .2s; margin-top:8px;
    min-height:50px; touch-action:manipulation; -webkit-tap-highlight-color:transparent;
  }
  .tc-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 36px rgba(34,197,94,.45); }
  .tc-btn:active:not(:disabled) { transform:translateY(0); }
  .tc-btn:disabled { opacity:.5; cursor:not-allowed; }

  .tc-error {
    background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.25);
    border-radius:10px; padding:11px 14px; font-size:13px; color:#FCA5A5;
    margin-bottom:18px; display:flex; align-items:flex-start; gap:8px;
    animation:tcShake .4s ease; font-family:'DM Sans',sans-serif; line-height:1.5;
  }

  .tc-spinner {
    width:14px; height:14px; border:2px solid rgba(255,255,255,.3);
    border-top-color:#fff; border-radius:50%; animation:tcSpin .7s linear infinite;
    display:inline-block; flex-shrink:0;
  }

  @media (max-width:400px) {
    .tc-label { font-size:9px; }
    .tc-input { font-size:16px; }
  }
`;

const focusStyle = {
  borderColor:"rgba(34,197,94,.5)",
  background:"rgba(34,197,94,.04)",
  boxShadow:"0 0 0 3px rgba(34,197,94,.08)",
};

// Layout
const shell = {
  minHeight:"100vh", minHeight:"100dvh",
  display:"flex", background:"#060D1A",
  fontFamily:"'DM Sans',sans-serif", color:"#fff", overflow:"hidden",
};
const ambientWrap = { position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" };
const mkBlob = (top,left,bottom,right,w,h,color,delay) => ({
  position:"absolute", top, left, bottom, right,
  width:w, height:h, borderRadius:"50%",
  background:`radial-gradient(circle,${color} 0%,transparent 70%)`,
  filter:"blur(60px)", animation:`tcPulse ${8+delay*2}s ease infinite ${delay}s`,
});
const blob1 = mkBlob("-5%","5%",undefined,undefined,"min(500px,80vw)","min(500px,80vw)","rgba(34,197,94,.08)",0);
const blob2 = mkBlob(undefined,"30%","0%",undefined,"min(400px,60vw)","min(400px,60vw)","rgba(59,130,246,.06)",2);
const blob3 = mkBlob("40%",undefined,undefined,"0%","min(350px,55vw)","min(350px,55vw)","rgba(139,92,246,.05)",4);
const gridPattern = {
  position:"absolute",inset:0,
  backgroundImage:"linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px)",
  backgroundSize:"60px 60px",
  maskImage:"radial-gradient(ellipse at 30% 50%,black 20%,transparent 75%)",
  WebkitMaskImage:"radial-gradient(ellipse at 30% 50%,black 20%,transparent 75%)",
};

// Left panel internals
const brandRow = { display:"flex",alignItems:"center",gap:12,marginBottom:36 };
const logoBox = {
  width:38,height:38,borderRadius:11,flexShrink:0,
  background:"linear-gradient(135deg,#22C55E,#16A34A)",
  display:"flex",alignItems:"center",justifyContent:"center",
  fontSize:18,boxShadow:"0 4px 16px rgba(34,197,94,.35)",
};
const brandName = { fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:16,color:"#fff",letterSpacing:"-.02em" };
const brandSub  = { fontSize:9,color:"rgba(255,255,255,.3)",letterSpacing:".12em",textTransform:"uppercase" };
const previewCard = {
  background:"rgba(15,23,42,.85)",backdropFilter:"blur(20px)",
  borderRadius:16,border:"1px solid rgba(34,197,94,.15)",
  boxShadow:"0 32px 80px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.03) inset",
  overflow:"hidden",flex:1,
};
const previewHeader = { padding:"11px 14px",borderBottom:"1px solid rgba(255,255,255,.05)",display:"flex",alignItems:"center",gap:8 };
const dots = { display:"flex",gap:5 };
const previewTitle = { flex:1,textAlign:"center",fontSize:9,color:"rgba(255,255,255,.25)",fontFamily:"'DM Mono',monospace",letterSpacing:".1em" };
const liveBadge = { fontSize:9,color:"#22C55E",fontWeight:700,background:"rgba(34,197,94,.1)",padding:"2px 7px",borderRadius:4,border:"1px solid rgba(34,197,94,.25)",fontFamily:"'DM Mono',monospace" };
const leftBottom = { marginTop:24 };
const tagline = { fontSize:13,color:"rgba(255,255,255,.4)",lineHeight:1.75,marginBottom:20 };
const statsRow = { display:"flex",gap:28 };
const statVal   = { fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:800,color:"#fff",letterSpacing:"-.02em" };
const statLabel = { fontSize:10,color:"rgba(255,255,255,.3)",letterSpacing:".08em",textTransform:"uppercase",marginTop:3 };

// Right panel
const rightPanel = {
  flex:1, position:"relative", zIndex:1,
  display:"flex", alignItems:"flex-start", justifyContent:"center",
  padding:"clamp(24px,5vw,48px) clamp(16px,5vw,40px)",
  overflowY:"auto", WebkitOverflowScrolling:"touch",
};
const formCard = {
  width:"100%", maxWidth:420,
  paddingTop:16, paddingBottom:40,
  animation:"tcSlideIn .5s ease .1s both",
};

const eyebrow = {
  display:"inline-flex",alignItems:"center",gap:8,
  background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.2)",
  borderRadius:100,padding:"5px 13px",marginBottom:18,
  fontSize:11,fontWeight:700,color:"#4ADE80",
  letterSpacing:".08em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",
};
const eyebrowDot = { width:6,height:6,borderRadius:"50%",background:"#22C55E",display:"inline-block" };
const formTitle = {
  fontFamily:"'Sora',sans-serif",
  fontSize:"clamp(24px,6vw,32px)",
  fontWeight:800,color:"#fff",letterSpacing:"-.03em",lineHeight:1.1,marginBottom:10,
};
const formSub = { fontSize:14,color:"rgba(255,255,255,.35)",lineHeight:1.65 };

const inputIcon = {
  position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",
  fontSize:14,transition:"opacity .2s",pointerEvents:"none",userSelect:"none",
};
const eyeBtn = {
  position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
  background:"none",border:"none",cursor:"pointer",
  fontSize:15,color:"rgba(255,255,255,.3)",padding:"4px",lineHeight:1,
  touchAction:"manipulation",WebkitTapHighlightColor:"transparent",
};

const divider = { display:"flex",alignItems:"center",gap:12,margin:"22px 0" };
const dividerLine = { flex:1,height:1,background:"rgba(255,255,255,.07)" };
const dividerText = { fontSize:11,color:"rgba(255,255,255,.2)",fontFamily:"'DM Mono',monospace",letterSpacing:".08em" };

const rolesGrid = { display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:24 };
const rolePill = {
  display:"flex",flexDirection:"column",alignItems:"center",gap:6,
  padding:"12px 8px",background:"rgba(255,255,255,.025)",
  border:"1.5px solid",borderRadius:12,cursor:"default",
};

const formFooter = { textAlign:"center",fontSize:13,color:"rgba(255,255,255,.3)" };
const registerLink = { color:"#22C55E",fontWeight:700,textDecoration:"none" };
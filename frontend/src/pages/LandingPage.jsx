import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const DEMO_SLOTS = [
  { day: 0, band: 0, span: 3, code: "CS101", room: "Lab 301", color: "#22C55E" },
  { day: 1, band: 0, span: 3, code: "MATH2", room: "Rm 204",  color: "#3B82F6" },
  { day: 2, band: 0, span: 3, code: "ENG01", room: "Rm 102",  color: "#F59E0B" },
  { day: 3, band: 0, span: 3, code: "PE001", room: "Gym",     color: "#EC4899" },
  { day: 4, band: 0, span: 3, code: "PHYS1", room: "Lab 302", color: "#8B5CF6" },
  { day: 0, band: 3, span: 3, code: "MATH2", room: "Rm 204",  color: "#3B82F6" },
  { day: 1, band: 3, span: 3, code: "CS101", room: "Rm 306",  color: "#22C55E" },
  { day: 2, band: 3, span: 3, code: "PHYS1", room: "Lab 302", color: "#8B5CF6" },
  { day: 3, band: 3, span: 3, code: "ENG01", room: "Rm 102",  color: "#F59E0B" },
  { day: 0, band: 6, span: 3, code: "PE001", room: "Gym",     color: "#EC4899" },
  { day: 2, band: 6, span: 3, code: "CS101", room: "Lab 301", color: "#22C55E" },
  { day: 4, band: 6, span: 3, code: "MATH2", room: "Rm 204",  color: "#3B82F6" },
];
const DAY_NAMES  = ["MON", "TUE", "WED", "THU", "FRI"];
const TIME_BANDS = ["7:30","8:00","8:30","9:00","9:30","10:00","10:30","11:00","11:30"];
const TOTAL_BANDS = 9;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }

@keyframes slideUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
@keyframes pulse-glow { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }
@keyframes blink      { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes gradShift  { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

/* ── Buttons ── */
.lp-btn-primary {
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  padding:13px 28px; border:none; border-radius:12px;
  background:linear-gradient(135deg,#22C55E,#16A34A);
  color:#fff; font-size:15px; font-weight:700;
  cursor:pointer; font-family:'DM Sans',sans-serif;
  transition:all .2s; letter-spacing:.01em; white-space:nowrap;
  box-shadow:0 4px 20px rgba(34,197,94,.35);
  touch-action:manipulation; -webkit-tap-highlight-color:transparent;
}
.lp-btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(34,197,94,.5); }
.lp-btn-primary:active { transform:translateY(0); }

.lp-btn-outline {
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  padding:12px 26px; border-radius:12px;
  background:rgba(255,255,255,.06); color:rgba(255,255,255,.8);
  border:1.5px solid rgba(255,255,255,.15); font-size:15px; font-weight:600;
  cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s; white-space:nowrap;
  touch-action:manipulation; -webkit-tap-highlight-color:transparent;
}
.lp-btn-outline:hover { background:rgba(255,255,255,.1); border-color:rgba(255,255,255,.3); color:#fff; }
.lp-btn-outline:active { transform:scale(.98); }

/* ── Nav ── */
.lp-nav {
  height:60px; display:flex; align-items:center; justify-content:space-between;
  padding:0 24px; position:fixed; top:0; left:0; right:0; z-index:100;
  transition:all .3s;
}
.lp-nav.scrolled {
  background:rgba(6,13,26,.95); backdrop-filter:blur(20px);
  border-bottom:1px solid rgba(255,255,255,.07);
  box-shadow:0 4px 24px rgba(0,0,0,.3);
}
@media (min-width:768px) { .lp-nav { padding:0 40px; height:64px; } }
@media (min-width:1200px) { .lp-nav { padding:0 56px; } }

.lp-nav-desktop { display:none; gap:10px; }
@media (min-width:640px) { .lp-nav-desktop { display:flex; } }

.lp-hamburger {
  display:flex; flex-direction:column; gap:5px; cursor:pointer;
  background:none; border:none; padding:8px; touch-action:manipulation;
  -webkit-tap-highlight-color:transparent;
}
.lp-hamburger span {
  display:block; width:22px; height:2px; background:rgba(255,255,255,.8);
  border-radius:2px; transition:all .3s;
}
@media (min-width:640px) { .lp-hamburger { display:none; } }

/* Mobile menu drawer */
.lp-mobile-menu {
  position:fixed; top:60px; left:0; right:0; z-index:99;
  background:rgba(6,13,26,.98); backdrop-filter:blur(24px);
  border-bottom:1px solid rgba(255,255,255,.08);
  padding:16px 20px 20px; display:flex; flex-direction:column; gap:10px;
  transform:translateY(-110%); opacity:0; pointer-events:none;
  transition:transform .3s ease, opacity .3s ease;
}
.lp-mobile-menu.open { transform:translateY(0); opacity:1; pointer-events:all; }

/* ── Hero ── */
.lp-hero {
  min-height:100vh; min-height:100dvh;
  display:flex; align-items:center;
  padding:80px 20px 60px; position:relative; z-index:1;
}
@media (min-width:640px) { .lp-hero { padding:90px 32px 72px; } }
@media (min-width:1024px) { .lp-hero { padding:100px 56px 80px; } }

.lp-hero-inner { max-width:1200px; margin:0 auto; width:100%; }

.lp-hero-grid { display:flex; flex-direction:column; gap:40px; }
@media (min-width:900px) {
  .lp-hero-grid { flex-direction:row; align-items:center; gap:56px; }
}
@media (min-width:1100px) { .lp-hero-grid { gap:72px; } }

.lp-hero-content { flex:1; min-width:0; }

.lp-hero-visual {
  width:100%; max-width:480px; margin:0 auto;
  animation:slideUp .6s ease .4s both, float 7s ease-in-out 1.5s infinite;
}
@media (min-width:900px) {
  .lp-hero-visual { flex-shrink:0; width:460px; max-width:none; margin:0; }
}
@media (min-width:1100px) { .lp-hero-visual { width:520px; } }

/* Badge */
.lp-badge {
  display:inline-flex; align-items:center; gap:8px;
  background:rgba(34,197,94,.1); border:1px solid rgba(34,197,94,.25);
  border-radius:100px; padding:6px 14px; margin-bottom:22px;
  animation:slideUp .5s ease .1s both;
  max-width:100%; overflow:hidden;
}
.lp-badge-text {
  font-size:10px; font-weight:700; color:#4ADE80;
  letter-spacing:.08em; text-transform:uppercase;
  font-family:'DM Mono',monospace; white-space:nowrap;
  overflow:hidden; text-overflow:ellipsis;
}
@media (min-width:480px) { .lp-badge-text { font-size:11px; letter-spacing:.1em; } }

.lp-hero-h1 {
  font-family:'Sora',sans-serif;
  font-size:clamp(2rem,8vw,4.2rem);
  font-weight:800; line-height:1.08; letter-spacing:-.03em; color:#fff; margin-bottom:18px;
  animation:slideUp .5s ease .2s both;
}
@media (min-width:480px) { .lp-hero-h1 { margin-bottom:22px; } }

.lp-hero-sub {
  font-size:clamp(14px,3.5vw,17px); color:rgba(255,255,255,.5); line-height:1.75;
  max-width:480px; margin-bottom:32px; font-weight:400;
  animation:slideUp .5s ease .3s both;
}
@media (min-width:480px) { .lp-hero-sub { margin-bottom:36px; } }

.lp-hero-ctas {
  display:flex; gap:12px; flex-wrap:wrap;
  animation:slideUp .5s ease .4s both;
}
.lp-hero-ctas .lp-btn-primary,
.lp-hero-ctas .lp-btn-outline { flex:1; min-width:140px; max-width:220px; }
@media (min-width:480px) {
  .lp-hero-ctas .lp-btn-primary,
  .lp-hero-ctas .lp-btn-outline { flex:0 0 auto; max-width:none; }
}

.lp-stats-row {
  display:flex; gap:28px; margin-top:44px; padding-top:28px;
  border-top:1px solid rgba(255,255,255,.07);
  animation:slideUp .5s ease .5s both; flex-wrap:wrap;
}
@media (min-width:480px) { .lp-stats-row { gap:40px; } }
@media (min-width:768px) { .lp-stats-row { gap:48px; } }

/* ── Section containers ── */
.lp-section { padding:72px 20px; position:relative; z-index:1; }
@media (min-width:640px) { .lp-section { padding:88px 32px; } }
@media (min-width:1024px) { .lp-section { padding:100px 56px; } }

.lp-section-bordered { border-top:1px solid rgba(255,255,255,.05); }

.lp-max-1200 { max-width:1200px; margin:0 auto; width:100%; }
.lp-max-1000 { max-width:1000px; margin:0 auto; width:100%; }
.lp-max-900  { max-width:900px;  margin:0 auto; width:100%; }

/* ── Section header ── */
.lp-section-label {
  font-size:11px; font-weight:700; color:#22C55E;
  letter-spacing:.15em; text-transform:uppercase;
  margin-bottom:12px; font-family:'DM Mono',monospace;
}
.lp-section-h2 {
  font-family:'Sora',sans-serif; font-weight:800;
  font-size:clamp(1.5rem,5vw,2.6rem);
  color:#fff; letter-spacing:-.03em; line-height:1.15;
}

/* ── Features grid ── */
.lp-features-grid {
  display:grid; grid-template-columns:1fr; gap:14px;
}
@media (min-width:560px) { .lp-features-grid { grid-template-columns:repeat(2,1fr); gap:16px; } }
@media (min-width:900px) { .lp-features-grid { grid-template-columns:repeat(3,1fr); gap:20px; } }

.lp-fcard {
  background:rgba(255,255,255,.025); border:1px solid rgba(255,255,255,.07);
  border-radius:18px; padding:24px 20px; transition:all .3s; cursor:default;
}
@media (min-width:640px) { .lp-fcard { padding:28px 24px; } }
@media (min-width:900px) { .lp-fcard { padding:32px 28px; } }
.lp-fcard:hover { background:rgba(255,255,255,.045); transform:translateY(-4px); }

/* ── How-it-works ── */
.lp-steps-list { display:flex; flex-direction:column; gap:4px; }

.lp-step {
  display:flex; gap:16px; align-items:flex-start;
  padding:20px 18px; background:rgba(255,255,255,.02);
  border:1px solid rgba(255,255,255,.06); border-radius:14px;
  position:relative; overflow:hidden;
}
@media (min-width:640px) { .lp-step { padding:24px 28px; gap:20px; } }
@media (min-width:900px) { .lp-step { padding:28px 32px; gap:24px; border-radius:16px; } }

.lp-step-num {
  font-family:'DM Mono',monospace; font-size:10px; font-weight:700;
  color:rgba(34,197,94,.5); letter-spacing:.1em; min-width:24px; padding-top:2px;
  display:none;
}
@media (min-width:560px) { .lp-step-num { display:block; } }

/* ── Roles ── */
.lp-roles-row {
  display:grid; grid-template-columns:repeat(3,1fr); gap:10px;
  justify-content:center; margin-bottom:36px;
}
@media (min-width:480px) { .lp-roles-row { grid-template-columns:repeat(3,1fr); gap:12px; } }
@media (min-width:640px) { .lp-roles-row { grid-template-columns:repeat(6,1fr); gap:12px; } }

.lp-role-badge {
  border-radius:14px; padding:16px 10px;
  display:flex; flex-direction:column; align-items:center; gap:8px;
  cursor:pointer; transition:all .25s; font-family:'DM Sans',sans-serif;
  border:1.5px solid; background:transparent;
  touch-action:manipulation; -webkit-tap-highlight-color:transparent;
}
@media (min-width:640px) { .lp-role-badge { padding:20px 12px; } }

/* ── Timetable chrome ── */
.lp-timetable {
  background:rgba(15,23,42,.85); backdrop-filter:blur(20px); border-radius:16px;
  border:1px solid rgba(34,197,94,.2); overflow:hidden; width:100%;
  box-shadow:0 40px 100px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.04) inset;
}
@media (min-width:640px) { .lp-timetable { border-radius:20px; } }

/* ── Footer ── */
.lp-footer {
  padding:24px 20px; display:flex; justify-content:space-between;
  align-items:center; flex-wrap:wrap; gap:14px;
  position:relative; z-index:1; border-top:1px solid rgba(255,255,255,.06);
}
@media (min-width:640px) { .lp-footer { padding:28px 40px; } }
@media (min-width:1024px) { .lp-footer { padding:28px 56px; } }
`;

function AnimatedTimetable() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 300); }, []);
  return (
    <div className="lp-timetable">
      <div style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,.06)", display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ display:"flex", gap:5 }}>
          {["#FF5F57","#FFBD2E","#28C840"].map((c,i)=><div key={i} style={{ width:9, height:9, borderRadius:"50%", background:c }} />)}
        </div>
        <div style={{ flex:1, textAlign:"center", fontSize:9, color:"rgba(255,255,255,.3)", fontFamily:"'DM Mono',monospace", letterSpacing:".08em", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          TIMECRAFT — S.Y. 2025–2026 · 1ST SEM
        </div>
        <div style={{ fontSize:9, color:"#22C55E", fontWeight:700, background:"rgba(34,197,94,.12)", padding:"2px 7px", borderRadius:4, border:"1px solid rgba(34,197,94,.3)", whiteSpace:"nowrap" }}>● LIVE</div>
      </div>
      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"38px repeat(5,1fr)", gap:2, marginBottom:2 }}>
          <div />
          {DAY_NAMES.map(d=><div key={d} style={{ textAlign:"center", fontSize:8, fontWeight:800, color:"rgba(255,255,255,.35)", letterSpacing:".1em", padding:"3px 0", fontFamily:"'DM Mono',monospace" }}>{d}</div>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"38px repeat(5,1fr)", gridTemplateRows:`repeat(${TOTAL_BANDS},24px)`, gap:2 }}>
          {TIME_BANDS.map((t,i)=>(
            <div key={t} style={{ gridColumn:1, gridRow:i+1, display:"flex", alignItems:"center", justifyContent:"flex-end", paddingRight:5 }}>
              {i%2===0 && <span style={{ fontSize:7, color:"rgba(255,255,255,.25)", fontFamily:"'DM Mono',monospace", fontWeight:600 }}>{t}</span>}
            </div>
          ))}
          {Array.from({length:TOTAL_BANDS}).map((_,bi)=>Array.from({length:5}).map((_,di)=>(
            <div key={`bg-${bi}-${di}`} style={{ gridColumn:di+2, gridRow:bi+1, background:bi%2===0?"rgba(255,255,255,.025)":"rgba(255,255,255,.01)", borderRadius:3, border:"1px solid rgba(255,255,255,.03)" }} />
          )))}
          {DEMO_SLOTS.map((slot,i)=>(
            <div key={i} style={{
              gridColumn:slot.day+2, gridRow:`${slot.band+1} / ${slot.band+slot.span+1}`,
              background:`${slot.color}18`, border:`1px solid ${slot.color}50`, borderLeft:`2px solid ${slot.color}`,
              borderRadius:4, padding:"3px 5px", display:"flex", flexDirection:"column", justifyContent:"center", overflow:"hidden",
              opacity:visible?1:0, transform:visible?"translateY(0) scale(1)":"translateY(6px) scale(.95)",
              transition:`opacity .4s ease ${.1+i*.06}s,transform .4s ease ${.1+i*.06}s`, zIndex:1,
            }}>
              <div style={{ fontSize:7, fontWeight:800, color:slot.color, letterSpacing:".04em", fontFamily:"'DM Mono',monospace", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{slot.code}</div>
              <div style={{ fontSize:6, color:"rgba(255,255,255,.3)", marginTop:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{slot.room}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CountUp({ target, suffix="", duration=1800 }) {
  const [val, setVal] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now-start)/duration, 1);
        setVal(Math.round((1-Math.pow(1-p,3))*target));
        if (p<1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold:.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
}

function FeatureCard({ icon, color, title, desc, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="lp-fcard"
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{
        border:`1px solid ${hovered?color+"60":"rgba(255,255,255,.07)"}`,
        boxShadow:hovered?`0 20px 60px ${color}20`:"none",
        animation:`slideUp .6s ease ${delay}s both`,
      }}
    >
      <div style={{ width:48, height:48, borderRadius:13, background:color+"20", border:`1px solid ${color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, marginBottom:18, transition:"transform .3s", transform:hovered?"scale(1.1) rotate(-3deg)":"scale(1)" }}>{icon}</div>
      <div style={{ fontSize:16, fontWeight:700, color:"#F1F5F9", marginBottom:8, fontFamily:"'Sora',sans-serif", letterSpacing:"-.01em" }}>{title}</div>
      <div style={{ fontSize:13, color:"rgba(255,255,255,.4)", lineHeight:1.75 }}>{desc}</div>
    </div>
  );
}

function RoleBadge({ icon, label, path, color, navigate }) {
  const [h, setH] = useState(false);
  return (
    <button className="lp-role-badge" onClick={()=>navigate(path)}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ background:h?color+"22":color+"0E", borderColor:h?color+"80":color+"30", transform:h?"translateY(-3px)":"translateY(0)", boxShadow:h?`0 12px 32px ${color}28`:"none" }}
    >
      <div style={{ fontSize:24 }}>{icon}</div>
      <div style={{ fontSize:10, fontWeight:700, color, letterSpacing:".04em", textTransform:"uppercase", textAlign:"center", lineHeight:1.3 }}>{label}</div>
    </button>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 640) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e) => {
      if (!e.target.closest(".lp-mobile-menu") && !e.target.closest(".lp-hamburger")) setMenuOpen(false);
    };
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [menuOpen]);

  const goTo = (path) => { navigate(path); setMenuOpen(false); };

  return (
    <div style={{ minHeight:"100vh", background:"#060D1A", color:"#fff", fontFamily:"'DM Sans',sans-serif", overflowX:"hidden" }}>
      <style>{CSS}</style>

      {/* Ambient blobs */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-10%", left:"15%", width:"min(700px,90vw)", height:"min(700px,90vw)", borderRadius:"50%", background:"radial-gradient(circle,rgba(34,197,94,.08) 0%,transparent 70%)", filter:"blur(60px)", animation:"pulse-glow 8s ease infinite" }} />
        <div style={{ position:"absolute", top:"45%", right:"-10%", width:"min(500px,70vw)", height:"min(500px,70vw)", borderRadius:"50%", background:"radial-gradient(circle,rgba(59,130,246,.06) 0%,transparent 70%)", filter:"blur(60px)", animation:"pulse-glow 10s ease infinite 2s" }} />
        <div style={{ position:"absolute", bottom:"10%", left:"-5%", width:"min(400px,60vw)", height:"min(400px,60vw)", borderRadius:"50%", background:"radial-gradient(circle,rgba(139,92,246,.05) 0%,transparent 70%)", filter:"blur(60px)", animation:"pulse-glow 12s ease infinite 4s" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px)", backgroundSize:"60px 60px", maskImage:"radial-gradient(ellipse at 50% 30%,black 30%,transparent 80%)", WebkitMaskImage:"radial-gradient(ellipse at 50% 30%,black 30%,transparent 80%)" }} />
      </div>

      {/* Navbar */}
      <nav className={`lp-nav${scrolled?" scrolled":""}`}>
        <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={()=>goTo("/")}>
          <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#22C55E,#16A34A)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(34,197,94,.4)", fontSize:16, fontWeight:900, flexShrink:0 }}>⬡</div>
          <div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:16, letterSpacing:"-.02em", color:"#fff" }}>TimeCraft</div>
            <div style={{ fontSize:8, color:"rgba(255,255,255,.35)", letterSpacing:".1em", textTransform:"uppercase" }}>Lorma College</div>
          </div>
        </div>

        {/* Desktop nav */}
        <div className="lp-nav-desktop">
          <button className="lp-btn-outline" style={{ padding:"8px 20px", fontSize:13 }} onClick={()=>goTo("/login")}>Sign In</button>
          <button className="lp-btn-primary" style={{ padding:"8px 20px", fontSize:13 }} onClick={()=>goTo("/register")}>Get Started</button>
        </div>

        {/* Hamburger */}
        <button className="lp-hamburger" onClick={()=>setMenuOpen(o=>!o)} aria-label="Menu">
          <span style={{ transform:menuOpen?"rotate(45deg) translateY(7px)":"none" }} />
          <span style={{ opacity:menuOpen?0:1, transform:menuOpen?"scaleX(0)":"scaleX(1)" }} />
          <span style={{ transform:menuOpen?"rotate(-45deg) translateY(-7px)":"none" }} />
        </button>
      </nav>

      {/* Mobile drawer */}
      <div className={`lp-mobile-menu${menuOpen?" open":""}`}>
        <button className="lp-btn-outline" style={{ fontSize:15, padding:"13px" }} onClick={()=>goTo("/login")}>Sign In</button>
        <button className="lp-btn-primary" style={{ fontSize:15, padding:"13px" }} onClick={()=>goTo("/register")}>Get Started →</button>
      </div>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-grid">
            <div className="lp-hero-content">
              <div className="lp-badge">
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#22C55E", display:"inline-block", flexShrink:0, animation:"blink 2s ease infinite" }} />
                <span className="lp-badge-text">Lorma College · San Fernando, La Union</span>
              </div>
              <h1 className="lp-hero-h1">
                Smarter schedules,<br />
                <span style={{ background:"linear-gradient(90deg,#22C55E 0%,#4ADE80 50%,#86EFAC 100%)", backgroundSize:"200% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", animation:"gradShift 4s ease infinite" }}>zero conflicts.</span>
              </h1>
              <p className="lp-hero-sub">
                TimeCraft is Lorma College's automatic timetabling system — generating conflict-free class schedules for all departments, rooms, and faculty in seconds.
              </p>
              <div className="lp-hero-ctas">
                <button className="lp-btn-primary" onClick={()=>navigate("/register")}>Get Started →</button>
                <button className="lp-btn-outline" onClick={()=>navigate("/login")}>Sign In</button>
              </div>
              <div className="lp-stats-row">
                {[{target:5,suffix:"+",label:"Departments"},{target:100,suffix:"%",label:"Conflict-Free"},{target:3,suffix:"s",label:"Generate Time"}].map((s,i)=>(
                  <div key={i}>
                    <div style={{ fontFamily:"'Sora',sans-serif", fontSize:"clamp(24px,6vw,36px)", fontWeight:800, color:"#fff", lineHeight:1, letterSpacing:"-.03em" }}><CountUp target={s.target} suffix={s.suffix} /></div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginTop:5, fontWeight:600, letterSpacing:".06em", textTransform:"uppercase" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-hero-visual">
              <AnimatedTimetable />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="lp-section">
        <div className="lp-max-1200">
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <div className="lp-section-label">— What TimeCraft Does —</div>
            <h2 className="lp-section-h2">Everything scheduling,<br />handled automatically.</h2>
          </div>
          <div className="lp-features-grid">
            {[
              {icon:"⚡",color:"#F59E0B",title:"Auto-Generation",     delay:.1,desc:"Generate a complete conflict-free timetable for all sections in seconds — no manual work needed."},
              {icon:"🔒",color:"#22C55E",title:"Zero Conflicts",       delay:.2,desc:"Smart constraint solver ensures no teacher, room, or section is double-booked. Guaranteed clean schedules every time."},
              {icon:"🏫",color:"#3B82F6",title:"Room Management",      delay:.3,desc:"Tracks lecture halls, computer labs, and specialized rooms. Assigns the right room type to every subject automatically."},
              {icon:"👨‍🏫",color:"#EC4899",title:"Faculty Availability", delay:.4,desc:"Teachers set their own availability. The engine respects preferences while ensuring all subjects are covered."},
              {icon:"📋",color:"#8B5CF6",title:"Multi-Role Access",    delay:.5,desc:"Separate portals for Admin, Dean, Program Head, GE Coordinator, Teachers, and Students — each with the right tools."},
              {icon:"📱",color:"#06B6D4",title:"Live Publishing",      delay:.6,desc:"Publish schedules instantly. Students and teachers see their timetable the moment it goes live — no delays."},
            ].map((f,i)=><FeatureCard key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="lp-section lp-section-bordered">
        <div className="lp-max-900">
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <div className="lp-section-label">— How It Works —</div>
            <h2 className="lp-section-h2">From setup to published in minutes.</h2>
          </div>
          <div className="lp-steps-list">
            {[
              {step:"01",icon:"⚙️",title:"Configure Subjects & Sections",desc:"Import your curriculum, set up sections, and define rooms. The Dean and Program Head manage assignments from their own portal."},
              {step:"02",icon:"📅",title:"Faculty Set Availability",     desc:"Teachers log in and mark their available timeslots. The engine uses these preferences as soft constraints during generation."},
              {step:"03",icon:"⚡",title:"Generate in One Click",        desc:"The scheduling engine runs a constraint satisfaction algorithm, producing a full conflict-free timetable for every section."},
              {step:"04",icon:"✅",title:"Review & Publish",             desc:"The Dean reviews the draft schedule, resolves any flagged conflicts, and publishes it — instantly visible to all users."},
            ].map((s,i)=>(
              <div key={i} className="lp-step" style={{ animation:`slideUp .5s ease ${.1+i*.12}s both` }}>
                <div className="lp-step-num">{s.step}</div>
                <div style={{ fontSize:22, flexShrink:0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize:"clamp(14px,2.5vw,16px)", fontWeight:700, color:"#F1F5F9", marginBottom:6, fontFamily:"'Sora',sans-serif", letterSpacing:"-.01em" }}>{s.title}</div>
                  <div style={{ fontSize:"clamp(13px,2vw,14px)", color:"rgba(255,255,255,.4)", lineHeight:1.75 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portals */}
      <section className="lp-section lp-section-bordered" style={{ paddingBottom:80 }}>
        <div className="lp-max-1000" style={{ textAlign:"center" }}>
          <div className="lp-section-label">— Portal Access —</div>
          <h2 className="lp-section-h2" style={{ marginBottom:14 }}>Your role, your dashboard.</h2>
          <p style={{ color:"rgba(255,255,255,.4)", fontSize:"clamp(13px,2.5vw,15px)", margin:"0 auto 44px", lineHeight:1.75, maxWidth:500 }}>
            Sign in with your Lorma College account to access your personalized portal.
          </p>
          <div className="lp-roles-row">
            {[
              {icon:"🛡️",label:"Admin",         path:"/login",color:"#F59E0B"},
              {icon:"🎓",label:"Dean",           path:"/login",color:"#22C55E"},
              {icon:"📋",label:"Program\nHead",  path:"/login",color:"#3B82F6"},
              {icon:"🌐",label:"GE Coord",       path:"/login",color:"#8B5CF6"},
              {icon:"👨‍🏫",label:"Teacher",        path:"/login",color:"#EC4899"},
              {icon:"📚",label:"Student",         path:"/login",color:"#06B6D4"},
            ].map((r,i)=><RoleBadge key={i} {...r} navigate={navigate} />)}
          </div>
          <button className="lp-btn-primary" onClick={()=>navigate("/register")} style={{ padding:"14px 36px", fontSize:15 }}>
            Create Your Account →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#22C55E,#16A34A)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>⬡</div>
          <div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:13, color:"#fff", letterSpacing:"-.01em" }}>TimeCraft</div>
            <div style={{ fontSize:8, color:"rgba(255,255,255,.25)", letterSpacing:".1em", textTransform:"uppercase" }}>Lorma College</div>
          </div>
        </div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,.2)", fontFamily:"'DM Mono',monospace" }}>© {new Date().getFullYear()} · Automatic Timetabling System</div>
        <div style={{ display:"flex", gap:18 }}>
          {[["Sign In","/login"],["Register","/register"]].map(([label,path])=>(
            <button key={label} onClick={()=>navigate(path)}
              style={{ background:"none", border:"none", color:"rgba(255,255,255,.3)", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"color .2s", padding:"4px 0" }}
              onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,.7)"}
              onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,.3)"}
            >{label}</button>
          ))}
        </div>
      </footer>
    </div>
  );
}
// 1st code

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Demo timetable data ───────────────────────────────────────────────────────
const DEMO_SLOTS = [
  { day: 0, band: 0, span: 3, code: "CS101", room: "Lab 301", color: "#22C55E", label: "LAB" },
  { day: 1, band: 0, span: 3, code: "MATH2", room: "Rm 204",  color: "#3B82F6", label: "LEC" },
  { day: 2, band: 0, span: 3, code: "ENG01", room: "Rm 102",  color: "#F59E0B", label: "LEC" },
  { day: 3, band: 0, span: 3, code: "PE001", room: "Gym",     color: "#EC4899", label: "LEC" },
  { day: 4, band: 0, span: 3, code: "PHYS1", room: "Lab 302", color: "#8B5CF6", label: "LAB" },
  { day: 0, band: 3, span: 3, code: "MATH2", room: "Rm 204",  color: "#3B82F6", label: "LEC" },
  { day: 1, band: 3, span: 3, code: "CS101", room: "Rm 306",  color: "#22C55E", label: "LEC" },
  { day: 2, band: 3, span: 3, code: "PHYS1", room: "Lab 302", color: "#8B5CF6", label: "LAB" },
  { day: 3, band: 3, span: 3, code: "ENG01", room: "Rm 102",  color: "#F59E0B", label: "LEC" },
  { day: 0, band: 6, span: 3, code: "PE001", room: "Gym",     color: "#EC4899", label: "LEC" },
  { day: 2, band: 6, span: 3, code: "CS101", room: "Lab 301", color: "#22C55E", label: "LAB" },
  { day: 4, band: 6, span: 3, code: "MATH2", room: "Rm 204",  color: "#3B82F6", label: "LEC" },
];

const DAY_NAMES  = ["MON", "TUE", "WED", "THU", "FRI"];
const TIME_BANDS = ["7:30", "8:00", "8:30", "9:00", "9:30", "10:00", "10:30", "11:00", "11:30"];
const TOTAL_BANDS = 9;

function AnimatedTimetable() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 300); }, []);

  return (
    <div style={{
      background: "rgba(15,23,42,0.85)",
      backdropFilter: "blur(20px)",
      borderRadius: 20,
      border: "1px solid rgba(34,197,94,0.2)",
      boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
      overflow: "hidden",
      width: "100%",
      maxWidth: 520,
    }}>
      {/* Window chrome */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#FF5F57","#FFBD2E","#28C840"].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>
          TIMECRAFT — S.Y. 2025–2026 · 1ST SEMESTER
        </div>
        <div style={{ fontSize: 10, color: "#22C55E", fontWeight: 700, background: "rgba(34,197,94,0.12)", padding: "2px 8px", borderRadius: 4, border: "1px solid rgba(34,197,94,0.3)" }}>
          ● LIVE
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: "12px 14px 14px" }}>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "44px repeat(5, 1fr)", gap: 3, marginBottom: 3 }}>
          <div />
          {DAY_NAMES.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", padding: "4px 0", fontFamily: "'DM Mono', monospace" }}>{d}</div>
          ))}
        </div>

        {/* Time rows */}
        <div style={{ display: "grid", gridTemplateColumns: "44px repeat(5, 1fr)", gridTemplateRows: `repeat(${TOTAL_BANDS}, 26px)`, gap: 3 }}>
          {/* Time labels */}
          {TIME_BANDS.map((t, i) => (
            <div key={t} style={{ gridColumn: 1, gridRow: i + 1, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6 }}>
              {(i % 2 === 0) && <span style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>{t}</span>}
            </div>
          ))}

          {/* Background cells */}
          {Array.from({ length: TOTAL_BANDS }).map((_, bi) =>
            Array.from({ length: 5 }).map((_, di) => (
              <div key={`bg-${bi}-${di}`} style={{
                gridColumn: di + 2, gridRow: bi + 1,
                background: bi % 2 === 0 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.01)",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.03)",
              }} />
            ))
          )}

          {/* Schedule blocks */}
          {DEMO_SLOTS.map((slot, i) => (
            <div
              key={i}
              style={{
                gridColumn: slot.day + 2,
                gridRow: `${slot.band + 1} / ${slot.band + slot.span + 1}`,
                background: `${slot.color}18`,
                border: `1px solid ${slot.color}50`,
                borderLeft: `3px solid ${slot.color}`,
                borderRadius: 5,
                padding: "3px 5px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                overflow: "hidden",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0) scale(1)" : "translateY(6px) scale(0.95)",
                transition: `opacity 0.4s ease ${0.1 + i * 0.06}s, transform 0.4s ease ${0.1 + i * 0.06}s`,
                zIndex: 1,
              }}
            >
              <div style={{ fontSize: 8, fontWeight: 800, color: slot.color, letterSpacing: "0.05em", fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{slot.code}</div>
              <div style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{slot.room}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Counter animation ─────────────────────────────────────────────────────────
function CountUp({ target, suffix = "", duration = 1800 }) {
  const [val, setVal] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(eased * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, color, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${hovered ? color + "60" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 18,
        padding: "32px 28px",
        transition: "all 0.3s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? `0 20px 60px ${color}20` : "none",
        animation: `slideUp 0.6s ease ${delay}s both`,
        cursor: "default",
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: color + "20",
        border: `1px solid ${color}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, marginBottom: 20,
        transition: "transform 0.3s ease",
        transform: hovered ? "scale(1.1) rotate(-3deg)" : "scale(1)",
      }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: "#F1F5F9", marginBottom: 10, fontFamily: "'Sora', sans-serif", letterSpacing: "-0.01em" }}>{title}</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>{desc}</div>
    </div>
  );
}

// ── Role badge ────────────────────────────────────────────────────────────────
function RoleBadge({ icon, label, path, color, navigate }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => navigate(path)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? color + "25" : color + "12",
        border: `1.5px solid ${hovered ? color + "80" : color + "30"}`,
        borderRadius: 14,
        padding: "20px 24px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        cursor: "pointer",
        transition: "all 0.25s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? `0 12px 32px ${color}30` : "none",
        fontFamily: "'DM Sans', sans-serif",
        minWidth: 130,
      }}
    >
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 11, color: hovered ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)", transition: "color 0.2s" }}>→ Sign in</div>
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060D1A",
      color: "#fff",
      fontFamily: "'DM Sans', sans-serif",
      overflowX: "hidden",
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes slideUp   { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn    { from { opacity: 0; } to { opacity: 1; } }
        @keyframes float     { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-14px) rotate(0.5deg); } }
        @keyframes pulse-glow { 0%,100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.04); } }
        @keyframes scanline  { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
        @keyframes blink     { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes gradShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes particleFloat {
          0%   { transform: translateY(0px) translateX(0px); opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.4; }
          100% { transform: translateY(-80px) translateX(20px); opacity: 0; }
        }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; border: none; border-radius: 10px;
          background: linear-gradient(135deg, #22C55E, #16A34A);
          color: #fff; font-size: 14px; font-weight: 700;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.2s ease; letter-spacing: 0.01em;
          box-shadow: 0 4px 20px rgba(34,197,94,0.35);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(34,197,94,0.5);
          background: linear-gradient(135deg, #4ADE80, #22C55E);
        }
        .btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 26px; border-radius: 10px;
          background: transparent; color: rgba(255,255,255,0.75);
          border: 1.5px solid rgba(255,255,255,0.15); font-size: 14px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.2s ease;
        }
        .btn-outline:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.35);
          color: #fff;
        }

        .grid-particle {
          position: absolute;
          width: 3px; height: 3px;
          border-radius: 50%;
          background: #22C55E;
          animation: particleFloat linear infinite;
        }

        @media (max-width: 900px) {
          .hero-grid { flex-direction: column !important; }
          .hero-visual { display: none !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .roles-row { flex-direction: column !important; align-items: stretch !important; }
          .stats-row { flex-direction: column !important; gap: 24px !important; }
        }
      `}</style>

      {/* ── Ambient background blobs ─────────────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "20%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)", filter: "blur(60px)", animation: "pulse-glow 8s ease infinite" }} />
        <div style={{ position: "absolute", top: "40%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)", filter: "blur(60px)", animation: "pulse-glow 10s ease infinite 2s" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)", filter: "blur(60px)", animation: "pulse-glow 12s ease infinite 4s" }} />

        {/* Grid pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 80%)",
        }} />
      </div>

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: 64,
        background: scrolled ? "rgba(6,13,26,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "all 0.3s ease",
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #22C55E, #16A34A)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(34,197,94,0.4)",
            fontSize: 17, fontWeight: 900,
          }}>⬡</div>
          <div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", color: "#fff" }}>TimeCraft</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Lorma College</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-outline" style={{ padding: "8px 20px", fontSize: 13 }} onClick={() => navigate("/login")}>Sign In</button>
          <button className="btn-primary" style={{ padding: "8px 20px", fontSize: 13 }} onClick={() => navigate("/register")}>Get Started</button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "100px 48px 80px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <div className="hero-grid" style={{ display: "flex", alignItems: "center", gap: 72 }}>

            {/* Left copy */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Eyebrow pill */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
                borderRadius: 100, padding: "6px 16px", marginBottom: 28,
                animation: "slideUp 0.5s ease 0.1s both",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block", animation: "blink 2s ease infinite" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#4ADE80", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
                  Lorma College · San Fernando, La Union
                </span>
              </div>

              {/* Headline */}
              <h1 style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: "clamp(2.8rem, 5.5vw, 4.2rem)",
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                color: "#fff",
                marginBottom: 24,
                animation: "slideUp 0.5s ease 0.2s both",
              }}>
                Smarter schedules,<br />
                <span style={{
                  background: "linear-gradient(90deg, #22C55E 0%, #4ADE80 40%, #86EFAC 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "gradShift 4s ease infinite",
                }}>zero conflicts.</span>
              </h1>

              {/* Sub */}
              <p style={{
                fontSize: 17, color: "rgba(255,255,255,0.5)", lineHeight: 1.75,
                maxWidth: 460, marginBottom: 38,
                animation: "slideUp 0.5s ease 0.3s both",
                fontWeight: 400,
              }}>
                TimeCraft is Lorma College's automatic timetabling system — generating conflict-free class schedules for all departments, rooms, and faculty in seconds.
              </p>

              {/* CTAs */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", animation: "slideUp 0.5s ease 0.4s both" }}>
                <button className="btn-primary" onClick={() => navigate("/register")}>
                  Get Started →
                </button>
                <button className="btn-outline" onClick={() => navigate("/login")}>
                  Sign In
                </button>
              </div>

              {/* Stats */}
              <div className="stats-row" style={{ display: "flex", gap: 48, marginTop: 56, paddingTop: 36, borderTop: "1px solid rgba(255,255,255,0.06)", animation: "slideUp 0.5s ease 0.5s both" }}>
                {[
                  { value: 0,   target: 5,    suffix: "+",  label: "Departments" },
                  { value: 0,   target: 100,  suffix: "%",  label: "Conflict-Free" },
                  { value: 0,   target: 3,    suffix: "s",  label: "Generate Time" },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 36, fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-0.03em" }}>
                      <CountUp target={s.target} suffix={s.suffix} />
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 6, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — timetable visual */}
            <div className="hero-visual" style={{ flexShrink: 0, width: 520, animation: "slideUp 0.6s ease 0.4s both, float 7s ease-in-out 1.5s infinite" }}>
              <AnimatedTimetable />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "100px 48px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* Section label */}
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#22C55E", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14, fontFamily: "'DM Mono', monospace" }}>
              — What TimeCraft Does —
            </div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              Everything scheduling,<br />handled automatically.
            </h2>
          </div>

          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { icon: "⚡", color: "#F59E0B", title: "Auto-Generation", delay: 0.1, desc: "Generate a complete conflict-free timetable for all sections and subjects in seconds — no manual work needed." },
              { icon: "🔒", color: "#22C55E", title: "Zero Conflicts", delay: 0.2, desc: "Smart constraint solver ensures no teacher, room, or section is double-booked. Guaranteed clean schedules every time." },
              { icon: "🏫", color: "#3B82F6", title: "Room Management", delay: 0.3, desc: "Tracks lecture halls, computer labs, and specialized rooms. Assigns the right room type to every subject automatically." },
              { icon: "👨‍🏫", color: "#EC4899", title: "Faculty Availability", delay: 0.4, desc: "Teachers set their own availability. The engine respects preferences while ensuring all subjects are covered." },
              { icon: "📋", color: "#8B5CF6", title: "Multi-Role Access", delay: 0.5, desc: "Separate portals for Admin, Dean, Program Head, GE Coordinator, Teachers, and Students — each with the right tools." },
              { icon: "📱", color: "#06B6D4", title: "Live Publishing", delay: 0.6, desc: "Publish schedules instantly. Students and teachers see their timetable the moment it goes live — no delays." },
            ].map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 48px", position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#22C55E", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14, fontFamily: "'DM Mono', monospace" }}>
              — How It Works —
            </div>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", color: "#fff", letterSpacing: "-0.03em" }}>
              From setup to published in minutes.
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { step: "01", icon: "⚙️", title: "Configure Subjects & Sections", desc: "Import your curriculum, set up sections, and define rooms. The Dean and Program Head manage assignments from their own portal." },
              { step: "02", icon: "📅", title: "Faculty Set Availability", desc: "Teachers log in and mark their available timeslots. The engine uses these preferences as soft constraints during generation." },
              { step: "03", icon: "⚡", title: "Generate in One Click", desc: "The scheduling engine runs a constraint satisfaction algorithm, producing a full conflict-free timetable for every section." },
              { step: "04", icon: "✅", title: "Review & Publish", desc: "The Dean reviews the draft schedule, resolves any flagged conflicts, and publishes it — instantly visible to all users." },
            ].map((s, i) => (
              <div key={i} style={{
                display: "flex", gap: 24, alignItems: "flex-start",
                padding: "28px 32px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                position: "relative",
                overflow: "hidden",
                animation: `slideUp 0.5s ease ${0.1 + i * 0.12}s both`,
              }}>
                {/* Step number */}
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: "rgba(34,197,94,0.5)", letterSpacing: "0.1em", minWidth: 26, paddingTop: 3 }}>{s.step}</div>
                {/* Icon */}
                <div style={{ fontSize: 24, flexShrink: 0 }}>{s.icon}</div>
                {/* Content */}
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", marginBottom: 8, fontFamily: "'Sora', sans-serif", letterSpacing: "-0.01em" }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>{s.desc}</div>
                </div>
                {/* Connector line */}
                {i < 3 && <div style={{ position: "absolute", left: 54, bottom: -2, width: 1, height: 6, background: "rgba(34,197,94,0.3)" }} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portals / Role access ─────────────────────────────────────────── */}
      <section style={{ padding: "80px 48px 100px", position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#22C55E", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14, fontFamily: "'DM Mono', monospace" }}>
            — Portal Access —
          </div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", color: "#fff", letterSpacing: "-0.03em", marginBottom: 16 }}>
            Your role, your dashboard.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, marginBottom: 52, lineHeight: 1.7 }}>
            Sign in with your Lorma College account to access your personalized portal.
          </p>

          <div className="roles-row" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
            {[
              { icon: "🛡️", label: "Admin",        path: "/login", color: "#F59E0B" },
              { icon: "🎓", label: "Dean",          path: "/login", color: "#22C55E" },
              { icon: "📋", label: "Program Head",  path: "/login", color: "#3B82F6" },
              { icon: "🌐", label: "GE Coordinator",path: "/login", color: "#8B5CF6" },
              { icon: "👨‍🏫", label: "Teacher",       path: "/login", color: "#EC4899" },
              { icon: "📚", label: "Student",        path: "/login", color: "#06B6D4" },
            ].map((r, i) => (
              <RoleBadge key={i} {...r} navigate={navigate} />
            ))}
          </div>

          <button className="btn-primary" onClick={() => navigate("/register")} style={{ padding: "14px 36px", fontSize: 15 }}>
            Create Your Account →
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "28px 48px",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
        position: "relative", zIndex: 1,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #22C55E, #16A34A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>⬡</div>
          <div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14, color: "#fff", letterSpacing: "-0.01em" }}>TimeCraft</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Lorma College</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono', monospace" }}>
          © {new Date().getFullYear()} · Automatic Timetabling System
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {[["Sign In", "/login"], ["Register", "/register"]].map(([label, path]) => (
            <button key={label} onClick={() => navigate(path)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "rgba(255,255,255,0.7)"}
              onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.3)"}
            >{label}</button>
          ))}
        </div>
      </footer>
    </div>
  );
}
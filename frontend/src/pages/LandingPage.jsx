import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ── Static data ───────────────────────────────────────────────────────────────

const ROLES = [
  {
    key   : "admin",
    label : "Administrator",
    icon  : "◈",
    color : "#1D9E75",
    bg    : "#085041",
    light : "#E1F5EE",
    desc  : "Generate conflict-free timetables in seconds. Manage departments, rooms, and faculty across multiple campuses.",
    perks : ["Auto schedule generation", "Conflict detection", "Department & room management", "Reports & analytics"],
  },
  {
    key   : "teacher",
    label : "Faculty",
    icon  : "◐",
    color : "#0F6E56",
    bg    : "#04342C",
    light : "#9FE1CB",
    desc  : "Set your availability preferences and let the system build a schedule that fits. View your assigned classes anytime.",
    perks : ["Availability management", "Real-time schedule view", "Cross-campus support", "Section load summary"],
  },
  {
    key   : "student",
    label : "Student",
    icon  : "◑",
    color : "#3B6D11",
    bg    : "#173404",
    light : "#C0DD97",
    desc  : "Access your personalised timetable the moment it's published. Know exactly when and where your classes are.",
    perks : ["Personal timetable view", "Day-at-a-glance layout", "Subject & room details", "Irregular student support"],
  },
];

// Decorative mini-timetable data
const DEMO_SLOTS = [
  { day: "Mon", time: "7:30",  code: "CS101", type: "LEC", color: "#1D9E75" },
  { day: "Mon", time: "10:00", code: "MATH2", type: "LEC", color: "#0F6E56" },
  { day: "Tue", time: "7:30",  code: "CS101", type: "LAB", color: "#3B6D11" },
  { day: "Tue", time: "13:00", code: "ENG01", type: "LEC", color: "#27500A" },
  { day: "Wed", time: "10:00", code: "PE001", type: "LEC", color: "#639922" },
  { day: "Wed", time: "7:30",  code: "PHYS1", type: "LAB", color: "#085041" },
  { day: "Thu", time: "13:00", code: "CS101", type: "LEC", color: "#1D9E75" },
  { day: "Thu", time: "10:00", code: "MATH2", type: "LAB", color: "#0F6E56" },
  { day: "Fri", time: "7:30",  code: "ENG01", type: "LEC", color: "#3B6D11" },
  { day: "Fri", time: "13:00", code: "PHYS1", type: "LEC", color: "#639922" },
];

const DAYS  = ["Mon","Tue","Wed","Thu","Fri"];
const TIMES = ["7:30","10:00","13:00"];

// ── Mini Timetable visual ─────────────────────────────────────────────────────

function MiniTimetable() {
  return (
    <div style={{
      borderRadius : 20,
      overflow     : "hidden",
      boxShadow    : "0 32px 80px rgba(15,17,33,0.45)",
      border       : "1px solid rgba(255,255,255,0.08)",
      background   : "rgba(15,17,40,0.8)",
      backdropFilter: "blur(16px)",
      padding      : 24,
      width        : "100%",
      maxWidth     : 480,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <div style={{ color: "#fff", fontFamily: "'Instrument Serif', serif", fontSize: 17, fontStyle: "italic" }}>
            Weekly Schedule
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            1st Semester · 2024–2025
          </div>
        </div>
        <div style={{
          background: "rgba(29,158,117,0.2)",
          border    : "1px solid rgba(29,158,117,0.4)",
          color     : "#1D9E75",
          borderRadius: 8,
          padding   : "4px 10px",
          fontSize  : 11,
          fontWeight: 700,
          letterSpacing: "0.05em",
        }}>
          PUBLISHED
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "50px repeat(5, 1fr)", gap: 4 }}>
        {/* Corner */}
        <div />
        {/* Day headers */}
        {DAYS.map(d => (
          <div key={d} style={{
            textAlign  : "center",
            fontSize   : 10,
            fontWeight : 700,
            color      : "rgba(255,255,255,0.4)",
            letterSpacing: "0.06em",
            paddingBottom: 6,
            textTransform: "uppercase",
          }}>{d}</div>
        ))}

        {/* Time rows */}
        {TIMES.map((time, ti) => (
          <>
            {/* Time label */}
            <div key={`t-${time}`} style={{
              fontSize  : 10,
              color     : "rgba(255,255,255,0.3)",
              paddingTop: 8,
              textAlign : "right",
              paddingRight: 8,
              fontWeight: 600,
            }}>
              {time}
            </div>

            {/* Day cells */}
            {DAYS.map((day, di) => {
              const slot = DEMO_SLOTS.find(s => s.day === day && s.time === time);
              return (
                <div key={`${day}-${time}`} style={{
                  borderRadius : 6,
                  height       : 46,
                  background   : slot ? slot.color + "28" : "rgba(255,255,255,0.03)",
                  border       : slot ? `1px solid ${slot.color}55` : "1px solid rgba(255,255,255,0.04)",
                  display      : "flex",
                  flexDirection: "column",
                  alignItems   : "center",
                  justifyContent: "center",
                  gap          : 2,
                  overflow     : "hidden",
                  transition   : "transform 0.2s ease",
                  animation    : slot ? `fadeIn 0.4s ease ${(ti * 5 + di) * 0.04}s both` : "none",
                }}>
                  {slot && (
                    <>
                      <div style={{
                        fontSize  : 9,
                        fontWeight: 800,
                        color     : slot.color,
                        letterSpacing: "0.04em",
                      }}>{slot.code}</div>
                      <div style={{
                        fontSize  : 8,
                        color     : "rgba(255,255,255,0.35)",
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                      }}>{slot.type}</div>
                    </>
                  )}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

// ── Role Card ─────────────────────────────────────────────────────────────────

function RoleCard({ role, index }) {
  return (
    <div style={{
      background   : "#ffffff",
      border       : "1.5px solid #E4E7F0",
      borderRadius : 20,
      padding      : "28px 28px",
      display      : "flex",
      flexDirection: "column",
      gap          : 16,
      boxShadow    : "0 4px 24px rgba(15,17,33,0.06)",
      transition   : "transform 0.25s ease, box-shadow 0.25s ease",
      animation    : `fadeIn 0.5s ease ${0.1 + index * 0.12}s both`,
      cursor       : "default",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = "0 12px 40px rgba(15,17,33,0.12)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 4px 24px rgba(15,17,33,0.06)";
    }}
    >
      {/* Icon + label row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width      : 46,
          height     : 46,
          borderRadius: 12,
          background : role.color + "14",
          display    : "flex",
          alignItems : "center",
          justifyContent: "center",
          fontSize   : 22,
          color      : role.color,
        }}>
          {role.icon}
        </div>
        <div>
          <div style={{
            fontFamily : "'Instrument Serif', serif",
            fontStyle  : "italic",
            fontSize   : 20,
            color      : "#0F1121",
            lineHeight : 1,
          }}>
            {role.label}
          </div>
          <div style={{
            fontSize   : 11,
            fontWeight : 700,
            color      : role.color,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginTop  : 3,
          }}>
            Portal Access
          </div>
        </div>
      </div>

      {/* Description */}
      <p style={{
        fontSize  : 13.5,
        color     : "#6B7494",
        lineHeight: 1.7,
        fontFamily: "'Figtree', sans-serif",
      }}>
        {role.desc}
      </p>

      {/* Perks */}
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {role.perks.map(perk => (
          <li key={perk} style={{
            display   : "flex",
            alignItems: "center",
            gap       : 8,
            fontSize  : 13,
            color     : "#2E3350",
            fontFamily: "'Figtree', sans-serif",
            fontWeight: 500,
          }}>
            <span style={{
              width      : 18,
              height     : 18,
              borderRadius: "50%",
              background : role.color + "14",
              display    : "flex",
              alignItems : "center",
              justifyContent: "center",
              fontSize   : 9,
              color      : role.color,
              flexShrink : 0,
              fontWeight : 900,
            }}>✓</span>
            {perk}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight  : "100vh",
      fontFamily : "'Figtree', system-ui, sans-serif",
      background : "#0B0D1A",
      color      : "#fff",
      overflowX  : "hidden",
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Figtree:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeIn    { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float     { 0%,100% { transform: translateY(0px);  } 50% { transform: translateY(-10px); } }
        @keyframes shimmer   { 0%,100% { opacity: 0.4; } 50% { opacity: 0.9; } }
        @keyframes spin      { to { transform: rotate(360deg); } }
        .cta-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 28px;
          background: #fff;
          color: #085041;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          font-family: 'Figtree', sans-serif;
          transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
          text-decoration: none;
          letter-spacing: 0.01em;
        }
        .cta-primary:hover {
          background: #EEF0FF;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(29,158,117,0.35);
        }
        .cta-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 28px;
          background: transparent;
          color: rgba(255,255,255,0.8);
          border: 1.5px solid rgba(255,255,255,0.2);
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Figtree', sans-serif;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          text-decoration: none;
        }
        .cta-secondary:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.4);
          color: #fff;
        }
        .stat-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }
        .stat-pill-value {
          font-family: 'Instrument Serif', serif;
          font-size: 36px;
          font-style: italic;
          color: #fff;
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .stat-pill-label {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 600;
        }
        @media (max-width: 900px) {
          .hero-inner { flex-direction: column !important; }
          .hero-timetable { display: none !important; }
          .roles-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <nav style={{
        display       : "flex",
        alignItems    : "center",
        justifyContent: "space-between",
        padding       : "20px 48px",
        borderBottom  : "1px solid rgba(255,255,255,0.06)",
        position      : "sticky",
        top           : 0,
        zIndex        : 50,
        backdropFilter: "blur(20px)",
        background    : "rgba(11,13,26,0.85)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/favicon.png" alt="TimeCraft" style={{ width: 34, height: 34, borderRadius: 9, objectFit: "contain" }} />
          <span style={{
            fontFamily : "'Instrument Serif', serif",
            fontStyle  : "italic",
            fontSize   : 22,
            color      : "#fff",
            letterSpacing: "-0.01em",
          }}>TimeCraft</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className="cta-secondary"
            style={{ padding: "9px 20px", fontSize: 13 }}
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>
          <button
            className="cta-primary"
            style={{ padding: "9px 20px", fontSize: 13 }}
            onClick={() => navigate("/register")}
          >
            Register
          </button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section style={{
        padding         : "80px 48px 72px",
        position        : "relative",
        overflow        : "hidden",
        minHeight       : "80vh",
        display         : "flex",
        alignItems      : "center",
      }}>

        {/* Background mesh glow */}
        <div style={{
          position   : "absolute",
          top        : "10%",
          left       : "30%",
          width      : 600,
          height     : 600,
          borderRadius: "50%",
          background : "radial-gradient(circle, rgba(29,158,117,0.22) 0%, transparent 70%)",
          filter     : "blur(40px)",
          pointerEvents: "none",
        }} />
        <div style={{
          position   : "absolute",
          bottom     : "5%",
          left       : "5%",
          width      : 400,
          height     : 400,
          borderRadius: "50%",
          background : "radial-gradient(circle, rgba(30,106,69,0.14) 0%, transparent 70%)",
          filter     : "blur(40px)",
          pointerEvents: "none",
        }} />

        <div className="hero-inner" style={{
          maxWidth: 1200,
          margin  : "0 auto",
          width   : "100%",
          display : "flex",
          alignItems: "center",
          gap     : 64,
          position: "relative",
        }}>

          {/* Left — copy */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Eyebrow */}
            <div style={{
              display     : "inline-flex",
              alignItems  : "center",
              gap         : 8,
              background  : "rgba(29,158,117,0.12)",
              border      : "1px solid rgba(29,158,117,0.3)",
              borderRadius: 100,
              padding     : "5px 14px",
              marginBottom: 24,
              fontSize    : 12,
              fontWeight  : 700,
              color       : "#1D9E75",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              animation   : "fadeIn 0.5s ease 0.1s both",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1D9E75", animation: "shimmer 2s ease infinite" }} />
              Academic Scheduling System
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily : "'Instrument Serif', serif",
              fontSize   : "clamp(2.6rem, 5vw, 4rem)",
              fontStyle  : "italic",
              fontWeight : 400,
              lineHeight : 1.1,
              color      : "#ffffff",
              letterSpacing: "-0.02em",
              marginBottom: 24,
              animation  : "fadeIn 0.5s ease 0.2s both",
            }}>
              Schedules that actually{" "}
              <span style={{
                background         : "linear-gradient(90deg, #1D9E75, #97C459)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip     : "text",
              }}>
                work.
              </span>
            </h1>

            {/* Sub */}
            <p style={{
              fontSize   : 16,
              color      : "rgba(255,255,255,0.55)",
              lineHeight : 1.75,
              maxWidth   : 480,
              marginBottom: 36,
              animation  : "fadeIn 0.5s ease 0.3s both",
            }}>
              TimeCraft generates conflict-free academic timetables for institutions. Admins, teachers, and students — all on one platform.
            </p>

            {/* CTAs */}
            <div style={{
              display : "flex",
              gap     : 12,
              flexWrap: "wrap",
              animation: "fadeIn 0.5s ease 0.4s both",
            }}>
              <button className="cta-primary" onClick={() => navigate("/register")}>
                Get Started →
              </button>
              <button className="cta-secondary" onClick={() => navigate("/login")}>
                Sign In
              </button>
            </div>

            {/* Stats row */}
            <div style={{
              display     : "flex",
              gap         : 40,
              marginTop   : 52,
              paddingTop  : 36,
              borderTop   : "1px solid rgba(255,255,255,0.07)",
              animation   : "fadeIn 0.5s ease 0.5s both",
            }}>
              {[
                { value: "3",    label: "User Roles"         },
                { value: "Zero", label: "Schedule Conflicts"  },
                { value: "∞",    label: "Sections Supported" },
              ].map(s => (
                <div key={s.label} className="stat-pill">
                  <span className="stat-pill-value">{s.value}</span>
                  <span className="stat-pill-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — timetable demo */}
          <div className="hero-timetable" style={{
            flexShrink: 0,
            width     : 480,
            animation : "fadeIn 0.6s ease 0.4s both, float 6s ease-in-out 1s infinite",
          }}>
            <MiniTimetable />
          </div>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div style={{
        height    : 1,
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
        margin    : "0 48px",
      }} />

      {/* ── Role cards ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 48px", background: "#F5F7FC" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{
              fontSize     : 11,
              fontWeight   : 800,
              color        : "#3B4FD8",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom : 10,
            }}>
              Built for everyone
            </p>
            <h2 style={{
              fontFamily : "'Instrument Serif', serif",
              fontStyle  : "italic",
              fontSize   : "clamp(1.8rem, 3vw, 2.6rem)",
              color      : "#0F1121",
              letterSpacing: "-0.02em",
              lineHeight : 1.2,
            }}>
              One system, three portals.
            </h2>
          </div>

          {/* Cards grid */}
          <div
            className="roles-grid"
            style={{
              display             : "grid",
              gridTemplateColumns : "repeat(3, 1fr)",
              gap                 : 20,
            }}
          >
            {ROLES.map((role, i) => (
              <RoleCard key={role.key} role={role} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────────── */}
      <section style={{
        background: "linear-gradient(135deg, #04342C 0%, #0F6E56 55%, #1D9E75 100%)",
        padding   : "72px 48px",
        textAlign : "center",
        position  : "relative",
        overflow  : "hidden",
      }}>
        {/* Decorative rings */}
        <div style={{
          position: "absolute", top: -80, right: -80,
          width: 300, height: 300, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.08)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -100, left: -60,
          width: 260, height: 260, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.06)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{
            fontFamily : "'Instrument Serif', serif",
            fontStyle  : "italic",
            fontSize   : "clamp(1.8rem, 3vw, 2.4rem)",
            color      : "#fff",
            letterSpacing: "-0.02em",
            marginBottom: 14,
            lineHeight : 1.2,
          }}>
            Ready to simplify your scheduling?
          </h2>
          <p style={{
            fontSize   : 15,
            color      : "rgba(255,255,255,0.65)",
            marginBottom: 32,
            lineHeight : 1.7,
          }}>
            Join your institution on TimeCraft and get your timetable sorted — no spreadsheets required.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="cta-primary" onClick={() => navigate("/register")}>
              Create Student Account →
            </button>
            <button className="cta-secondary" onClick={() => navigate("/login")}>
              I already have an account
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{
        padding      : "28px 48px",
        borderTop    : "1px solid rgba(255,255,255,0.06)",
        background   : "#080A16",
        display      : "flex",
        justifyContent: "space-between",
        alignItems   : "center",
        flexWrap     : "wrap",
        gap          : 12,
      }}>
        <div style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle : "italic",
          color     : "rgba(255,255,255,0.35)",
          fontSize  : 15,
        }}>
          TimeCraft
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
          Academic Scheduling System · {new Date().getFullYear()}
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <button onClick={() => navigate("/login")}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
            Sign In
          </button>
          <button onClick={() => navigate("/register")}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
            Register
          </button>
        </div>
      </footer>
    </div>
  );
}
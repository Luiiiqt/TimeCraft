import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import useSchedule from "../../hooks/useSchedule";
import api from "../../services/api";
import { Link } from "react-router-dom";

function getDefaultTerm() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return {
    semester: month >= 1 && month <= 5 ? "FIRST" : month <= 10 ? "FIRST" : "SECOND",
    schoolYear: `${year}-${year + 1}`,
  };
}

function fmt12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h % 12) || 12)}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const DAY_SHORT = { MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat" };

const SESSION_COLORS = {
  LECTURE:    { color: "#3B82F6", bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.22)", label: "LEC" },
  LABORATORY: { color: "#22C55E", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.22)",  label: "LAB" },
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes pulse-glow  { 0%,100%{opacity:0.5;} 50%{opacity:1;} }
  @keyframes blink       { 0%,100%{opacity:1;} 50%{opacity:0;} }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(18px);} to{opacity:1;transform:translateY(0);} }

  /* ── Root page shell — NO horizontal padding on mobile ── */
  .td-page {
    width: 100%;
    max-width: 1100px;
    margin: 0 auto;
    padding: 20px 12px 60px;
    position: relative;
    z-index: 1;
  }

  /* ── KPI grid ── */
  .td-kpi-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 20px;
  }

  /* ── Main two-col layout (single on mobile) ── */
  .td-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
    align-items: start;
  }

  .td-sidebar {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* ── Panel card ── */
  .tc-panel {
    background: rgba(255,255,255,0.028);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 16px;
    transition: border-color 0.2s;
  }
  .tc-panel:hover { border-color: rgba(255,255,255,0.12); }

  /* ── KPI card ── */
  .tc-kpi {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 13px 12px;
    position: relative;
    overflow: hidden;
    transition: background 0.2s, border-color 0.2s;
  }
  .tc-kpi:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.13); }

  /* ── Class card ── */
  .tc-class-card {
    border-radius: 13px;
    padding: 13px 13px 13px 0;
    margin-bottom: 10px;
    position: relative;
    overflow: hidden;
    transition: transform 0.15s;
  }
  .tc-class-card:hover { transform: translateY(-2px); }
  .tc-class-card:last-child { margin-bottom: 0; }

  /* ── Profile rows ── */
  .tc-profile-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 9px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    font-size: 13px;
    gap: 10px;
  }
  .tc-profile-row:last-child { border-bottom: none; }
  .tc-profile-val {
    color: rgba(255,255,255,0.8);
    font-weight: 500;
    font-size: 12px;
    max-width: 55%;
    text-align: right;
    word-break: break-word;
  }

  /* ── Quick links ── */
  .tc-quick-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 13px;
    border-radius: 11px;
    margin-bottom: 8px;
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
    border: 1px solid transparent;
  }
  .tc-quick-link:hover { transform: translateX(3px); filter: brightness(1.1); }
  .tc-quick-link:last-child { margin-bottom: 0; }

  /* ── Section label ── */
  .tc-section-label {
    font-size: 10px;
    font-weight: 700;
    color: rgba(255,255,255,0.25);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-family: 'DM Mono', monospace;
    margin-bottom: 10px;
  }

  /* ── Assigned subjects pill row ── */
  .td-assigned-banner {
    background: rgba(245,158,11,0.07);
    border: 1px solid rgba(245,158,11,0.22);
    border-radius: 14px;
    padding: 13px 14px;
    margin-bottom: 18px;
    animation: fadeSlideUp 0.5s ease 0.05s both;
  }

  /* ── Today header row ── */
  .td-today-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    gap: 10px;
  }

  /* ────────────────────────────────────────────
     RESPONSIVE BREAKPOINTS
  ──────────────────────────────────────────── */

  /* 480px+ — small phones get a little breathing room */
  @media (min-width: 480px) {
    .td-page { padding: 24px 16px 60px; }
    .td-kpi-grid { gap: 10px; }
  }

  /* 600px+ — 3-col KPIs */
  @media (min-width: 600px) {
    .td-page { padding: 28px 20px 60px; }
    .td-kpi-grid { grid-template-columns: repeat(3, 1fr); }
    .tc-panel { padding: 18px; }
  }

  /* 700px+ — all 5 KPIs in one row */
  @media (min-width: 700px) {
    .td-page { padding: 32px 28px 60px; }
    .td-kpi-grid { grid-template-columns: repeat(5, 1fr); gap: 12px; }
  }

  /* 900px+ — two-column layout */
  @media (min-width: 900px) {
    .td-page { padding: 40px 40px 60px; }
    .td-grid  { grid-template-columns: 1fr 290px; gap: 18px; }
    .td-kpi-grid { margin-bottom: 24px; }
  }
`;

function KpiCard({ icon, label, value, color }) {
  return (
    <div className="tc-kpi">
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg,${color}80,transparent)`,
      }} />
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: color + "18", border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, marginBottom: 10,
      }}>{icon}</div>
      <div style={{
        fontFamily: "'Sora',sans-serif",
        fontSize: "clamp(18px,4vw,26px)",
        fontWeight: 800, color: "#fff",
        lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 4,
      }}>{value}</div>
      <div style={{
        fontSize: 9, color: "rgba(255,255,255,0.4)",
        fontWeight: 600, letterSpacing: "0.06em",
        textTransform: "uppercase", lineHeight: 1.3,
      }}>{label}</div>
    </div>
  );
}

function ClassCard({ entry, isToday }) {
  const c = SESSION_COLORS[entry.sessionType] ?? SESSION_COLORS.LECTURE;
  return (
    <div className="tc-class-card" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      {/* Left accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0,
        width: 3, background: c.color, borderRadius: "12px 0 0 12px",
      }} />

      <div style={{ paddingLeft: 14 }}>
        {/* Top row: code + badge + today pill */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: 4, gap: 8, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{
              fontFamily: "'DM Mono',monospace", fontWeight: 700,
              fontSize: 13, color: c.color,
            }}>{entry.subjectCode}</span>
            <span style={{
              fontSize: 9, fontWeight: 700, color: c.color,
              background: `${c.color}18`, border: `1px solid ${c.border}`,
              borderRadius: 4, padding: "2px 6px",
              letterSpacing: "0.08em", fontFamily: "'DM Mono',monospace",
            }}>{c.label}</span>
          </div>
          {isToday && (
            <span style={{
              fontSize: 9, background: "rgba(34,197,94,0.15)", color: "#4ADE80",
              border: "1px solid rgba(34,197,94,0.3)", borderRadius: 6,
              padding: "2px 7px", fontWeight: 700,
              fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em",
            }}>TODAY</span>
          )}
        </div>

        {/* Subject name */}
        <div style={{
          fontSize: 13, color: "rgba(255,255,255,0.85)",
          fontWeight: 600, marginBottom: 7, lineHeight: 1.4,
        }}>{entry.subjectName}</div>

        {/* Meta row */}
        <div style={{
          fontSize: 11, color: "rgba(255,255,255,0.38)",
          display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6,
        }}>
          <span>🏫 {entry.sectionName} · {entry.courseCode} Yr{entry.yearLevel}</span>
          <span>🚪 {entry.roomName || entry.roomNumber}</span>
          <span>🏛️ {entry.campusCode}</span>
        </div>

        {/* Time row */}
        <div style={{
          fontSize: 12, color: c.color,
          fontWeight: 600, fontFamily: "'DM Mono',monospace",
        }}>
          {DAY_SHORT[entry.day1]} {fmt12(entry.startTime1)}–{fmt12(entry.endTime1)}
          {entry.day2 && (
            <>&nbsp;·&nbsp;{DAY_SHORT[entry.day2]} {fmt12(entry.startTime2)}–{fmt12(entry.endTime2)}</>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { schedules, loading, error, fetchTeacherSchedule } = useSchedule();
  const { semester, schoolYear } = getDefaultTerm();

  const [profile, setProfile]               = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [assignedSubjects, setAssignedSubjects] = useState([]);

  useEffect(() => {
    api.get("/teachers/me")
      .then(r => setProfile(r.data?.data ?? r.data))
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  useEffect(() => {
    api.get(`/teachers/my-assignments?semester=${semester}&schoolYear=${schoolYear}`)
      .then(r => setAssignedSubjects(r.data?.data ?? []))
      .catch(() => setAssignedSubjects([]));
  }, [semester, schoolYear]);

  useEffect(() => {
    const id = user?.userId;
    if (id) fetchTeacherSchedule(id, semester, schoolYear);
  }, [user?.userId, semester, schoolYear]);

  const uniqueSections = new Set(schedules.map(s => s.sectionId)).size;
  const uniqueSubjects = new Set(schedules.map(s => s.subjectId)).size;
  const lectures       = schedules.filter(s => s.sessionType === "LECTURE").length;
  const labs           = schedules.filter(s => s.sessionType === "LABORATORY").length;
  const totalUnits     = schedules.reduce((sum, s) => sum + (s.units || 3), 0);
  const today          = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const todaysClasses  = schedules.filter(s => s.day1 === today || s.day2 === today);
  const otherClasses   = schedules.filter(s => s.day1 !== today && s.day2 !== today && s.day1 != null);
  const semLabel       = semester === "FIRST" ? "1st" : semester === "SECOND" ? "2nd" : "Summer";

  const deptName    = profile?.teacherProfile?.department?.name || user?.departmentName || "—";
  const campusLabel = profile?.teacherProfile?.campusFlexible
    ? "GE — Flexible Campus"
    : `${profile?.teacherProfile?.preferredCampus?.code || ""} Campus`;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060D1A",
      color: "#fff",
      fontFamily: "'DM Sans',sans-serif",
      /* Crucially: no padding/margin here — let .td-page handle all spacing */
    }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── Ambient background blobs ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-5%", left: "20%",
          width: "min(700px,90vw)", height: "min(700px,90vw)", borderRadius: "50%",
          background: "radial-gradient(circle,rgba(59,130,246,0.07) 0%,transparent 70%)",
          filter: "blur(60px)", animation: "pulse-glow 9s ease infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "15%", right: "-5%",
          width: "min(500px,70vw)", height: "min(500px,70vw)", borderRadius: "50%",
          background: "radial-gradient(circle,rgba(34,197,94,0.05) 0%,transparent 70%)",
          filter: "blur(60px)", animation: "pulse-glow 11s ease infinite 2s",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at 50% 20%,black 25%,transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 20%,black 25%,transparent 75%)",
        }} />
      </div>

      <div className="td-page">

        {/* ── Header ── */}
        <div style={{ marginBottom: 20, animation: "fadeSlideUp 0.5s ease both" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)",
            borderRadius: 100, padding: "4px 14px", marginBottom: 12,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", background: "#3B82F6",
              display: "inline-block", animation: "blink 2s ease infinite",
            }} />
            <span style={{
              fontSize: 10, fontWeight: 700, color: "#93C5FD",
              letterSpacing: "0.12em", textTransform: "uppercase",
              fontFamily: "'DM Mono',monospace",
            }}>
              Teacher Portal · {semLabel} Sem {schoolYear}
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Sora',sans-serif",
            fontSize: "clamp(1.4rem,6vw,2.2rem)",
            fontWeight: 800, letterSpacing: "-0.03em",
            color: "#fff", marginBottom: 5,
          }}>
            Welcome back, {user?.fullName?.split(" ")[0] || "Teacher"}.
          </h1>
          <p style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: "clamp(12px,2vw,14px)",
            lineHeight: 1.6,
          }}>
            {profileLoading ? "Loading profile…" : `${deptName} · ${campusLabel}`}
          </p>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 10, padding: "11px 14px", marginBottom: 18,
            color: "#FCA5A5", fontSize: 13, display: "flex", gap: 8, alignItems: "flex-start",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Assigned subjects banner ── */}
        {assignedSubjects.length > 0 && (
          <div className="td-assigned-banner">
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#FCD34D",
              letterSpacing: "0.1em", textTransform: "uppercase",
              fontFamily: "'DM Mono',monospace", marginBottom: 10,
            }}>📋 Assigned This Term</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {assignedSubjects.map(a => (
                <span key={a.id} style={{
                  fontSize: 12, padding: "4px 11px", borderRadius: 20,
                  fontWeight: 600, border: "1px solid",
                  background: a.finalized ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
                  color: a.finalized ? "#4ADE80" : "#FCD34D",
                  borderColor: a.finalized ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)",
                }}>
                  {a.subject?.code} {a.finalized ? "✓" : "· Pending"}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── KPI grid ── */}
        <div className="td-kpi-grid" style={{ animation: "fadeSlideUp 0.5s ease 0.1s both" }}>
          <KpiCard icon="📚" label="Subjects" value={loading ? "…" : uniqueSubjects} color="#3B82F6" />
          <KpiCard icon="👥" label="Sections" value={loading ? "…" : uniqueSections}  color="#22C55E" />
          <KpiCard icon="🎓" label="Lectures" value={loading ? "…" : lectures}         color="#8B5CF6" />
          <KpiCard icon="🔬" label="Labs"     value={loading ? "…" : labs}              color="#F59E0B" />
          <KpiCard icon="⭐" label="Units"    value={loading ? "…" : totalUnits}        color="#EC4899" />
        </div>

        {/* ── Main content ── */}
        <div className="td-grid" style={{ animation: "fadeSlideUp 0.5s ease 0.15s both" }}>

          {/* Left — classes */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Today's classes */}
            <div className="tc-panel">
              <div className="td-today-header">
                <div>
                  <div className="tc-section-label">
                    Today · {today.charAt(0) + today.slice(1).toLowerCase()}
                  </div>
                  <h2 style={{
                    fontFamily: "'Sora',sans-serif",
                    fontSize: "clamp(14px,3vw,17px)",
                    fontWeight: 700, color: "#fff", letterSpacing: "-0.02em",
                  }}>Today's Classes</h2>
                </div>
                <Link to="/teacher/schedule" style={{
                  fontSize: 12, color: "#4ADE80", textDecoration: "none",
                  fontWeight: 700, fontFamily: "'DM Mono',monospace",
                  letterSpacing: "0.04em", whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  Full →
                </Link>
              </div>

              {loading ? (
                <div style={{
                  color: "rgba(255,255,255,0.2)", fontSize: 13,
                  fontFamily: "'DM Mono',monospace", padding: "12px 0",
                }}>Loading schedule…</div>
              ) : todaysClasses.length === 0 ? (
                <div style={{ textAlign: "center", padding: "28px 0", color: "rgba(255,255,255,0.25)" }}>
                  <div style={{ fontSize: 30, marginBottom: 10 }}>🎉</div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "rgba(255,255,255,0.4)" }}>No classes today!</div>
                  <div style={{ fontSize: 12, marginTop: 6 }}>Enjoy your free day.</div>
                </div>
              ) : todaysClasses.map(e => <ClassCard key={e.id} entry={e} isToday />)}
            </div>

            {/* Other classes */}
            {!loading && otherClasses.length > 0 && (
              <div className="tc-panel">
                <div className="tc-section-label">This Term</div>
                <h2 style={{
                  fontFamily: "'Sora',sans-serif",
                  fontSize: "clamp(14px,3vw,17px)",
                  fontWeight: 700, color: "#fff",
                  letterSpacing: "-0.02em", marginBottom: 14,
                }}>Other Classes</h2>
                {otherClasses.map(e => <ClassCard key={e.id} entry={e} isToday={false} />)}
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="td-sidebar">

            {/* Profile */}
            <div className="tc-panel">
              <div className="tc-section-label">My Profile</div>
              {[
                ["School ID",  user?.schoolId],
                ["Email",      user?.email],
                ["Department", deptName],
                ["Campus",     profileLoading ? "…" : campusLabel],
                ["Status",     "Active"],
              ].map(([label, val]) => (
                <div key={label} className="tc-profile-row">
                  <span style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>{label}</span>
                  <span className="tc-profile-val" style={{
                    fontFamily: label === "School ID" || label === "Email"
                      ? "'DM Mono',monospace"
                      : "'DM Sans',sans-serif",
                  }}>
                    {val || "—"}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick links */}
            <div className="tc-panel">
              <div className="tc-section-label">Quick Links</div>
              <Link to="/teacher/schedule" className="tc-quick-link"
                style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#93C5FD" }}>
                <span style={{ fontSize: 16 }}>📅</span> View My Schedule
              </Link>
              <Link to="/teacher/availability" className="tc-quick-link"
                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ADE80" }}>
                <span style={{ fontSize: 16 }}>🕐</span> Set Availability
              </Link>
              <Link to="/teacher/preferences" className="tc-quick-link"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#FCD34D" }}>
                <span style={{ fontSize: 16 }}>📚</span> Subject Preferences
              </Link>
            </div>

            {/* Term summary */}
            <div style={{
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.18)",
              borderRadius: 16, padding: "16px",
            }}>
              <div className="tc-section-label" style={{ color: "rgba(74,222,128,0.6)" }}>Term Summary</div>
              {[
                [`${semLabel} Semester`, "📅"],
                [schoolYear,             "📆"],
                [`${schedules.length} entries`, "📊"],
              ].map(([val, icon]) => (
                <div key={val} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "5px 0", fontSize: 13, color: "rgba(255,255,255,0.55)",
                }}>
                  <span>{icon}</span>
                  <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{val}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
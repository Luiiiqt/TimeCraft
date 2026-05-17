import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import useSchedule from "../../hooks/useSchedule";
import { Link } from "react-router-dom";

const DAY_ORDER = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const DAY_SHORT = { MONDAY:"Mon", TUESDAY:"Tue", WEDNESDAY:"Wed", THURSDAY:"Thu", FRIDAY:"Fri", SATURDAY:"Sat" };

function getDefaultTerm() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();
  const semester = month >= 6 && month <= 10 ? "FIRST" : "SECOND";
  const schoolYear = `${year}-${year + 1}`;
  return { semester, schoolYear };
}

function fmt12(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12)}:${String(m).padStart(2,"0")} ${ampm}`;
}

const SESSION_STYLE = {
  LECTURE:    { color: "#3B82F6", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.25)",  label: "LEC" },
  LABORATORY: { color: "#22C55E", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.25)",   label: "LAB" },
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16, padding: "20px 22px",
      position: "relative", overflow: "hidden", flex: 1, minWidth: 150,
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}90, transparent)`,
      }} />
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: color + "18", border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 17, marginBottom: 14,
      }}>{icon}</div>
      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 5 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ── Schedule Card ─────────────────────────────────────────────────────────────
function ScheduleCard({ entry }) {
  const s = SESSION_STYLE[entry.sessionType] ?? SESSION_STYLE.LECTURE;
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 12, padding: "14px 16px",
      marginBottom: 10, position: "relative", overflow: "hidden",
    }}>
      {/* Left accent */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: s.color, borderRadius: "0 0 0 0" }} />
      <div style={{ paddingLeft: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 13, color: s.color }}>
            {entry.subjectCode}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, color: s.color,
            background: s.border, borderRadius: 4,
            padding: "2px 6px", letterSpacing: "0.08em",
            fontFamily: "'DM Mono', monospace",
            border: `1px solid ${s.border}`,
          }}>{s.label}</span>
        </div>
        <div style={{ fontSize: 13, color: "#F1F5F9", fontWeight: 500, marginBottom: 8 }}>
          {entry.subjectName}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          <span>👤 {entry.teacherName}</span>
          <span>🚪 {entry.roomName || entry.roomNumber}</span>
          <span>🏫 {entry.campusCode}</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: s.color, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>
          {DAY_SHORT[entry.day1]} · {fmt12(entry.startTime1)}–{fmt12(entry.endTime1)}
          {entry.day2 && <> &nbsp;·&nbsp; {DAY_SHORT[entry.day2]} · {fmt12(entry.startTime2)}–{fmt12(entry.endTime2)}</>}
        </div>
      </div>
    </div>
  );
}

// ── Today's Schedule ──────────────────────────────────────────────────────────
function TodaySchedule({ schedules }) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const todays = [...schedules.filter(s => s.day1 === today || s.day2 === today)]
    .sort((a, b) => (a.startTime1 || "").localeCompare(b.startTime1 || ""));

  if (todays.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.3)" }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
        <div style={{ fontWeight: 600, color: "rgba(255,255,255,0.5)", fontSize: 15 }}>No classes today!</div>
        <div style={{ fontSize: 13, marginTop: 6, color: "rgba(255,255,255,0.25)" }}>Enjoy your free day.</div>
      </div>
    );
  }

  return todays.map(s => <ScheduleCard key={s.id} entry={s} />);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { user } = useAuth();
  const { schedules, loading, error, fetchMySchedule } = useSchedule();
  const { semester, schoolYear } = getDefaultTerm();

  useEffect(() => {
    fetchMySchedule(semester, schoolYear, user?.sectionId ?? null, {
      courseId: user?.courseId,
      yearLevel: user?.yearLevel,
      section: user?.section,
    });
  }, [semester, schoolYear, user?.sectionId]);

  const uniqueSubjects = new Set(schedules.map(s => s.subjectId)).size;
  const lectures       = schedules.filter(s => s.sessionType === "LECTURE").length;
  const labs           = schedules.filter(s => s.sessionType === "LABORATORY").length;
  const totalUnits     = schedules.reduce((sum, s) => sum + (s.units || 3), 0);
  const semLabel       = semester === "FIRST" ? "1st" : semester === "SECOND" ? "2nd" : "Summer";

  const navLinkStyle = (color) => ({
    display: "flex", alignItems: "center", gap: 10,
    padding: "11px 14px", borderRadius: 10,
    background: color + "12", border: `1px solid ${color}25`,
    color: color === "#3B82F6" ? "#93C5FD" : "#FCD34D",
    textDecoration: "none", fontSize: 13, fontWeight: 600,
    marginBottom: 8, transition: "all 0.2s ease",
    fontFamily: "'DM Sans', sans-serif",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#060D1A", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse-glow { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
        a.nav-link:hover { opacity: 0.85; transform: translateX(2px); }
      `}</style>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-5%", left: "25%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)", filter: "blur(60px)", animation: "pulse-glow 8s ease infinite" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "0%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)", filter: "blur(60px)", animation: "pulse-glow 10s ease infinite 2s" }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at 50% 20%, black 25%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 20%, black 25%, transparent 75%)",
        }} />
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 40px 60px", position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: 100, padding: "4px 14px", marginBottom: 16,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block", animation: "blink 2s ease infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#4ADE80", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
              Student Portal · {semLabel} Sem {schoolYear}
            </span>
          </div>

          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 6 }}>
            Welcome back, {user?.fullName?.split(" ")[0] ?? "Student"}.
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.6 }}>
            {user?.courseCode} · Year {user?.yearLevel}
            {user?.isIrregular ? " · Irregular" : user?.section ? ` · Section ${user.section}` : ""}
          </p>
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "11px 16px", marginBottom: 22, color: "#FCA5A5", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Stat cards ── */}
        <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
          <StatCard label="Enrolled Subjects"   value={loading ? "…" : uniqueSubjects} icon="📚" color="#3B82F6" />
          <StatCard label="Lecture Classes"      value={loading ? "…" : lectures}       icon="🎓" color="#8B5CF6" />
          <StatCard label="Laboratory Classes"   value={loading ? "…" : labs}           icon="🔬" color="#22C55E" />
          <StatCard label="Total Units"          value={loading ? "…" : totalUnits}     icon="⭐" color="#F59E0B" />
        </div>

        {/* ── Two-column layout ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18, alignItems: "start" }}>

          {/* Today's Classes */}
          <div style={{
            background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16, padding: "22px 24px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Today</div>
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 19, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
                  Today's Classes
                </h2>
              </div>
              <Link
                to="/student/timetable"
                style={{ fontSize: 12, color: "#4ADE80", textDecoration: "none", fontWeight: 700, fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em" }}
              >
                Full Timetable →
              </Link>
            </div>

            {loading
              ? <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, fontFamily: "'DM Mono', monospace", padding: "16px 0" }}>Loading schedule…</div>
              : <TodaySchedule schedules={schedules} />
            }
          </div>

          {/* Right sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* My Profile */}
            <div style={{
              background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "20px 20px",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 14 }}>
                My Profile
              </div>

              {[
                ["School ID",   user?.schoolId],
                ["Email",       user?.email],
                ["Course",      user?.courseName || user?.courseCode],
                ["Year",        user?.yearLevel ? `Year ${user.yearLevel}` : "—"],
                ["Section",     user?.isIrregular ? "Irregular" : (user?.section || "—")],
                ["Department",  user?.departmentName],
              ].map(([label, val]) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
                  fontSize: 13,
                }}>
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>{label}</span>
                  <span style={{
                    color: "#F1F5F9", fontWeight: 500,
                    textAlign: "right", maxWidth: 150,
                    fontSize: 12, fontFamily: label === "School ID" || label === "Email" ? "'DM Mono', monospace" : "'DM Sans', sans-serif",
                  }}>{val || "—"}</span>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div style={{
              background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "20px 20px",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 14 }}>
                Quick Links
              </div>

              <Link
                to="/student/timetable"
                className="nav-link"
                style={navLinkStyle("#3B82F6")}
              >
                <span style={{ fontSize: 16 }}>📅</span>
                <span>View Full Timetable</span>
              </Link>

              {user?.isIrregular && (
                <Link
                  to="/student/enrollment"
                  className="nav-link"
                  style={navLinkStyle("#F59E0B")}
                >
                  <span style={{ fontSize: 16 }}>📋</span>
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
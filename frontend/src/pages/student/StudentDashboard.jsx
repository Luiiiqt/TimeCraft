import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import useSchedule from "../../hooks/useSchedule";
import { Link } from "react-router-dom";

// ─── Helpers ────────────────────────────────────────────────────────────────

const DAY_ORDER = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const DAY_SHORT = { MONDAY:"Mon",TUESDAY:"Tue",WEDNESDAY:"Wed",THURSDAY:"Thu",FRIDAY:"Fri",SATURDAY:"Sat" };

/** Returns the current academic defaults — adjust logic as needed */
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

const SESSION_COLOR = {
  LECTURE: { bg: "#EEF4FF", border: "#6B8FFF", text: "#2A3FA0", badge: "#6B8FFF" },
  LABORATORY: { bg: "#F0FBF4", border: "#52C27E", text: "#1A6640", badge: "#52C27E" },
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, icon, accent }) {
  return (
    <div style={{
      background: "#fff",
      border: "1.5px solid #E8EBF2",
      borderRadius: 16,
      padding: "20px 24px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: accent + "1A",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#111827", fontFamily: "'DM Serif Display', Georgia, serif" }}>{value}</div>
        <div style={{ fontSize: 12, color: "#6B7280", fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>{label}</div>
      </div>
    </div>
  );
}

function ScheduleCard({ entry }) {
  const colors = SESSION_COLOR[entry.sessionType] || SESSION_COLOR.LECTURE;
  return (
    <div style={{
      background: colors.bg,
      border: `1.5px solid ${colors.border}`,
      borderRadius: 12,
      padding: "14px 16px",
      marginBottom: 10,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Left accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0,
        width: 4, background: colors.border, borderRadius: "12px 0 0 12px",
      }} />
      <div style={{ paddingLeft: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: colors.text, fontFamily: "'DM Serif Display', serif" }}>
            {entry.subjectCode}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, color: "#fff",
            background: colors.badge, borderRadius: 6,
            padding: "2px 7px", letterSpacing: "0.5px",
            fontFamily: "'DM Sans', sans-serif",
          }}>{entry.sessionType}</span>
        </div>
        <div style={{ fontSize: 13, color: "#374151", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
          {entry.subjectName}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: "#6B7280", fontFamily: "'DM Sans', sans-serif" }}>
          <span>👤 {entry.teacherName}</span>
          <span>🚪 {entry.roomName || entry.roomNumber}</span>
          <span>🏫 {entry.campusCode}</span>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: colors.text, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
          📅 {DAY_SHORT[entry.day1]} {fmt12(entry.startTime1)}–{fmt12(entry.endTime1)}
          {entry.day2 && <>&nbsp;&nbsp;·&nbsp;&nbsp;{DAY_SHORT[entry.day2]} {fmt12(entry.startTime2)}–{fmt12(entry.endTime2)}</>}
        </div>
      </div>
    </div>
  );
}

function TodaySchedule({ schedules }) {
  const today = new Date().toLocaleDateString("en-US",{ weekday:"long" }).toUpperCase();
  const todays = schedules.filter(s => s.day1 === today || s.day2 === today);

  if (todays.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
        <div style={{ fontWeight: 600 }}>No classes today!</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Enjoy your free day.</div>
      </div>
    );
  }

  // Sort by start time
  const sorted = [...todays].sort((a, b) => (a.startTime1 || "").localeCompare(b.startTime1 || ""));
  return sorted.map(s => <ScheduleCard key={s.id} entry={s} />);
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const { user } = useAuth();
  const { schedules, loading, error, fetchMySchedule } = useSchedule();
  const { semester, schoolYear } = getDefaultTerm();

  useEffect(() => {
    fetchMySchedule(semester, schoolYear);
  }, [semester, schoolYear]);

  // Derived stats
  const uniqueSubjects = new Set(schedules.map(s => s.subjectId)).size;
  const lectures  = schedules.filter(s => s.sessionType === "LECTURE").length;
  const labs      = schedules.filter(s => s.sessionType === "LABORATORY").length;
  const totalUnits = schedules.reduce((sum, s) => sum + (s.units || 3), 0);

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FC", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Google Font import via style tag */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #c5c9d6; border-radius: 3px; }
      `}</style>

      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, #1A237E 0%, #3949AB 60%, #5C6BC0 100%)",
        padding: "32px 40px 28px",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circle */}
        <div style={{
          position: "absolute", right: -60, top: -60,
          width: 280, height: 280, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
        }} />
        <div style={{
          position: "absolute", right: 80, bottom: -80,
          width: 200, height: 200, borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
        }} />

        <div style={{ position: "relative", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4, letterSpacing: "1px", textTransform: "uppercase" }}>
            Student Portal
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, fontWeight: 400, marginBottom: 4 }}>
            Welcome back, {user?.fullName?.split(" ")[0] || "Student"} 👋
          </h1>
          <div style={{ fontSize: 14, opacity: 0.8 }}>
            {user?.courseCode} · Year {user?.yearLevel}
            {user?.isIrregular ? " · Irregular" : user?.section ? ` · Section ${user.section}` : ""}
            &nbsp;·&nbsp; {semester === "FIRST" ? "1st" : semester === "SECOND" ? "2nd" : "Summer"} Sem {schoolYear}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

        {/* Error */}
        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#B91C1C", fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
          <StatCard label="Enrolled Subjects" value={loading ? "…" : uniqueSubjects} icon="📚" accent="#3949AB" />
          <StatCard label="Lecture Classes"   value={loading ? "…" : lectures}       icon="🎓" accent="#6B8FFF" />
          <StatCard label="Laboratory Classes" value={loading ? "…" : labs}          icon="🔬" accent="#52C27E" />
          <StatCard label="Total Units"        value={loading ? "…" : totalUnits}    icon="⭐" accent="#F59E0B" />
        </div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

          {/* Today's Schedule */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1.5px solid #E8EBF2", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#111827" }}>Today's Classes</h2>
              <Link to="/student/timetable" style={{ fontSize: 13, color: "#3949AB", textDecoration: "none", fontWeight: 600 }}>
                View Full Timetable →
              </Link>
            </div>
            {loading
              ? <div style={{ color: "#9CA3AF", fontSize: 14 }}>Loading schedule…</div>
              : <TodaySchedule schedules={schedules} />
            }
          </div>

          {/* Quick Info Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Student Info Card */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 22, border: "1.5px solid #E8EBF2", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: "#111827", marginBottom: 14 }}>My Profile</h3>
              {[
                ["School ID", user?.schoolId],
                ["Email",     user?.email],
                ["Course",    user?.courseName || user?.courseCode],
                ["Year",      user?.yearLevel ? `Year ${user.yearLevel}` : "—"],
                ["Section",   user?.isIrregular ? "Irregular" : (user?.section || "—")],
                ["Department",user?.departmentName],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #F3F4F6", fontSize: 13 }}>
                  <span style={{ color: "#6B7280" }}>{label}</span>
                  <span style={{ color: "#111827", fontWeight: 500, textAlign: "right", maxWidth: 170 }}>{val || "—"}</span>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 22, border: "1.5px solid #E8EBF2", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: "#111827", marginBottom: 14 }}>Quick Links</h3>
              <Link to="/student/timetable" style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10,
                background: "#EEF4FF", color: "#2A3FA0",
                textDecoration: "none", fontSize: 13, fontWeight: 600,
                marginBottom: 8,
              }}>
                📅 View Full Timetable
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
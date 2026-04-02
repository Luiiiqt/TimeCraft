import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import useSchedule from "../../hooks/useSchedule";
import api from "../../services/api";
import { Link } from "react-router-dom";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDefaultTerm() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();
  const semester  = month >= 6 && month <= 10 ? "FIRST" : "SECOND";
  const schoolYear = `${year}-${year + 1}`;
  return { semester, schoolYear };
}

function fmt12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h % 12) || 12)}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
}

const DAY_SHORT = { MONDAY:"Mon",TUESDAY:"Tue",WEDNESDAY:"Wed",THURSDAY:"Thu",FRIDAY:"Fri",SATURDAY:"Sat" };

const SESSION_COLORS = {
  LECTURE: { bg:"#EEF4FF", border:"#6B8FFF", text:"#1E3A9B", badge:"#6B8FFF" },
  LABORATORY: { bg:"#F0FBF4", border:"#52C27E", text:"#1A5C38", badge:"#52C27E" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, accent, sub }) {
  return (
    <div style={{
      background: "#fff", border: "1.5px solid #E8EBF2", borderRadius: 16,
      padding: "20px 22px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      display: "flex", alignItems: "flex-start", gap: 14,
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: 12,
        background: accent + "1A", display: "flex",
        alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#111827", fontFamily: "'DM Serif Display', serif" }}>{value}</div>
        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 1, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: accent, marginTop: 3, fontWeight: 600 }}>{sub}</div>}
      </div>
    </div>
  );
}

function ClassCard({ entry, isToday }) {
  const c = SESSION_COLORS[entry.sessionType] || SESSION_COLORS.LECTURE;
  return (
    <div style={{
      background: isToday ? c.bg : "#fff",
      border: `1.5px solid ${isToday ? c.border : "#E8EBF2"}`,
      borderRadius: 12, padding: "14px 16px", marginBottom: 10,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0,
        width: 4, background: c.border, borderRadius: "12px 0 0 12px",
      }} />
      <div style={{ paddingLeft: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: c.text, fontFamily: "'DM Serif Display', serif" }}>
              {entry.subjectCode}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, color: "#fff",
              background: c.badge, borderRadius: 5, padding: "1px 6px",
            }}>{entry.sessionType}</span>
          </div>
          {isToday && (
            <span style={{ fontSize: 11, background: "#DCFCE7", color: "#15803D", borderRadius: 6, padding: "2px 7px", fontWeight: 600 }}>
              TODAY
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: "#374151", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
          {entry.subjectName}
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", fontFamily: "'DM Sans', sans-serif", display: "flex", gap: 14, flexWrap: "wrap" }}>
          <span>🏫 {entry.sectionName} · {entry.courseCode} Yr{entry.yearLevel}</span>
          <span>🚪 {entry.roomName || entry.roomNumber}</span>
          <span>🏛️ {entry.campusCode}</span>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: c.text, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
          {DAY_SHORT[entry.day1]} {fmt12(entry.startTime1)}–{fmt12(entry.endTime1)}
          {entry.day2 && <>&nbsp;·&nbsp;{DAY_SHORT[entry.day2]} {fmt12(entry.startTime2)}–{fmt12(entry.endTime2)}</>}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { schedules, loading, error, fetchTeacherSchedule } = useSchedule();
  const { semester, schoolYear } = getDefaultTerm();

  // Teacher profile state (from /teachers/me)
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch teacher profile
  useEffect(() => {
    const load = async () => {
      try {
        setProfileLoading(true);
        const res = await api.get("/teachers/me");
        setProfile(res.data?.data ?? res.data);
      } catch (e) {
        console.error("Failed to load teacher profile", e);
      } finally {
        setProfileLoading(false);
      }
    };
    load();
  }, []);

  // Fetch schedule when we know teacher id
  useEffect(() => {
    const id = profile?.id || user?.userId;
    if (id) fetchTeacherSchedule(id, semester, schoolYear);
  }, [profile, user, semester, schoolYear]);

  // Derived stats
  const uniqueSections  = new Set(schedules.map(s => s.sectionId)).size;
  const uniqueSubjects  = new Set(schedules.map(s => s.subjectId)).size;
  const lectures        = schedules.filter(s => s.sessionType === "LECTURE").length;
  const labs            = schedules.filter(s => s.sessionType === "LABORATORY").length;
  const totalUnits      = schedules.reduce((sum, s) => sum + (s.units || 3), 0);
  const today           = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const todaysClasses   = schedules.filter(s => s.day1 === today || s.day2 === today);
  const otherClasses    = schedules.filter(s => s.day1 !== today && s.day2 !== today);

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FC", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 60%, #40916C 100%)",
        padding: "32px 40px 28px", color: "#fff", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", right: -60, top: -60, width: 280, height: 280,
          borderRadius: "50%", background: "rgba(255,255,255,0.06)",
        }} />
        <div style={{ position: "relative", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, opacity: 0.7, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>
            Teacher Portal
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, fontWeight: 400, marginBottom: 4 }}>
            Welcome, {user?.fullName?.split(" ")[0] || "Teacher"} 👋
          </h1>
          <div style={{ fontSize: 14, opacity: 0.8 }}>
            {profileLoading ? "Loading profile…" : (
              <>
                {profile?.teacherProfile?.department?.name || user?.departmentName || "—"}
                &nbsp;·&nbsp;
                {profile?.teacherProfile?.campusFlexible
                  ? "GE Teacher (Flexible Campus)"
                  : `${profile?.teacherProfile?.preferredCampus?.code || ""} Campus`}
                &nbsp;·&nbsp; {semester === "FIRST" ? "1st" : semester === "SECOND" ? "2nd" : "Summer"} Sem {schoolYear}
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#B91C1C", fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}

        {/* KPI Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 26 }}>
          <KpiCard icon="📚" label="Subjects Teaching" value={loading ? "…" : uniqueSubjects} accent="#2D6A4F" />
          <KpiCard icon="👥" label="Sections Handled"  value={loading ? "…" : uniqueSections} accent="#52C27E" />
          <KpiCard icon="🎓" label="Lecture Classes"   value={loading ? "…" : lectures}       accent="#6B8FFF" />
          <KpiCard icon="🔬" label="Lab Classes"       value={loading ? "…" : labs}            accent="#F59E0B" />
          <KpiCard icon="⭐" label="Units This Term"   value={loading ? "…" : totalUnits}      accent="#EC4899" />
        </div>

        {/* Main two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>

          {/* Left: Schedule list */}
          <div>
            {/* Today's classes */}
            <div style={{
              background: "#fff", borderRadius: 16, padding: 22,
              border: "1.5px solid #E8EBF2", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 20,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#111827" }}>
                  Today's Classes <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 400 }}>({today.charAt(0) + today.slice(1).toLowerCase()})</span>
                </h2>
                <Link to="/teacher/schedule" style={{ fontSize: 13, color: "#2D6A4F", textDecoration: "none", fontWeight: 600 }}>
                  Full Schedule →
                </Link>
              </div>
              {loading ? (
                <div style={{ color: "#9CA3AF", fontSize: 14, padding: "20px 0" }}>Loading…</div>
              ) : todaysClasses.length === 0 ? (
                <div style={{ textAlign: "center", padding: "28px 0", color: "#9CA3AF" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                  <div style={{ fontWeight: 600 }}>No classes today!</div>
                </div>
              ) : (
                todaysClasses.map(e => <ClassCard key={e.id} entry={e} isToday />)
              )}
            </div>

            {/* All other classes */}
            {!loading && otherClasses.length > 0 && (
              <div style={{
                background: "#fff", borderRadius: 16, padding: 22,
                border: "1.5px solid #E8EBF2", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#111827", marginBottom: 16 }}>
                  Other Classes This Term
                </h2>
                {otherClasses.map(e => <ClassCard key={e.id} entry={e} isToday={false} />)}
              </div>
            )}
          </div>

          {/* Right: Profile + Quick Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Profile card */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 22, border: "1.5px solid #E8EBF2", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: "#111827", marginBottom: 14 }}>My Profile</h3>
              {[
                ["School ID",   user?.schoolId],
                ["Email",       user?.email],
                ["Department",  user?.departmentName],
                ["Campus Type", profile?.teacherProfile?.campusFlexible ? "GE / Flexible" : "Dept-Fixed"],
                ["Status",      "Active"],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #F3F4F6", fontSize: 13 }}>
                  <span style={{ color: "#6B7280" }}>{label}</span>
                  <span style={{ color: "#111827", fontWeight: 500 }}>{val || "—"}</span>
                </div>
              ))}
            </div>

            {/* Quick links */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 22, border: "1.5px solid #E8EBF2", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: "#111827", marginBottom: 14 }}>Quick Links</h3>
              {[
                { to: "/teacher/schedule",     icon: "📅", label: "View My Schedule", color: "#EEF4FF", textColor: "#2A3FA0" },
                { to: "/teacher/availability",   icon: "🕐", label: "Set Availability",       color: "#F0FBF4", textColor: "#1A5C38" },
                { to: "/teacher/preferences",    icon: "📚", label: "Subject Preferences",    color: "#FEF9EE", textColor: "#92400E" },
              ].map(l => (
                <Link key={l.to} to={l.to} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10,
                  background: l.color, color: l.textColor,
                  textDecoration: "none", fontSize: 13, fontWeight: 600, marginBottom: 8,
                }}>
                  {l.icon} {l.label}
                </Link>
              ))}
            </div>

            {/* Term summary */}
            <div style={{ background: "#F0FBF4", borderRadius: 16, padding: 22, border: "1.5px solid #52C27E" }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: "#1A5C38", marginBottom: 10 }}>Term Summary</h3>
              <div style={{ fontSize: 13, color: "#2D6A4F", lineHeight: 1.8 }}>
                <div>📅 <strong>{semester === "FIRST" ? "1st" : semester === "SECOND" ? "2nd" : "Summer"} Semester</strong></div>
                <div>📆 School Year <strong>{schoolYear}</strong></div>
                <div>📊 <strong>{schedules.length}</strong> schedule entries loaded</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
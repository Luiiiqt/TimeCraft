import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import useSchedule from "../../hooks/useSchedule";
import api from "../../services/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const DAY_LABELS = {
  MONDAY:"Monday", TUESDAY:"Tuesday", WEDNESDAY:"Wednesday",
  THURSDAY:"Thursday", FRIDAY:"Friday", SATURDAY:"Saturday",
};
const DAY_SHORT = { MONDAY:"Mon",TUESDAY:"Tue",WEDNESDAY:"Wed",THURSDAY:"Thu",FRIDAY:"Fri",SATURDAY:"Sat" };

const SEMESTERS = [
  { value: "FIRST",  label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "SUMMER", label: "Summer" },
];

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

// Stable color per subject code
const PALETTE = [
  { bg:"#EEF4FF", border:"#6B8FFF", text:"#1E3A9B" },
  { bg:"#F0FBF4", border:"#52C27E", text:"#1A5C38" },
  { bg:"#FFF7ED", border:"#FB923C", text:"#7C2D12" },
  { bg:"#FDF4FF", border:"#C084FC", text:"#6B21A8" },
  { bg:"#FFF1F2", border:"#FB7185", text:"#9F1239" },
  { bg:"#F0F9FF", border:"#38BDF8", text:"#0C4A6E" },
  { bg:"#FEFCE8", border:"#FACC15", text:"#713F12" },
  { bg:"#F0FDFA", border:"#2DD4BF", text:"#134E4A" },
];
const colorCache = {};
let ci = 0;
function getColor(code) {
  if (!colorCache[code]) { colorCache[code] = PALETTE[ci % PALETTE.length]; ci++; }
  return colorCache[code];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TermSelector({ semester, schoolYear, onChange }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - 2 + i;
    return `${y}-${y+1}`;
  });
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <select value={semester} onChange={e => onChange({ semester: e.target.value, schoolYear })} style={selStyle}>
        {SEMESTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <select value={schoolYear} onChange={e => onChange({ semester, schoolYear: e.target.value })} style={selStyle}>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}
const selStyle = {
  padding: "8px 14px", borderRadius: 10, border: "1.5px solid #E8EBF2",
  fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#374151",
  background: "#fff", cursor: "pointer", outline: "none",
};

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({ schedules }) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();

  if (schedules.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#9CA3AF" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
        <div style={{ fontWeight: 600, fontSize: 16 }}>No schedule found for this term.</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>Check if a schedule has been generated and published.</div>
      </div>
    );
  }

  // Group by day — each schedule entry may appear on two days
  const byDay = {};
  DAYS.forEach(d => { byDay[d] = []; });
  schedules.forEach(s => {
    if (byDay[s.day1]) byDay[s.day1].push({ ...s, _activeDay: 1 });
    if (s.day2 && byDay[s.day2]) byDay[s.day2].push({ ...s, _activeDay: 2 });
  });

  return (
    <>
      {DAYS.map(day => {
        const entries = byDay[day].sort((a, b) => {
          const ta = a._activeDay === 1 ? a.startTime1 : a.startTime2;
          const tb = b._activeDay === 1 ? b.startTime1 : b.startTime2;
          return (ta || "").localeCompare(tb || "");
        });
        if (entries.length === 0) return null;
        const isToday = day === today;

        return (
          <div key={day} style={{ marginBottom: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "#2D6A4F" }}>
                {DAY_LABELS[day]}
              </h3>
              {isToday && (
                <span style={{ fontSize: 11, background: "#DCFCE7", color: "#15803D", borderRadius: 6, padding: "2px 8px", fontWeight: 700 }}>
                  TODAY
                </span>
              )}
              <div style={{ flex: 1, height: 1, background: "#E8EBF2" }} />
            </div>

            {entries.map((e, idx) => {
              const c = getColor(e.subjectCode);
              const startT = e._activeDay === 1 ? e.startTime1 : e.startTime2;
              const endT   = e._activeDay === 1 ? e.endTime1   : e.endTime2;

              return (
                <div key={`${e.id}-${idx}`} style={{
                  display: "flex", gap: 14, marginBottom: 10, alignItems: "flex-start",
                }}>
                  {/* Time badge */}
                  <div style={{
                    minWidth: 80, textAlign: "center",
                    background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 10,
                    padding: "8px 6px",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: c.text }}>{fmt12(startT)}</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>–</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: c.text }}>{fmt12(endT)}</div>
                  </div>

                  {/* Info card */}
                  <div style={{
                    flex: 1, background: c.bg, border: `1.5px solid ${c.border}`,
                    borderRadius: 12, padding: "12px 16px", position: "relative", overflow: "hidden",
                  }}>
                    {/* Status badge */}
                    <div style={{
                      position: "absolute", top: 10, right: 12, fontSize: 10, fontWeight: 600,
                      background: e.status === "PUBLISHED" ? "#DCFCE7" : e.status === "CONFLICTED" ? "#FEE2E2" : "#FEF3C7",
                      color: e.status === "PUBLISHED" ? "#15803D" : e.status === "CONFLICTED" ? "#B91C1C" : "#92400E",
                      borderRadius: 5, padding: "2px 7px",
                    }}>
                      {e.status}
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: c.text, fontFamily: "'DM Serif Display', serif" }}>
                        {e.subjectCode}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: "#fff", background: c.border,
                        borderRadius: 5, padding: "1px 6px",
                      }}>{e.sessionType}</span>
                    </div>

                    <div style={{ fontSize: 13, color: "#374151", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                      {e.subjectName}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 12, color: "#6B7280", fontFamily: "'DM Sans', sans-serif" }}>
                      <span>👥 {e.sectionName} — {e.courseCode} Yr{e.yearLevel}</span>
                      <span>🚪 {e.roomName || e.roomNumber}</span>
                      <span>🏛️ {e.campusName || e.campusCode}</span>
                      <span>📖 {e.subjectType}</span>
                    </div>

                    {/* Both session days */}
                    <div style={{ marginTop: 8, fontSize: 11, color: c.text, fontWeight: 500 }}>
                      📅 {DAY_SHORT[e.day1]} {fmt12(e.startTime1)}–{fmt12(e.endTime1)}
                      {e.day2 && <>&nbsp;+&nbsp;{DAY_SHORT[e.day2]} {fmt12(e.startTime2)}–{fmt12(e.endTime2)}</>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

// ─── Grid View ────────────────────────────────────────────────────────────────

function GridView({ schedules }) {
  const timesSet = new Set();
  schedules.forEach(s => {
    if (s.startTime1) timesSet.add(s.startTime1 + "|" + s.endTime1);
    if (s.startTime2) timesSet.add(s.startTime2 + "|" + s.endTime2);
  });
  const times = Array.from(timesSet).sort();

  const grid = {};
  DAYS.forEach(d => { grid[d] = {}; times.forEach(t => { grid[d][t] = []; }); });
  schedules.forEach(s => {
    const t1 = s.startTime1 + "|" + s.endTime1;
    if (grid[s.day1]?.[t1] !== undefined) grid[s.day1][t1].push(s);
    if (s.day2) {
      const t2 = s.startTime2 + "|" + s.endTime2;
      if (grid[s.day2]?.[t2] !== undefined) grid[s.day2][t2].push(s);
    }
  });

  if (times.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#9CA3AF" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
        <div style={{ fontWeight: 600 }}>No schedule for this term.</div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
        <thead>
          <tr>
            <th style={thStyle}>Time</th>
            {DAYS.map(d => <th key={d} style={{ ...thStyle, minWidth: 160 }}>{DAY_LABELS[d]}</th>)}
          </tr>
        </thead>
        <tbody>
          {times.map(t => {
            const [start, end] = t.split("|");
            return (
              <tr key={t}>
                <td style={{ border: "1px solid #E8EBF2", background: "#F7F8FC", padding: "8px 10px", textAlign: "center", fontSize: 11, color: "#6B7280", fontWeight: 600 }}>
                  <div>{fmt12(start)}</div>
                  <div style={{ color: "#D1D5DB" }}>–</div>
                  <div>{fmt12(end)}</div>
                </td>
                {DAYS.map(d => {
                  const entries = grid[d][t] ?? [];
                  if (entries.length === 0) return <td key={d} style={{ border: "1px solid #E8EBF2", background: "#FAFBFC", minHeight: 70 }} />;
                  return (
                    <td key={d} style={{ border: "1px solid #E8EBF2", verticalAlign: "top", padding: 6 }}>
                      {entries.map(e => {
                        const c = getColor(e.subjectCode);
                        return (
                          <div key={e.id} style={{
                            background: c.bg, border: `1.5px solid ${c.border}`,
                            borderRadius: 8, padding: "6px 8px", marginBottom: 4, fontSize: 11,
                          }}>
                            <div style={{ fontWeight: 700, color: c.text, marginBottom: 2 }}>{e.subjectCode}</div>
                            <div style={{ color: "#4B5563", lineHeight: 1.3, marginBottom: 3 }}>{e.subjectName}</div>
                            <div style={{ color: "#6B7280" }}>Sec: {e.sectionName}</div>
                            <div style={{ color: "#9CA3AF" }}>🚪 {e.roomName || e.roomNumber}</div>
                          </div>
                        );
                      })}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = {
  border: "1px solid #E8EBF2", padding: "10px 12px",
  textAlign: "center", fontWeight: 700, color: "#2D6A4F",
  fontSize: 12, background: "#F0FBF4", fontFamily: "'DM Sans', sans-serif",
};

// ─── Summary Sidebar ──────────────────────────────────────────────────────────

function SummaryPanel({ schedules }) {
  const sectionMap = {};
  schedules.forEach(s => {
    const key = s.sectionId;
    if (!sectionMap[key]) sectionMap[key] = { name: s.sectionName, course: s.courseCode, year: s.yearLevel, subjects: [] };
    if (!sectionMap[key].subjects.find(sub => sub.id === s.subjectId)) {
      sectionMap[key].subjects.push({ id: s.subjectId, code: s.subjectCode });
    }
  });

  const sections = Object.values(sectionMap);
  const units = schedules.reduce((sum, s) => sum + (s.units || 3), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Quick stats */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 18, border: "1.5px solid #E8EBF2" }}>
        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "#111827", marginBottom: 14 }}>Summary</h3>
        {[
          ["📚 Subjects",  new Set(schedules.map(s => s.subjectId)).size],
          ["👥 Sections",  sections.length],
          ["🎓 Lectures",  schedules.filter(s => s.sessionType === "LECTURE").length],
          ["🔬 Labs",      schedules.filter(s => s.sessionType === "LABORATORY").length],
          ["⭐ Total Units", units],
        ].map(([label, val]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #F3F4F6", fontSize: 13 }}>
            <span style={{ color: "#6B7280" }}>{label}</span>
            <span style={{ fontWeight: 700, color: "#111827" }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Sections list */}
      {sections.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 14, padding: 18, border: "1.5px solid #E8EBF2" }}>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "#111827", marginBottom: 12 }}>Sections</h3>
          {sections.map((sec, i) => (
            <div key={i} style={{
              background: "#F0FBF4", borderRadius: 10, padding: "10px 12px", marginBottom: 8,
              border: "1px solid #D1FAE5",
            }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#1A5C38" }}>
                {sec.course} Yr{sec.year} – Sec {sec.name}
              </div>
              <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>
                {sec.subjects.map(s => s.code).join(", ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ViewMySchedule() {
  const { user } = useAuth();
  const { schedules, loading, error, fetchPublishedByTeacher } = useSchedule();
  const defaults = getDefaultTerm();

  const [term,  setTerm]  = useState(defaults);
  const [view,  setView]  = useState("list"); // "list" | "grid"
  const [teacherId, setTeacherId] = useState(null);

  // Resolve teacher ID from /teachers/me
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/teachers/me");
        const data = res.data?.data ?? res.data;
        setTeacherId(data?.id ?? user?.userId);
      } catch {
        setTeacherId(user?.userId);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (teacherId) fetchPublishedByTeacher(teacherId, term.semester, term.schoolYear);
  }, [teacherId, term.semester, term.schoolYear]);

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FC", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media print { button, select, aside { display: none !important; } }
      `}</style>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 60%, #40916C 100%)",
        padding: "28px 40px", color: "#fff",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 12, opacity: 0.7, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>
            Teacher Schedule
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, fontWeight: 400 }}>
            My Teaching Schedule
          </h1>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
            {user?.fullName} · {user?.departmentName || "—"}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>

        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "#B91C1C", fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Controls */}
        <div style={{
          background: "#fff", borderRadius: 14, padding: "14px 20px",
          border: "1.5px solid #E8EBF2", marginBottom: 20,
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
        }}>
          <TermSelector semester={term.semester} schoolYear={term.schoolYear} onChange={setTerm} />
          <div style={{ display: "flex", gap: 8 }}>
            {["list","grid"].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 600, border: "1.5px solid",
                  ...(view === v
                    ? { background: "#2D6A4F", color: "#fff", borderColor: "#2D6A4F" }
                    : { background: "#fff", color: "#374151", borderColor: "#E8EBF2" })
                }}
              >
                {v === "list" ? "📋 List" : "📅 Grid"}
              </button>
            ))}
            <button
              onClick={() => window.print()}
              style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                background: "#F3F4F6", color: "#374151", border: "1.5px solid #E8EBF2",
              }}
            >
              🖨️ Print
            </button>
          </div>
        </div>

        {/* Content + sidebar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>

          {/* Main schedule area */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: 24,
            border: "1.5px solid #E8EBF2", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
                Loading schedule…
              </div>
            ) : view === "list" ? (
              <ListView schedules={schedules} />
            ) : (
              <GridView schedules={schedules} />
            )}
          </div>

          {/* Sidebar */}
          <aside>
            {!loading && schedules.length > 0 && <SummaryPanel schedules={schedules} />}
          </aside>

        </div>
      </div>
    </div>
  );
}
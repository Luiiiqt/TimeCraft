import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import useSchedule from "../../hooks/useSchedule";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const DAY_LABELS = { MONDAY:"Monday",TUESDAY:"Tuesday",WEDNESDAY:"Wednesday",THURSDAY:"Thursday",FRIDAY:"Friday",SATURDAY:"Saturday" };

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

const SUBJECT_COLORS = [
  { bg:"#EEF4FF", border:"#6B8FFF", text:"#1E3A9B" },
  { bg:"#F0FBF4", border:"#52C27E", text:"#1A5C38" },
  { bg:"#FFF7ED", border:"#FB923C", text:"#7C2D12" },
  { bg:"#FDF4FF", border:"#C084FC", text:"#6B21A8" },
  { bg:"#FFF1F2", border:"#FB7185", text:"#9F1239" },
  { bg:"#F0F9FF", border:"#38BDF8", text:"#0C4A6E" },
  { bg:"#FEFCE8", border:"#FACC15", text:"#713F12" },
  { bg:"#F0FDFA", border:"#2DD4BF", text:"#134E4A" },
];

// Assign a stable color per subject code
const colorCache = {};
let colorIndex = 0;
function getSubjectColor(code) {
  if (!colorCache[code]) {
    colorCache[code] = SUBJECT_COLORS[colorIndex % SUBJECT_COLORS.length];
    colorIndex++;
  }
  return colorCache[code];
}

// ─── Components ───────────────────────────────────────────────────────────────

function TermSelector({ semester, schoolYear, onChange }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - 2 + i;
    return `${y}-${y+1}`;
  });

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <select
        value={semester}
        onChange={e => onChange({ semester: e.target.value, schoolYear })}
        style={selectStyle}
      >
        {SEMESTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <select
        value={schoolYear}
        onChange={e => onChange({ semester, schoolYear: e.target.value })}
        style={selectStyle}
      >
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

const selectStyle = {
  padding: "8px 14px", borderRadius: 10, border: "1.5px solid #E8EBF2",
  fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#374151",
  background: "#fff", cursor: "pointer", outline: "none",
};

// ─── Grid Cell ────────────────────────────────────────────────────────────────

function ScheduleCell({ entries }) {
  if (!entries || entries.length === 0) return <td style={tdEmpty} />;
  return (
    <td style={{ ...tdBase, verticalAlign: "top", padding: 6 }}>
      {entries.map(e => {
        const c = getSubjectColor(e.subjectCode);
        return (
          <div key={e.id} style={{
            background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 8,
            padding: "6px 8px", marginBottom: 4, fontSize: 11,
          }}>
            <div style={{ fontWeight: 700, color: c.text, marginBottom: 2 }}>{e.subjectCode}</div>
            <div style={{ color: "#4B5563", marginBottom: 2, lineHeight: 1.3 }}>{e.subjectName}</div>
            <div style={{ color: "#6B7280" }}>
              {fmt12(e.startTime1)}–{fmt12(e.endTime1)}
            </div>
            <div style={{ color: "#9CA3AF", marginTop: 2 }}>
              🚪 {e.roomName || e.roomNumber || "—"}
            </div>
          </div>
        );
      })}
    </td>
  );
}

const tdBase = { border: "1px solid #E8EBF2", minWidth: 150, minHeight: 80 };
const tdEmpty = { ...tdBase, background: "#FAFBFC" };

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({ schedules }) {
  if (schedules.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#9CA3AF" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
        <div style={{ fontWeight: 600, fontSize: 16 }}>No schedule found for this term.</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>Try selecting a different semester or school year.</div>
      </div>
    );
  }

  // Group by day
  const byDay = {};
  DAYS.forEach(d => { byDay[d] = []; });
  schedules.forEach(s => {
    if (byDay[s.day1]) byDay[s.day1].push({ ...s, _sessionDay: s.day1, _time: s.startTime1 });
    if (s.day2 && byDay[s.day2]) byDay[s.day2].push({ ...s, _sessionDay: s.day2, _time: s.startTime2 });
  });

  return (
    <div>
      {DAYS.map(day => {
        const entries = byDay[day].sort((a, b) => (a._time || "").localeCompare(b._time || ""));
        if (entries.length === 0) return null;
        return (
          <div key={day} style={{ marginBottom: 24 }}>
            <h3 style={{
              fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "#1E3A9B",
              marginBottom: 10, paddingBottom: 8, borderBottom: "2px solid #EEF4FF",
            }}>
              {DAY_LABELS[day]}
            </h3>
            {entries.map((e, i) => {
              const c = getSubjectColor(e.subjectCode);
              const isDay2 = e._sessionDay === e.day2;
              return (
                <div key={`${e.id}-${i}`} style={{
                  background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 12,
                  padding: "14px 16px", marginBottom: 10, display: "flex", gap: 16, alignItems: "flex-start",
                }}>
                  <div style={{
                    minWidth: 70, textAlign: "center", background: c.border + "22",
                    borderRadius: 8, padding: "6px 4px",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: c.text }}>
                      {fmt12(isDay2 ? e.startTime2 : e.startTime1)}
                    </div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>to</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: c.text }}>
                      {fmt12(isDay2 ? e.endTime2 : e.endTime1)}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: c.text }}>{e.subjectCode}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: "#fff",
                        background: c.border, borderRadius: 5, padding: "1px 6px",
                      }}>{e.sessionType}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>{e.subjectName}</div>
                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6B7280", flexWrap: "wrap" }}>
                      <span>👤 {e.teacherName}</span>
                      <span>🚪 {e.roomName || e.roomNumber}</span>
                      <span>🏫 {e.campusName || e.campusCode}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Grid View ────────────────────────────────────────────────────────────────

function GridView({ schedules }) {
  // Collect all unique time slots
  const timesSet = new Set();
  schedules.forEach(s => {
    if (s.startTime1) timesSet.add(s.startTime1 + "|" + s.endTime1);
    if (s.startTime2) timesSet.add(s.startTime2 + "|" + s.endTime2);
  });
  const times = Array.from(timesSet).sort();

  // Build lookup: day → time → [entries]
  const grid = {};
  DAYS.forEach(d => {
    grid[d] = {};
    times.forEach(t => { grid[d][t] = []; });
  });
  schedules.forEach(s => {
    const t1 = s.startTime1 + "|" + s.endTime1;
    if (grid[s.day1] && grid[s.day1][t1] !== undefined) grid[s.day1][t1].push(s);
    if (s.day2) {
      const t2 = s.startTime2 + "|" + s.endTime2;
      if (grid[s.day2] && grid[s.day2][t2] !== undefined) grid[s.day2][t2].push(s);
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
            <th style={{ ...thStyle, width: 110, background: "#F0F4FF" }}>Time</th>
            {DAYS.map(d => (
              <th key={d} style={{ ...thStyle, background: "#F0F4FF", minWidth: 150 }}>
                {DAY_LABELS[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {times.map(t => {
            const [start, end] = t.split("|");
            return (
              <tr key={t}>
                <td style={{ ...tdBase, background: "#F7F8FC", padding: "8px 10px", textAlign: "center", fontSize: 11, color: "#6B7280", fontWeight: 600 }}>
                  <div>{fmt12(start)}</div>
                  <div style={{ color: "#9CA3AF", marginTop: 2 }}>to</div>
                  <div>{fmt12(end)}</div>
                </td>
                {DAYS.map(d => (
                  <ScheduleCell key={d} entries={grid[d][t]} />
                ))}
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
  textAlign: "center", fontWeight: 700, color: "#1E3A9B",
  fontSize: 12, letterSpacing: "0.3px", fontFamily: "'DM Sans', sans-serif",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ViewTimetable() {
  const { user } = useAuth();
  const { schedules, loading, error, fetchMySchedule } = useSchedule();
  const defaults = getDefaultTerm();

  const [term, setTerm] = useState(defaults);
  const [view, setView] = useState("list"); // "list" | "grid"

  useEffect(() => {
    fetchMySchedule(
      term.semester,
      term.schoolYear,
      user?.sectionId ?? null,
      user?.isIrregular ? {
        courseId: user?.courseId,
        yearLevel: user?.yearLevel,
        section: user?.section,
      } : null
    );
  }, [term.semester, term.schoolYear, user?.sectionId]);

  const handleTermChange = (newTerm) => setTerm(newTerm);

  const handlePrint = () => window.print();

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FC", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @media print {
          button, select { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1A237E 0%, #3949AB 60%, #5C6BC0 100%)",
        padding: "28px 40px", color: "#fff",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4, letterSpacing: "1px", textTransform: "uppercase" }}>
            Student Timetable
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, fontWeight: 400 }}>
            My Class Schedule
          </h1>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
            {user?.courseCode} · Year {user?.yearLevel}
            {user?.isIrregular ? " · Irregular" : user?.section ? ` · Section ${user.section}` : ""}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px" }}>

        {/* Controls */}
        <div style={{
          background: "#fff", borderRadius: 14, padding: "16px 20px",
          border: "1.5px solid #E8EBF2", marginBottom: 20,
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
        }}>
          <TermSelector semester={term.semester} schoolYear={term.schoolYear} onChange={handleTermChange} />

          <div style={{ display: "flex", gap: 8 }}>
            {/* View toggle */}
            {["list","grid"].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 600, border: "1.5px solid",
                  ...(view === v
                    ? { background: "#1A237E", color: "#fff", borderColor: "#1A237E" }
                    : { background: "#fff", color: "#374151", borderColor: "#E8EBF2" })
                }}
              >
                {v === "list" ? "📋 List" : "📅 Grid"}
              </button>
            ))}
            <button
              onClick={handlePrint}
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

        {/* Error */}
        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "#B91C1C", fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Schedule card */}
        <div style={{
          background: "#fff", borderRadius: 16, padding: 24,
          border: "1.5px solid #E8EBF2", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
              <div style={{ fontSize: 32, marginBottom: 8, animation: "spin 1s linear infinite" }}>⏳</div>
              Loading your timetable…
            </div>
          ) : view === "list" ? (
            <ListView schedules={schedules} />
          ) : (
            <GridView schedules={schedules} />
          )}
        </div>

        {/* Legend */}
        {!loading && schedules.length > 0 && (
          <div style={{
            background: "#fff", borderRadius: 12, padding: "14px 20px",
            border: "1.5px solid #E8EBF2", marginTop: 16,
            display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center",
          }}>
            <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>Legend:</span>
            <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: "#6B8FFF", display: "inline-block" }} />
              Lecture
            </span>
            <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: "#52C27E", display: "inline-block" }} />
              Laboratory
            </span>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>
              Total: {schedules.length} {schedules.length === 1 ? "subject" : "subjects"}
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
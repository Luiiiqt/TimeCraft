import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function fmt12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h % 12) || 12)}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
}

function buildTimeslots(schedules) {
  const map = new Map();
  schedules.forEach(s => {
    if (s.startTime1) {
      const k = s.startTime1.substring(0,5);
      if (!map.has(k)) map.set(k, s.endTime1?.substring(0,5));
    }
    if (s.startTime2) {
      const k = s.startTime2.substring(0,5);
      if (!map.has(k)) map.set(k, s.endTime2?.substring(0,5));
    }
  });
  return Array.from(map.entries())
    .map(([start, end], i) => ({
      slot: i + 1,
      display: `${fmt12(start)} – ${fmt12(end)}`,
      startTime: start,
    }))
    .sort((a,b) => a.startTime.localeCompare(b.startTime));
}

const SESSION_COLORS = {
  LABORATORY: { bg: "#FFF3E0", border: "#FB8C00", text: "#E65100", badge: "#FB8C00" },
  LECTURE:    { bg: "#E8F5E9", border: "#43A047", text: "#1B5E20", badge: "#43A047" },
  DEFAULT:    { bg: "#E3F2FD", border: "#1E88E5", text: "#0D47A1", badge: "#1E88E5" },
};

function getColor(sessionType) {
  return SESSION_COLORS[sessionType] ?? SESSION_COLORS.DEFAULT;
}

function SlotCard({ entry }) {
  const color = getColor(entry.sessionType);
  return (
    <div style={{
      background: color.bg,
      border: `1.5px solid ${color.border}`,
      borderRadius: 8,
      padding: "6px 8px",
      height: "100%",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: 2,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: color.text, lineHeight: 1.2 }}>
        {entry.subjectCode}
      </div>
      <div style={{ fontSize: 10, color: color.text, opacity: 0.85, lineHeight: 1.3, flex: 1 }}>
        {entry.subjectName}
      </div>
      <div style={{ fontSize: 9.5, color: color.text, opacity: 0.75 }}>
        {entry.teacherName?.split(" ").slice(-1)[0]}
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap", marginTop: 2 }}>
        <span style={{
          fontSize: 9, background: color.badge, color: "#fff",
          borderRadius: 4, padding: "1px 5px", fontWeight: 600,
        }}>
          {entry.sessionType === "LABORATORY" ? "LAB" : "LEC"}
        </span>
        {entry.roomName && (
          <span style={{ fontSize: 9, color: color.text, opacity: 0.7 }}>
            {entry.roomName.replace(/Computer |Hardware /i, "").slice(0, 14)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function SchedulePrint() {
  const [params] = useSearchParams();
  const courseId   = params.get("courseId");
  const semester   = params.get("semester");
  const schoolYear = params.get("schoolYear");

  const [sections,  setSections]  = useState([]);
  const [sectionId, setSectionId] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [courseName, setCourseName] = useState("");
  const printRef = useRef();

  useEffect(() => {
    if (!courseId || !semester || !schoolYear) return;
    api.get("/sections", { params: { courseId, semester, schoolYear } })
      .then(r => {
        const list = r.data?.data ?? [];
        setSections(list);
        if (list.length > 0) {
          setSectionId(list[0].id);
          setCourseName(list[0].courseName ?? list[0].courseCode ?? "");
        }
      })
      .catch(() => setLoading(false));
  }, [courseId, semester, schoolYear]);

  useEffect(() => {
    if (!sectionId) return;
    setLoading(true);
    api.get(`/schedules/section/${sectionId}`, { params: { semester, schoolYear } })
      .then(r => { setSchedules(r.data?.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sectionId, semester, schoolYear]);

  const currentSection = sections.find(s => s.id === sectionId);

  // Build slot map
  const TIMESLOTS = buildTimeslots(schedules);
  const slotMap = {};
  schedules.forEach(entry => {
    if (entry.day1 && entry.startTime1) {
      const k = `${entry.day1.toUpperCase()}-${entry.startTime1.substring(0,5)}`;
      if (!slotMap[k]) slotMap[k] = [];
      if (!slotMap[k].some(e => e.id === entry.id)) slotMap[k].push(entry);
    }
    if (entry.day2 && entry.startTime2) {
      const k = `${entry.day2.toUpperCase()}-${entry.startTime2.substring(0,5)}`;
      if (!slotMap[k]) slotMap[k] = [];
      if (!slotMap[k].some(e => e.id === entry.id)) slotMap[k].push(entry);
    }
  });
  const totalSubjects = new Set(schedules.map(s => s.subjectId)).size;
  const conflicts     = schedules.filter(s => s.status === "CONFLICTED").length;
  const labCount      = [...new Set(
    schedules
      .filter(s => s.sessionType === "LABORATORY")
      .map(s => s.subjectId)
  )].length;

  function handlePrint() {
    window.print();
  }

  const semLabel = semester === "FIRST" ? "1st Semester"
    : semester === "SECOND" ? "2nd Semester"
    : semester ?? "";

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div style={{ padding: "2rem 2.5rem", fontFamily: "'DM Sans', sans-serif", maxWidth: 1200 }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
              Class Timetable
            </h1>
            <p style={{ color: "#6B7280", fontSize: 13, margin: "4px 0 0" }}>
              {courseName} · {semLabel} · {schoolYear}
            </p>
          </div>
          <div className="no-print" style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handlePrint}
              style={{
                padding: "8px 18px", borderRadius: 8, fontSize: 13,
                background: "#1B5E20", color: "#fff", border: "none",
                cursor: "pointer", fontWeight: 600,
              }}>
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* ── Section selector + stats ── */}
        <div className="no-print" style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>SECTION</label>
            <select
              value={sectionId ?? ""}
              onChange={e => setSectionId(Number(e.target.value))}
              style={{ padding: "6px 12px", borderRadius: 7, border: "1.5px solid #D1D5DB", fontSize: 13 }}>
              {sections.map(s => (
                <option key={s.id} value={s.id}>
                  Year {s.yearLevel}-{s.sectionName}
                </option>
              ))}
            </select>
          </div>

          {/* Stat pills */}
          {[
            { label: "Subjects", value: totalSubjects, color: "#1B5E20" },
            { label: "Lab slots", value: labCount,     color: "#E65100" },
            { label: "Conflicts", value: conflicts,    color: conflicts > 0 ? "#B91C1C" : "#6B7280" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: "#F9FAFB", border: "1px solid #E5E7EB",
              borderRadius: 8, padding: "6px 14px", textAlign: "center",
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Timetable ── */}
        <div id="print-area" ref={printRef}>

          {/* Print header (hidden on screen) */}
          <div style={{ display: "none" }} className="print-only">
            <p style={{ fontSize: 12, color: "#374151", marginBottom: 8 }}>
              {courseName} · Year {currentSection?.yearLevel}-{currentSection?.sectionName} · {semLabel} {schoolYear}
            </p>
          </div>

          <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #E5E7EB", background: "#fff" }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
                Loading schedule…
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                <thead>
                  <tr>
                    <th style={thStyle("#F9FAFB", 90)}>Time</th>
                    {DAYS.map(day => (
                      <th key={day} style={thStyle("#F9FAFB")}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#3B6D3B", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                          {day}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIMESLOTS.map(({ slot, display, startTime }) => (
                    <tr key={slot}>
                      <td style={{
                        padding: "8px 10px", borderBottom: "1px solid #F3F4F6",
                        borderRight: "1px solid #E5E7EB", background: "#FAFAFA",
                        verticalAlign: "middle", minWidth: 90,
                      }}>
                        <div style={{ fontSize: 10, color: "#6B7280", textAlign: "right", lineHeight: 1.4 }}>
                          {display}
                        </div>
                        <div style={{ fontSize: 9, color: "#D1D5DB", textAlign: "right" }}>S{slot}</div>
                      </td>
                      {DAYS.map(day => {
                        const entries = slotMap[`${day.toUpperCase()}-${startTime}`] ?? [];
                        return (
                          <td key={day} style={{
                            borderBottom: "1px solid #F3F4F6",
                            borderRight: "1px solid #F3F4F6",
                            padding: 4, minHeight: 80, verticalAlign: "top", height: 80,
                          }}>
                            {entries.length > 0
                              ? entries.map((entry, i) => <SlotCard key={`${entry.id}-${i}`} entry={entry} />)
                              : <div style={{ minHeight: 72 }} />}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Legend ── */}
          <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
            {Object.entries(SESSION_COLORS).filter(([k]) => k !== "DEFAULT").map(([type, color]) => (
              <div key={type} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: color.bg, border: `1.5px solid ${color.border}` }} />
                <span style={{ fontSize: 11, color: "#6B7280" }}>
                  {type === "LABORATORY" ? "Laboratory" : "Lecture"}
                </span>
              </div>
            ))}
            {conflicts > 0 && (
              <div style={{ marginLeft: "auto", fontSize: 11, color: "#B91C1C", fontWeight: 600 }}>
                ⚠ {conflicts} conflict{conflicts > 1 ? "s" : ""} detected — review with admin
              </div>
            )}
          </div>

          {/* Print footer */}
          <div style={{ marginTop: 20, fontSize: 10, color: "#9CA3AF", borderTop: "1px solid #F3F4F6", paddingTop: 8 }}>
            Generated by TimeCraft · {courseName} · {semLabel} {schoolYear}
          </div>
        </div>
      </div>
    </>
  );
}

function thStyle(bg, width) {
  return {
    padding: "10px 8px",
    background: bg,
    borderBottom: "1px solid #E5E7EB",
    borderRight: "1px solid #E5E7EB",
    textAlign: "center",
    fontWeight: 700,
    ...(width ? { width } : {}),
  };
}
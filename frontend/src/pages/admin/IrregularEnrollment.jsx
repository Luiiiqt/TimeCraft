import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

// ── Constants ─────────────────────────────────────────────────────────────────

const CURRENT_SEMESTER = "FIRST";
const CURRENT_YEAR     = "2024-2025";

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function badge(text, color) {
  return (
    <span style={{
      display      : "inline-block",
      padding      : "2px 10px",
      borderRadius : 20,
      fontSize     : 11,
      fontWeight   : 700,
      background   : color + "18",
      color,
      border       : `1px solid ${color}40`,
    }}>
      {text}
    </span>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--grey-500)", display: "block", marginBottom: 4, letterSpacing: "0.04em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Select({ value, onChange, children, style = {} }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        padding      : "7px 10px",
        borderRadius : 7,
        border       : "1.5px solid var(--grey-200)",
        fontSize     : 13,
        width        : "100%",
        background   : "var(--surface-page)",
        color        : "var(--grey-900)",
        fontFamily   : "var(--font-body)",
        ...style,
      }}
    >
      {children}
    </select>
  );
}

// ── Schedule Slot Card ────────────────────────────────────────────────────────

function SlotCard({ slot, selected, conflict, onToggle }) {
  const border = conflict ? "#E24B4A" : selected ? "#34C47C" : "#E0EAE0";
  const bg     = conflict ? "rgba(226,75,74,0.07)" : selected ? "rgba(52,196,124,0.08)" : "#fff";

  return (
    <div
      onClick={() => !conflict && onToggle(slot)}
      style={{
        border       : `2px solid ${border}`,
        borderRadius : 10,
        padding      : "12px 14px",
        background   : bg,
        cursor       : conflict ? "not-allowed" : "pointer",
        transition   : "all 0.15s",
        opacity      : conflict ? 0.7 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--grey-900)", marginBottom: 3 }}>
            {slot.subjectCode} — {slot.subjectName}
          </div>
          <div style={{ fontSize: 12, color: "var(--grey-600)" }}>
            {slot.teacherName}
          </div>
          <div style={{ fontSize: 12, color: "var(--grey-500)", marginTop: 2 }}>
            {slot.day} · {slot.startTime}–{slot.endTime} · {slot.roomName}
          </div>
          <div style={{ marginTop: 4 }}>
            {badge(slot.type === "LABORATORY" ? "Lab" : "Lecture", slot.type === "LABORATORY" ? "#534AB7" : "#185FA5")}
            {" "}
            {badge(slot.section, "#1A6A2A")}
          </div>
        </div>
        {conflict ? (
          <span style={{ fontSize: 18 }} title="Time conflict">⚠️</span>
        ) : selected ? (
          <span style={{ fontSize: 18 }}>✅</span>
        ) : (
          <span style={{ fontSize: 18, opacity: 0.3 }}>◯</span>
        )}
      </div>
      {conflict && (
        <div style={{ marginTop: 6, fontSize: 11, color: "#dc2626", fontWeight: 600 }}>
          Conflict with a selected slot
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function IrregularEnrollment() {
  const { role } = useAuth();

  // Step 1 — pick student
  const [students,        setStudents]        = useState([]);
  const [studentSearch,   setStudentSearch]   = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Step 2 — pick course to browse schedules
  const [courses,         setCourses]         = useState([]);
  const [browseCourse,    setBrowseCourse]     = useState("");
  const [browseYear,      setBrowseYear]       = useState("");

  // Step 3 — available schedule slots
  const [slots,           setSlots]           = useState([]);
  const [loadingSlots,    setLoadingSlots]     = useState(false);

  // Step 4 — selected + conflict state
  const [chosen,          setChosen]          = useState([]);   // array of slot objects

  // Finalise
  const [saving,          setSaving]          = useState(false);
  const [msg,             setMsg]             = useState("");

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 5000); };

  // ── Load irregular students ─────────────────────────────────────────────────

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const res = await api.get("/students", { params: { irregular: true } });
      const raw = res.data?.data ?? res.data ?? [];
      setStudents(Array.isArray(raw) ? raw : []);
    } catch {
      flash("✗ Failed to load irregular students.");
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  const loadCourses = useCallback(async () => {
    try {
      const res = await api.get("/courses");
      setCourses(Array.isArray(res.data?.data ?? res.data) ? (res.data?.data ?? res.data) : []);
    } catch {}
  }, []);

  useEffect(() => { loadStudents(); loadCourses(); }, [loadStudents, loadCourses]);

  // ── Load published slots for selected course/year ──────────────────────────

  const loadSlots = useCallback(async () => {
    if (!browseCourse) return;
    setLoadingSlots(true);
    try {
      const params = {
        courseId   : browseCourse,
        semester   : CURRENT_SEMESTER,
        schoolYear : CURRENT_YEAR,
        status     : "PUBLISHED",
      };
      if (browseYear) params.yearLevel = browseYear;

      const res = await api.get("/schedules", { params });
      const raw = res.data?.data ?? res.data ?? [];
      setSlots(Array.isArray(raw) ? raw : []);
    } catch {
      flash("✗ Failed to load schedule slots.");
    } finally {
      setLoadingSlots(false);
    }
  }, [browseCourse, browseYear]);

  useEffect(() => {
    if (browseCourse) loadSlots();
    else setSlots([]);
  }, [browseCourse, browseYear, loadSlots]);

  // ── Conflict detection ──────────────────────────────────────────────────────

  const hasTimeConflict = (a, b) => {
    if (a.day !== b.day) return false;
    const toMins = (t) => {
      const [h, m] = (t ?? "00:00").split(":").map(Number);
      return h * 60 + m;
    };
    const aS = toMins(a.startTime), aE = toMins(a.endTime);
    const bS = toMins(b.startTime), bE = toMins(b.endTime);
    return aS < bE && bS < aE;
  };

  const isConflict = (slot) =>
    chosen.some(c => c.id !== slot.id && hasTimeConflict(c, slot));

  const isSelected = (slot) => chosen.some(c => c.id === slot.id);

  const toggleSlot = (slot) => {
    if (isSelected(slot)) {
      setChosen(prev => prev.filter(c => c.id !== slot.id));
    } else {
      if (isConflict(slot)) return; // guard (UI already blocks)
      setChosen(prev => [...prev, slot]);
    }
  };

  // ── Finalise enrollment ─────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!selectedStudent) { flash("✗ No student selected."); return; }
    if (chosen.length === 0) { flash("✗ No subjects selected."); return; }

    setSaving(true);
    try {
      await api.post(`/students/${selectedStudent.id}/irregular-enrollment`, {
        scheduleIds: chosen.map(s => s.id),
        semester   : CURRENT_SEMESTER,
        schoolYear : CURRENT_YEAR,
      });
      flash("✓ Enrollment saved successfully.");
      setChosen([]);
      setSelectedStudent(null);
      setStudentSearch("");
    } catch (e) {
      flash("✗ " + (e.response?.data?.message ?? "Failed to save enrollment."));
    } finally {
      setSaving(false);
    }
  };

  // ── Filtered student list ───────────────────────────────────────────────────

  const filteredStudents = students.filter(s => {
    const q = studentSearch.toLowerCase();
    return (
      !q ||
      s.fullName?.toLowerCase().includes(q) ||
      s.schoolId?.toLowerCase().includes(q)
    );
  });

  // ── Group slots by subject ──────────────────────────────────────────────────

  const groupedSlots = slots.reduce((acc, slot) => {
    const key = slot.subjectCode ?? slot.subject?.code ?? "?";
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fade-in">

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Irregular Student Enrollment</h1>
        <p className="page-subtitle">
          Assign irregular students to published schedule slots · {CURRENT_SEMESTER} Semester · {CURRENT_YEAR}
        </p>
      </div>

      {/* Flash */}
      {msg && (
        <div style={{
          padding      : "10px 16px",
          borderRadius : 8,
          marginBottom : 16,
          fontSize     : 13,
          fontWeight   : 600,
          background   : msg.startsWith("✓") ? "#dcfce7" : "#fee2e2",
          color        : msg.startsWith("✓") ? "#16a34a" : "#dc2626",
          border       : `1px solid ${msg.startsWith("✓") ? "#bbf7d0" : "#fecaca"}`,
        }}>
          {msg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "flex-start" }}>

        {/* ── Left: Student picker ─────────────────────────────────────────── */}
        <div>
          <div style={{ background: "var(--surface-card)", borderRadius: 12, border: "1px solid var(--grey-200)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--grey-200)", background: "var(--grey-50, #f9fafb)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--grey-500)", letterSpacing: "0.05em", marginBottom: 8 }}>
                IRREGULAR STUDENTS
              </div>
              <input
                placeholder="🔍  Search name or ID…"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                style={{
                  width        : "100%",
                  padding      : "7px 10px",
                  borderRadius : 7,
                  border       : "1.5px solid var(--grey-200)",
                  fontSize     : 13,
                  background   : "var(--surface-page)",
                  color        : "var(--grey-900)",
                  fontFamily   : "var(--font-body)",
                  boxSizing    : "border-box",
                }}
              />
            </div>
            <div style={{ maxHeight: 420, overflowY: "auto" }}>
              {loadingStudents ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--grey-400)", fontSize: 13 }}>Loading…</div>
              ) : filteredStudents.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--grey-400)", fontSize: 13 }}>No irregular students found.</div>
              ) : filteredStudents.map(s => {
                const profile  = s.studentProfile ?? s.profile ?? {};
                const isActive = selectedStudent?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => { setSelectedStudent(s); setChosen([]); }}
                    style={{
                      padding     : "11px 16px",
                      borderBottom: "1px solid var(--grey-100)",
                      cursor      : "pointer",
                      background  : isActive ? "rgba(52,196,124,0.08)" : "transparent",
                      borderLeft  : isActive ? "3px solid #34C47C" : "3px solid transparent",
                      transition  : "all 0.12s",
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--grey-50, #f9fafb)"; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--grey-900)" }}>{s.fullName}</div>
                    <div style={{ fontSize: 11, color: "var(--grey-500)", marginTop: 2 }}>
                      {s.schoolId} · {profile?.course?.code ?? "—"} · {profile?.yearLevel ? `${profile.yearLevel}${["st","nd","rd","th"][profile.yearLevel-1]??""} Year` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Refresh */}
          <button
            onClick={loadStudents}
            style={{
              marginTop    : 8,
              width        : "100%",
              padding      : "7px",
              borderRadius : 7,
              border       : "1.5px solid var(--grey-200)",
              background   : "transparent",
              fontSize     : 12,
              color        : "var(--grey-600)",
              cursor       : "pointer",
              fontWeight   : 600,
            }}
          >
            ↻ Refresh List
          </button>
        </div>

        {/* ── Right: Schedule picker ───────────────────────────────────────── */}
        <div>
          {!selectedStudent ? (
            <div style={{
              background   : "var(--surface-card)",
              borderRadius : 12,
              border       : "2px dashed var(--grey-200)",
              padding      : "60px 40px",
              textAlign    : "center",
              color        : "var(--grey-400)",
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>👈</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Select an irregular student to begin enrollment</div>
            </div>
          ) : (
            <div>
              {/* Student summary bar */}
              <div style={{
                background   : "rgba(52,196,124,0.07)",
                border       : "1.5px solid rgba(52,196,124,0.25)",
                borderRadius : 10,
                padding      : "12px 16px",
                marginBottom : 16,
                display      : "flex",
                justifyContent: "space-between",
                alignItems   : "center",
                flexWrap     : "wrap",
                gap          : 8,
              }}>
                <div>
                  <span style={{ fontSize:14, fontWeight:700, color:"#112A17" }}>{selectedStudent.fullName}</span>
                  <span style={{ fontSize:12, color:"#34C47C", marginLeft:10 }}>
                    {selectedStudent.schoolId} · Irregular
                  </span>
                </div>
                <div style={{ fontSize:13, color:"#1A6A2A", fontWeight:600 }}>
                  {chosen.length} subject{chosen.length !== 1 ? "s" : ""} selected
                </div>
              </div>

              {/* Course / Year filter */}
              <div style={{
                background   : "var(--surface-card)",
                borderRadius : 10,
                border       : "1px solid var(--grey-200)",
                padding      : "12px 16px",
                marginBottom : 16,
                display      : "flex",
                gap          : 12,
                flexWrap     : "wrap",
                alignItems   : "flex-end",
              }}>
                <FieldGroup label="BROWSE COURSE">
                  <Select value={browseCourse} onChange={e => { setBrowseCourse(e.target.value); setSlots([]); setChosen([]); }} style={{ minWidth: 160, width: "auto" }}>
                    <option value="">Select course…</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
                  </Select>
                </FieldGroup>
                <FieldGroup label="YEAR LEVEL">
                  <Select value={browseYear} onChange={e => setBrowseYear(e.target.value)} style={{ minWidth: 130, width: "auto" }}>
                    <option value="">All Years</option>
                    {[1,2,3,4].map(y => <option key={y} value={y}>{y === 1 ? "1st" : y === 2 ? "2nd" : y === 3 ? "3rd" : "4th"} Year</option>)}
                  </Select>
                </FieldGroup>
                <button
                  onClick={loadSlots}
                  disabled={!browseCourse}
                  style={{
                    padding      : "7px 14px",
                    borderRadius : 7,
                    border       : "none",
                    background   : !browseCourse ? "#E8EEE8" : "#1A6A2A",
                    color        : !browseCourse ? "#AAC8AA" : "#fff",
                    fontSize     : 13,
                    fontWeight   : 600,
                    cursor       : !browseCourse ? "not-allowed" : "pointer",
                  }}
                >
                  Load Slots
                </button>
              </div>

              {/* Slot cards grouped by subject */}
              {loadingSlots ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--grey-400)", fontSize: 14 }}>Loading schedule slots…</div>
              ) : !browseCourse ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--grey-400)", fontSize: 14 }}>
                  Select a course above to see available schedules.
                </div>
              ) : Object.keys(groupedSlots).length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--grey-400)", fontSize: 14 }}>
                  No published schedules found for the selected filters.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {Object.entries(groupedSlots).map(([subjectCode, subjectSlots]) => (
                    <div key={subjectCode} style={{ background: "var(--surface-card)", borderRadius: 12, border: "1px solid var(--grey-200)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                      <div style={{ padding: "10px 16px", background: "var(--grey-50, #f9fafb)", borderBottom: "1px solid var(--grey-200)" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--grey-800)" }}>{subjectCode}</span>
                        <span style={{ fontSize: 12, color: "var(--grey-500)", marginLeft: 8 }}>
                          {subjectSlots[0]?.subjectName ?? ""}
                        </span>
                      </div>
                      <div style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                        {subjectSlots.map(slot => (
                          <SlotCard
                            key={slot.id}
                            slot={slot}
                            selected={isSelected(slot)}
                            conflict={!isSelected(slot) && isConflict(slot)}
                            onToggle={toggleSlot}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chosen summary + Save */}
              {chosen.length > 0 && (
                <div style={{
                  marginTop    : 20,
                  background   : "var(--surface-card)",
                  borderRadius : 12,
                  border       : "1.5px solid rgba(52,196,124,0.25)",
                  padding      : "16px 20px",
                  boxShadow    : "var(--shadow-sm)",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--grey-800)", marginBottom: 10 }}>
                    Selected Subjects ({chosen.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                    {chosen.map(s => (
                      <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                        <span>
                          <strong>{s.subjectCode}</strong> — {s.day} · {s.startTime}–{s.endTime} · {s.roomName}
                          {" "}{badge(s.type === "LABORATORY" ? "Lab" : "Lecture", s.type === "LABORATORY" ? "#534AB7" : "#185FA5")}
                        </span>
                        <button
                          onClick={() => setChosen(prev => prev.filter(c => c.id !== s.id))}
                          style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 14, fontWeight: 700 }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      padding      : "9px 24px",
                      borderRadius : 8,
                      border       : "none",
                      background   : saving ? "#AAC8AA" : "#1A6A2A",
                      color        : "#fff",
                      fontWeight   : 700,
                      fontSize     : 13,
                      cursor       : saving ? "not-allowed" : "pointer",
                    }}
                  >
                    {saving ? "Saving…" : `Finalise Enrollment for ${selectedStudent.fullName}`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
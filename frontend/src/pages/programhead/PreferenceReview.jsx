import { useState, useEffect } from "react";
import api from "../../services/api";

const SEMESTER_OPTIONS = [
  { value: "FIRST",  label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "SUMMER", label: "Summer" },
];
const SCHOOL_YEARS = ["2024-2025", "2025-2026", "2026-2027"];

function getCurrentTerm() {
  const m = new Date().getMonth() + 1, y = new Date().getFullYear();
  return { semester: m >= 1 && m <= 10 ? "FIRST" : "SECOND", schoolYear: `${y}-${y + 1}` };
}

function initials(name) {
  return (name ?? "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

function Avatar({ name, size = 36, selected }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: selected ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)",
      border: `1.5px solid ${selected ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.12)"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.33), fontWeight: 700,
      color: selected ? "#86EFAC" : "rgba(255,255,255,0.5)",
      fontFamily: "'DM Mono', monospace",
      transition: "all 0.2s ease",
    }}>{initials(name)}</div>
  );
}

const STATUS_STYLE = {
  APPROVED: { bg: "rgba(34,197,94,0.12)",  text: "#86EFAC",  border: "rgba(34,197,94,0.3)" },
  REJECTED: { bg: "rgba(239,68,68,0.12)",  text: "#FCA5A5",  border: "rgba(239,68,68,0.3)" },
  PENDING:  { bg: "rgba(245,158,11,0.12)", text: "#FCD34D",  border: "rgba(245,158,11,0.3)" },
};

export default function PreferenceReview() {
  const [term, setTerm] = useState(getCurrentTerm());
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [grouped, setGrouped] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [modalTeacher, setModalTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [applying, setApplying] = useState({});

  useEffect(() => {
    api.get("/program-head/my-courses")
      .then(r => {
        const list = r.data?.data ?? [];
        setCourses(list);
        if (list.length > 0) setSelectedCourseId(list[0].id);
      }).catch(() => {});
  }, []);

  const load = async () => {
    if (!selectedCourseId) return;
    setLoading(true); setError("");
    try {
      const [gRes, allGRes, tRes] = await Promise.all([
        api.get(`/program-head/preferences/grouped?semester=${term.semester}&schoolYear=${term.schoolYear}&courseId=${selectedCourseId}`),
        api.get(`/program-head/preferences/grouped?semester=${term.semester}&schoolYear=${term.schoolYear}`),
        api.get(`/program-head/teachers`),
      ]);
      const data = gRes.data?.data ?? [];
      const allData = allGRes.data?.data ?? [];
      setGrouped(data);

      const prefMap = new Map();
      allData.forEach(group => {
        (group.preferences ?? []).forEach(p => {
          const t = p.teacher;
          if (!t) return;
          if (!prefMap.has(t.id)) prefMap.set(t.id, []);
          prefMap.get(t.id).push({
            subjectId: group.subject?.id,
            subjectName: group.subject?.name,
            subjectCode: group.subject?.code,
            status: p.status,
          });
        });
      });

      setTeachers((tRes.data?.data ?? []).map(t => ({ ...t, preferences: prefMap.get(t.id) ?? [] })));
    } catch {
      setError("Failed to load preferences.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [term, selectedCourseId]);

  const handleAssign = async (subjectId, subjectName) => {
    if (!selectedTeacher) return;
    setApplying(p => ({ ...p, [subjectId]: true }));
    setError(""); setSuccess("");
    try {
      const res = await api.post("/program-head/assignments", {
        subjectId:  Number(subjectId),
        teacherId:  Number(selectedTeacher.id),
        semester:   term.semester,
        schoolYear: term.schoolYear,
      });
      const assignmentId = res.data?.data?.id;
      if (assignmentId) await api.put(`/program-head/assignments/${assignmentId}/finalize`);
      setSuccess(`${selectedTeacher.fullName} assigned to "${subjectName}".`);
      load();
    } catch (e) {
      setError(e.response?.data?.message ?? "Failed to apply assignment.");
    } finally {
      setApplying(p => ({ ...p, [subjectId]: false }));
    }
  };

  const teacherVotedFor = (subjectId) =>
    selectedTeacher?.preferences?.some(p => p.subjectId === subjectId) ?? false;

  const selectStyle = {
    padding: "8px 12px", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 9,
    background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13,
    fontFamily: "'DM Sans', sans-serif", outline: "none", cursor: "pointer",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060D1A", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        select { color-scheme: dark; }
        .teacher-card:hover { border-color: rgba(255,255,255,0.15) !important; }
        .subject-row:hover { background: rgba(255,255,255,0.02) !important; }
      `}</style>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "5%", left: "40%", width: 550, height: 550, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at 50% 20%, black 20%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 20%, black 20%, transparent 70%)",
        }} />
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 40px 60px", position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)",
            borderRadius: 100, padding: "4px 14px", marginBottom: 14,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#8B5CF6", display: "inline-block" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#C4B5FD", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
              Preference Review & Assignment
            </span>
          </div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 6 }}>
            Assign Teachers
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.6 }}>
            Select a teacher on the left, then assign them to a subject they voted for.
          </p>
        </div>

        {/* ── Filters ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap", alignItems: "center" }}>
          {courses.length > 0 && (
            <select
              value={selectedCourseId ?? ""}
              onChange={e => { setSelectedCourseId(Number(e.target.value)); setSelectedTeacher(null); }}
              style={{ ...selectStyle, border: "1px solid rgba(59,130,246,0.4)", color: "#93C5FD", fontWeight: 700 }}
            >
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          )}
          <select value={term.semester} onChange={e => setTerm(t => ({ ...t, semester: e.target.value }))} style={selectStyle}>
            {SEMESTER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={term.schoolYear} onChange={e => setTerm(t => ({ ...t, schoolYear: e.target.value }))} style={selectStyle}>
            {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* ── Alerts ── */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "#FCA5A5", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "#86EFAC", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <span>✅</span> {success}
          </div>
        )}

        {loading ? (
          <div style={{ padding: "80px 0", textAlign: "center", color: "rgba(255,255,255,0.25)", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
            Loading preferences…
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, alignItems: "start" }}>

            {/* ── LEFT: Teachers ── */}
            <div style={{
              background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: 14,
              display: "flex", flexDirection: "column", gap: 8,
              position: "sticky", top: 24,
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'DM Mono', monospace", margin: "0 0 4px" }}>
                Teachers
              </p>

              {teachers.length === 0 ? (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", padding: "12px 0" }}>No teachers found.</p>
              ) : teachers.map(t => {
                const isSelected = selectedTeacher?.id === t.id;
                return (
                  <div
                    key={t.id}
                    className="teacher-card"
                    onClick={() => setSelectedTeacher(isSelected ? null : t)}
                    style={{
                      border: `1px solid ${isSelected ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: 11, padding: "11px 13px",
                      background: isSelected ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <Avatar name={t.fullName} size={34} selected={isSelected} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? "#86EFAC" : "#F1F5F9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.fullName}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>{t.preferences.length} vote{t.preferences.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setModalTeacher(t); }}
                      style={{
                        width: "100%", padding: "5px 0", fontSize: 12, fontWeight: 600,
                        background: "transparent",
                        border: `1px solid ${isSelected ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
                        borderRadius: 7, cursor: "pointer",
                        color: isSelected ? "#86EFAC" : "rgba(255,255,255,0.4)",
                        fontFamily: "'DM Sans', sans-serif",
                        transition: "all 0.15s ease",
                      }}
                    >
                      View Preferences
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ── RIGHT: Subjects ── */}
            <div style={{
              background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: 14,
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'DM Mono', monospace", margin: "0 0 4px" }}>
                {selectedTeacher
                  ? `Subjects — assigning to ${selectedTeacher.fullName.split(" ").slice(-1)[0]}`
                  : "Subjects — select a teacher first"}
              </p>

              {grouped.length === 0 ? (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", padding: "32px 0", textAlign: "center" }}>No preferences for this term yet.</p>
              ) : grouped.map(group => {
                const subjectId = group.subject?.id;
                const isAssigned = group.assigned === true;
                const voted = teacherVotedFor(subjectId);
                const canAssign = !!selectedTeacher && voted && !isAssigned;
                const voterCount = (group.preferences ?? []).length;
                const voterNames = (group.preferences ?? []).map(p => p.teacher?.fullName?.split(" ").slice(-1)[0]).join(", ");

                let cardBorder = "rgba(255,255,255,0.07)";
                let cardBg = "rgba(255,255,255,0.02)";
                if (isAssigned) { cardBorder = "rgba(34,197,94,0.3)"; cardBg = "rgba(34,197,94,0.06)"; }
                else if (voted && selectedTeacher) { cardBorder = "rgba(139,92,246,0.35)"; cardBg = "rgba(139,92,246,0.06)"; }

                return (
                  <div
                    key={subjectId}
                    className="subject-row"
                    style={{
                      border: `1px solid ${cardBorder}`,
                      borderRadius: 11, padding: "12px 16px",
                      background: cardBg,
                      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
                      transition: "background 0.15s",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#F1F5F9" }}>{group.subject?.name}</span>
                        <span style={{ fontSize: 11, color: "#93C5FD", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{group.subject?.code}</span>
                        <span style={{
                          fontSize: 10, padding: "2px 8px", borderRadius: 5, fontWeight: 700,
                          fontFamily: "'DM Mono', monospace",
                          background: group.subject?.hasLab ? "rgba(139,92,246,0.12)" : "rgba(34,197,94,0.12)",
                          color: group.subject?.hasLab ? "#C4B5FD" : "#86EFAC",
                          border: `1px solid ${group.subject?.hasLab ? "rgba(139,92,246,0.3)" : "rgba(34,197,94,0.3)"}`,
                        }}>
                          {group.subject?.hasLab ? "Lec + Lab" : "Lecture"}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>
                        {voterCount} vote{voterCount !== 1 ? "s" : ""}{voterNames ? ` · ${voterNames}` : ""}
                      </p>
                    </div>

                    <div style={{ flexShrink: 0 }}>
                      {isAssigned ? (
                        <span style={{
                          fontSize: 11, background: "rgba(34,197,94,0.15)", color: "#86EFAC",
                          border: "1px solid rgba(34,197,94,0.3)",
                          borderRadius: 7, padding: "4px 12px", fontWeight: 700, fontFamily: "'DM Mono', monospace",
                        }}>✓ Finalized</span>
                      ) : canAssign ? (
                        <button
                          onClick={() => handleAssign(subjectId, group.subject?.name)}
                          disabled={applying[subjectId]}
                          style={{
                            padding: "7px 18px",
                            background: applying[subjectId] ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #22C55E, #16A34A)",
                            color: "#fff", border: "none", borderRadius: 8,
                            fontSize: 12, fontWeight: 700, cursor: applying[subjectId] ? "not-allowed" : "pointer",
                            fontFamily: "'DM Sans', sans-serif",
                            boxShadow: applying[subjectId] ? "none" : "0 4px 14px rgba(34,197,94,0.3)",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {applying[subjectId] ? "Assigning…" : "Assign →"}
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono', monospace" }}>
                          {selectedTeacher ? "Did not vote" : "—"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {modalTeacher && (
        <div
          onClick={() => setModalTeacher(null)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#0D1828",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20, padding: "28px 28px",
              width: 500, maxWidth: "90vw", maxHeight: "80vh", overflowY: "auto",
              boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
            }}
          >
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar name={modalTeacher.fullName} size={44} />
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#F1F5F9", fontFamily: "'Sora', sans-serif" }}>{modalTeacher.fullName}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono', monospace" }}>
                    {modalTeacher.preferences.length} preferred subject{modalTeacher.preferences.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalTeacher(null)}
                style={{
                  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
                  width: 32, height: 32, borderRadius: 8, cursor: "pointer",
                  color: "rgba(255,255,255,0.5)", fontSize: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >×</button>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 16 }} />

            {/* Preferences list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {modalTeacher.preferences.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, padding: "16px 0", textAlign: "center" }}>No preferences submitted.</p>
              ) : modalTeacher.preferences.map((p, i) => {
                const st = STATUS_STYLE[p.status] ?? STATUS_STYLE.PENDING;
                return (
                  <div key={i} style={{
                    border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10,
                    padding: "11px 14px", display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "rgba(255,255,255,0.02)",
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#F1F5F9" }}>{p.subjectName}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#93C5FD", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{p.subjectCode}</p>
                    </div>
                    <span style={{
                      fontSize: 11, padding: "3px 10px", borderRadius: 6, fontWeight: 700,
                      background: st.bg, color: st.text, border: `1px solid ${st.border}`,
                      fontFamily: "'DM Mono', monospace",
                    }}>{p.status ?? "PENDING"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
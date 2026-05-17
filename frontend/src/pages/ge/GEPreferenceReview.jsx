import { useState, useEffect } from "react";
import api from "../../services/api";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes slideUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes modalIn  { from { opacity:0; transform:scale(.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
  @keyframes pulse-glow { 0%,100%{ opacity:0.5; } 50%{ opacity:1; } }

  .tc-select { padding:8px 12px; border-radius:9px; border:1.5px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:#F1F5F9; font-size:13px; font-family:'DM Sans',sans-serif; outline:none; cursor:pointer; transition:border-color .2s; }
  .tc-select:focus { border-color:rgba(6,182,212,0.5); }
  .tc-select option { background:#0f172a; color:#F1F5F9; }

  .tc-teacher-card { border-radius:12px; padding:12px 14px; border:1.5px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.025); cursor:pointer; transition:all .2s ease; }
  .tc-teacher-card:hover { background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.12); }
  .tc-teacher-card.selected { background:rgba(6,182,212,0.08); border-color:rgba(6,182,212,0.35); }

  .tc-subject-row { border-radius:12px; padding:12px 16px; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); transition:all .2s ease; display:flex; justify-content:space-between; align-items:center; gap:12px; }
  .tc-subject-row.voted   { background:rgba(6,182,212,0.06); border-color:rgba(6,182,212,0.2); }
  .tc-subject-row.assigned{ background:rgba(34,197,94,0.06); border-color:rgba(34,197,94,0.2); }

  .tc-btn-assign { padding:6px 18px; border-radius:8px; border:none; background:linear-gradient(135deg,#06B6D4,#0891B2); color:#fff; font-size:12px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s; box-shadow:0 3px 10px rgba(6,182,212,0.25); }
  .tc-btn-assign:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 5px 16px rgba(6,182,212,0.4); }
  .tc-btn-assign:disabled { background:rgba(255,255,255,0.08); box-shadow:none; cursor:not-allowed; }

  .tc-btn-prefs { width:100%; padding:6px 0; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.5); font-size:11px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s; margin-top:10px; }
  .tc-btn-prefs:hover { background:rgba(255,255,255,0.08); color:#fff; }

  .tc-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:50; animation:fadeIn .15s ease; }
  .tc-modal { background:#0D1826; border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:30px 32px; width:480px; max-width:90vw; max-height:80vh; overflow-y:auto; box-shadow:0 40px 80px rgba(0,0,0,0.5); animation:modalIn .25s ease; }

  .tc-pref-item { border-radius:10px; padding:11px 14px; border:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.03); transition:background .15s; }
  .tc-pref-item:hover { background:rgba(255,255,255,0.05); }

  .tc-badge { font-size:11px; padding:3px 10px; border-radius:7px; font-weight:700; font-family:'DM Mono',monospace; letter-spacing:.04em; white-space:nowrap; display:inline-block; }

  ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:99px; }
`;

const SEMESTER_OPTIONS = [
  { value: "FIRST",  label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "SUMMER", label: "Summer" },
];
const SCHOOL_YEARS = ["2024-2025", "2025-2026", "2026-2027"];

function getCurrentTerm() {
  const m = new Date().getMonth() + 1, y = new Date().getFullYear();
  return { semester: m >= 6 && m <= 10 ? "FIRST" : "SECOND", schoolYear: `${y}-${y + 1}` };
}

function initials(name) {
  return (name ?? "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function GEPreferenceReview() {
  const [term,            setTerm]            = useState(getCurrentTerm());
  const [grouped,         setGrouped]         = useState([]);
  const [teachers,        setTeachers]        = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [modalTeacher,    setModalTeacher]    = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState("");
  const [success,         setSuccess]         = useState("");
  const [applying,        setApplying]        = useState({});

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [gRes, tRes] = await Promise.all([
        api.get(`/ge-coordinator/preferences/grouped?semester=${term.semester}&schoolYear=${term.schoolYear}`),
        api.get(`/ge-coordinator/teachers`),
      ]);
      const data = gRes.data?.data ?? [];
      setGrouped(data);

      const prefMap = new Map();
      data.forEach(group => {
        (group.preferences ?? []).forEach(p => {
          const t = p.teacher; if (!t) return;
          if (!prefMap.has(t.id)) prefMap.set(t.id, []);
          prefMap.get(t.id).push({ subjectId: group.subject?.id, subjectName: group.subject?.name, subjectCode: group.subject?.code, status: p.status });
        });
      });
      setTeachers((tRes.data?.data ?? []).map(t => ({ ...t, preferences: prefMap.get(t.id) ?? [] })));
    } catch { setError("Failed to load."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [term]);

  const handleAssign = async (subjectId, subjectName) => {
    if (!selectedTeacher) return;
    setApplying(p => ({ ...p, [subjectId]: true }));
    setError(""); setSuccess("");
    try {
      await api.post("/ge-coordinator/assignments", { subjectId: Number(subjectId), teacherId: Number(selectedTeacher.id), semester: term.semester, schoolYear: term.schoolYear });
      setSuccess(`${selectedTeacher.fullName} assigned to "${subjectName}".`);
      load();
    } catch (e) { setError(e.response?.data?.message ?? "Failed to assign."); }
    finally { setApplying(p => ({ ...p, [subjectId]: false })); }
  };

  const teacherVotedFor = subjectId => selectedTeacher?.preferences?.some(p => p.subjectId === subjectId) ?? false;

  const total     = grouped.length;
  const finalized = grouped.filter(g => g.assigned).length;

  return (
    <div style={{ minHeight: "100vh", background: "#060D1A", color: "#F1F5F9", fontFamily: "'DM Sans',sans-serif", padding: "2rem 2.5rem" }}>
      <style>{STYLES}</style>

      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", right: "15%", width: 540, height: 540, borderRadius: "50%", background: "radial-gradient(circle,rgba(6,182,212,0.07) 0%,transparent 70%)", filter: "blur(60px)", animation: "pulse-glow 9s ease infinite" }} />
        <div style={{ position: "absolute", bottom: "5%", left: "0%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(34,197,94,0.04) 0%,transparent 70%)", filter: "blur(60px)", animation: "pulse-glow 12s ease infinite 4s" }} />
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 24, animation: "slideUp .5s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#06B6D4", boxShadow: "0 0 8px #06B6D4" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#06B6D4", letterSpacing: ".12em", textTransform: "uppercase", fontFamily: "'DM Mono',monospace" }}>GE Coordinator Portal</span>
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", letterSpacing: "-.03em", fontFamily: "'Sora',sans-serif" }}>GE Subject Assignment</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginTop: 4 }}>Select a teacher, then assign them to a minor subject on the right.</p>
        </div>

        {/* Term selectors + mini stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, flexWrap: "wrap", animation: "slideUp .5s ease .06s both" }}>
          <select className="tc-select" value={term.semester} onChange={e => setTerm(t => ({ ...t, semester: e.target.value }))}>
            {SEMESTER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select className="tc-select" value={term.schoolYear} onChange={e => setTerm(t => ({ ...t, schoolYear: e.target.value }))}>
            {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            {[
              { label: "Total Subjects", value: total,     color: "#06B6D4" },
              { label: "Finalized",      value: finalized, color: "#22C55E" },
              { label: "Remaining",      value: total - finalized, color: "#F59E0B" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center", background: "rgba(15,23,42,0.7)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "8px 16px" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: "'Sora',sans-serif", lineHeight: 1 }}>{loading ? "…" : s.value}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "10px 16px", marginBottom: 14, color: "#f87171", fontSize: 13, display: "flex", gap: 8, animation: "slideUp .3s ease" }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10, padding: "10px 16px", marginBottom: 14, color: "#4ADE80", fontSize: 13, display: "flex", gap: 8, animation: "slideUp .3s ease" }}>
            ✅ {success}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: 64, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono',monospace", fontSize: 13 }}>Loading…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, alignItems: "start", animation: "slideUp .4s ease .1s both" }}>

            {/* ── Teacher column ── */}
            <div style={{ background: "rgba(15,23,42,0.72)", backdropFilter: "blur(20px)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "'DM Mono',monospace", marginBottom: 4 }}>GE Teachers</p>

              {teachers.length === 0 ? (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", padding: "16px 0", textAlign: "center" }}>No GE teachers found.</p>
              ) : teachers.map(t => {
                const isSelected = selectedTeacher?.id === t.id;
                return (
                  <div key={t.id} className={`tc-teacher-card${isSelected ? " selected" : ""}`}
                    onClick={() => setSelectedTeacher(isSelected ? null : t)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {/* Avatar */}
                      <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: isSelected ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.06)", border: `1.5px solid ${isSelected ? "rgba(6,182,212,0.5)" : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: isSelected ? "#06B6D4" : "rgba(255,255,255,0.4)", fontFamily: "'DM Mono',monospace" }}>
                        {initials(t.fullName)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? "#E0F2FE" : "#D1D5DB", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.fullName}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono',monospace" }}>{t.preferences.length} subject{t.preferences.length !== 1 ? "s" : ""} voted</p>
                      </div>
                      {isSelected && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#06B6D4", flexShrink: 0, boxShadow: "0 0 6px #06B6D4" }} />}
                    </div>
                    <button className="tc-btn-prefs"
                      style={{ borderColor: isSelected ? "rgba(6,182,212,0.25)" : undefined, color: isSelected ? "#67E8F9" : undefined }}
                      onClick={e => { e.stopPropagation(); setModalTeacher(t); }}>
                      View Preferences →
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ── Subjects column ── */}
            <div style={{ background: "rgba(15,23,42,0.72)", backdropFilter: "blur(20px)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "'DM Mono',monospace", marginBottom: 4 }}>
                GE Subjects {selectedTeacher ? <span style={{ color: "#06B6D4" }}>— assigning to {selectedTeacher.fullName.split(" ").slice(-1)[0]}</span> : "— select a teacher first"}
              </p>

              {grouped.length === 0 ? (
                <div style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>No minor subjects found.</div>
              ) : grouped.map(group => {
                const subjectId = group.subject?.id;
                const isAssigned = group.assigned === true;
                const voted = teacherVotedFor(subjectId);
                const voterNames = (group.preferences ?? []).map(p => p.teacher?.fullName?.split(" ").slice(-1)[0]).join(", ");
                const rowClass = isAssigned ? "tc-subject-row assigned" : (voted && selectedTeacher) ? "tc-subject-row voted" : "tc-subject-row";

                return (
                  <div key={subjectId} className={rowClass}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#F1F5F9" }}>{group.subject?.name}</span>
                        <span className="tc-badge" style={{ background: "rgba(6,182,212,0.1)", color: "#67E8F9", border: "1px solid rgba(6,182,212,0.25)" }}>{group.subject?.code}</span>
                        {voted && selectedTeacher && !isAssigned && (
                          <span className="tc-badge" style={{ background: "rgba(6,182,212,0.08)", color: "#06B6D4", border: "1px solid rgba(6,182,212,0.2)" }}>✓ Voted</span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono',monospace" }}>
                        {(group.preferences ?? []).length} vote{(group.preferences ?? []).length !== 1 ? "s" : ""} · {voterNames || "none"}
                      </p>
                    </div>

                    <div style={{ flexShrink: 0 }}>
                      {isAssigned ? (
                        <span className="tc-badge" style={{ background: "rgba(34,197,94,0.12)", color: "#4ADE80", border: "1px solid rgba(34,197,94,0.25)" }}>✓ Finalized</span>
                      ) : selectedTeacher ? (
                        <button className="tc-btn-assign" onClick={() => handleAssign(subjectId, group.subject?.name)} disabled={applying[subjectId]}>
                          {applying[subjectId] ? "Assigning…" : "Assign"}
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", fontFamily: "'DM Mono',monospace" }}>—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Preferences Modal ── */}
      {modalTeacher && (
        <div className="tc-modal-overlay" onClick={() => setModalTeacher(null)}>
          <div className="tc-modal" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(6,182,212,0.15)", border: "1.5px solid rgba(6,182,212,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#06B6D4", fontFamily: "'DM Mono',monospace", flexShrink: 0 }}>
                {initials(modalTeacher.fullName)}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "'Sora',sans-serif" }}>{modalTeacher.fullName}</p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Subject preferences this semester</p>
              </div>
              <button onClick={() => setModalTeacher(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 4, transition: "color .15s" }}
                onMouseEnter={e => e.target.style.color = "#fff"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.3)"}>×</button>
            </div>

            {/* Badge summary */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <span className="tc-badge" style={{ background: "rgba(6,182,212,0.1)", color: "#67E8F9", border: "1px solid rgba(6,182,212,0.2)" }}>
                {modalTeacher.preferences.length} preference{modalTeacher.preferences.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Preference list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {modalTeacher.preferences.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>No preferences submitted this term.</div>
              ) : modalTeacher.preferences.map((p, i) => (
                <div key={i} className="tc-pref-item">
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#F1F5F9" }}>{p.subjectName}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#67E8F9", fontWeight: 700, fontFamily: "'DM Mono',monospace", marginTop: 3 }}>{p.subjectCode}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
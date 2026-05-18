import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

function getCurrentTerm() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return { semester: month >= 1 && month <= 10 ? "FIRST" : "SECOND", schoolYear: `${year}-${year + 1}` };
}

const SEMESTER_OPTIONS = [
  { value: "FIRST",  label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "SUMMER", label: "Summer" },
];
const SCHOOL_YEARS = ["2024-2025", "2025-2026", "2026-2027"];

const STATUS_STYLE = {
  PENDING:  { bg: "rgba(245,158,11,0.12)",  color: "#FCD34D", border: "rgba(245,158,11,0.28)" },
  APPROVED: { bg: "rgba(34,197,94,0.12)",   color: "#4ADE80", border: "rgba(34,197,94,0.28)" },
  REJECTED: { bg: "rgba(239,68,68,0.1)",    color: "#FCA5A5", border: "rgba(239,68,68,0.25)" },
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes pulse-glow  { 0%,100%{opacity:0.5;} 50%{opacity:1;} }
  @keyframes blink       { 0%,100%{opacity:1;} 50%{opacity:0;} }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }

  /* Page */
  .sp-page { max-width: 1000px; margin: 0 auto; padding: 28px 16px 60px; position: relative; z-index: 1; }

  /* Filters row */
  .sp-filters { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; align-items: center; }

  /* Dark selects */
  .tc-select {
    padding: 8px 26px 8px 11px; border-radius: 9px; font-size: 12px; font-weight: 600;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.75); font-family: 'DM Sans', sans-serif; cursor: pointer;
    outline: none; transition: border-color 0.2s, background 0.2s; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 8px center; flex: 1; min-width: 110px; max-width: 200px;
  }
  .tc-select:focus { border-color: rgba(34,197,94,0.4); background: rgba(255,255,255,0.08); }
  .tc-select option { background: #0F1A2E; color: #fff; }

  /* Table wrapper — scrollable on mobile */
  .sp-table-wrap {
    background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px; overflow: hidden; margin-bottom: 20px;
    overflow-x: auto; -webkit-overflow-scrolling: touch;
  }
  .sp-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 640px; }

  /* Table rows */
  .tc-table-row { border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: background 0.15s; }
  .tc-table-row:hover { background: rgba(255,255,255,0.04); }
  .tc-table-row.selected { background: rgba(59,130,246,0.07); }
  .tc-table-row:last-child { border-bottom: none; }

  /* Save button */
  .tc-save-btn {
    padding: 10px 24px; border-radius: 10px; font-size: 13px; font-weight: 700;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    background: linear-gradient(135deg, #22C55E, #16A34A); color: #fff; border: none;
    box-shadow: 0 4px 16px rgba(34,197,94,0.3); transition: all 0.2s; white-space: nowrap;
  }
  .tc-save-btn:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(34,197,94,0.45); transform: translateY(-1px); }
  .tc-save-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  /* Save row */
  .sp-save-row { display: flex; justify-content: flex-end; }

  @media (min-width: 480px) { .sp-page { padding: 32px 24px 60px; } }
  @media (min-width: 700px) { .sp-page { padding: 36px 32px 60px; } }
  @media (min-width: 900px) { .sp-page { padding: 40px 40px 60px; } .tc-select { flex: 0 0 auto; min-width: 130px; } }

  @media (max-width: 479px) {
    .tc-select { min-width: 100%; max-width: 100%; }
    .sp-filters { gap: 6px; }
    .tc-save-btn { width: 100%; text-align: center; }
    .sp-save-row { justify-content: stretch; }
  }
`;

export default function SubjectPreferences() {
  const { user } = useAuth();
  const [term, setTerm] = useState(getCurrentTerm());
  const [allSubjects, setAllSubjects] = useState([]);
  const [saved, setSaved] = useState([]);
  const [selectedMap, setSelectedMap] = useState({});
  const termKey = `${term.semester}|${term.schoolYear}`;
  const selected = selectedMap[termKey] ?? new Set();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [yearLevel, setYearLevel] = useState("");
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  const loadAllSaved = async () => {
    try {
      const uid = user?.userId ?? user?.id;
      const allTerms = [];
      SCHOOL_YEARS.forEach(sy => SEMESTER_OPTIONS.forEach(sem => allTerms.push({ semester: sem.value, schoolYear: sy })));
      const results = await Promise.all(allTerms.map(t =>
        api.get(`/teachers/${uid}/subject-preferences?semester=${t.semester}&schoolYear=${t.schoolYear}`)
          .then(r => ({ ...t, prefs: r.data?.data ?? [] })).catch(() => ({ ...t, prefs: [] }))
      ));
      setSelectedMap(prev => {
        const next = { ...prev };
        results.forEach(({ semester, schoolYear, prefs }) => {
          if (prefs.length > 0) {
            const key = `${semester}|${schoolYear}`;
            const ids = new Set(next[key] ?? []);
            prefs.forEach(p => { if (p.subject?.id) ids.add(p.subject.id); });
            next[key] = ids;
          }
        });
        return next;
      });
    } catch {}
  };

  const load = async () => {
    setLoading(true);
    try {
      const uid = user?.userId ?? user?.id;
      const [sRes, pRes, aRes] = await Promise.all([
        api.get(`/teachers/${uid}/available-subjects?semester=${term.semester}`),
        api.get(`/teachers/${uid}/subject-preferences?semester=${term.semester}&schoolYear=${term.schoolYear}`),
        api.get(`/teachers/my-assignments?semester=${term.semester}&schoolYear=${term.schoolYear}`),
      ]);
      const all = sRes.data?.data ?? [];
      const prefs = pRes.data?.data ?? [];
      setAllSubjects(all);
      setSaved(prefs);
      setAssignments(aRes.data?.data ?? []);
      setSelectedMap(prev => {
        const next = new Set(prev[termKey] ?? new Set());
        prefs.forEach(p => { if (p.subject?.id) next.add(p.subject.id); });
        return { ...prev, [termKey]: next };
      });
      const seen = new Set(), uniqueCourses = [];
      all.forEach(s => {
        if (s.courseId && !seen.has(s.courseId)) { seen.add(s.courseId); uniqueCourses.push({ id: s.courseId, code: s.courseCode, name: s.courseName }); }
      });
      setCourses(uniqueCourses);
    } catch { setMsg({ type: "error", text: "Failed to load subjects." }); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user?.id ?? user?.userId) { loadAllSaved(); load(); } }, [user]);
  useEffect(() => { if (user?.id ?? user?.userId) load(); }, [term]);

  const toggle = (id) => {
    setSelectedMap(prev => {
      const next = new Set(prev[termKey] ?? new Set());
      next.has(id) ? next.delete(id) : next.add(id);
      return { ...prev, [termKey]: next };
    });
  };

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    try {
      const uid = user?.userId ?? user?.id;
      const entries = Object.entries(selectedMap).filter(([, ids]) => ids.size > 0);
      if (!entries.length) { setMsg({ type: "error", text: "No subjects selected." }); return; }
      await Promise.all(entries.map(([key, ids]) => {
        const [semester, schoolYear] = key.split("|");
        return api.post(`/teachers/${uid}/subject-preferences`, { subjectIds: Array.from(ids), semester, schoolYear, partialUpdate: true });
      }));
      setMsg({ type: "success", text: "Preferences saved successfully." });
      load();
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.message ?? "Failed to save." });
    } finally { setSaving(false); }
  };

  const getStatus = (id) => saved.find(p => p.subject?.id === id)?.status ?? null;

  const filteredSubjects = allSubjects
    .filter(s => !yearLevel || String(s.yearLevel) === yearLevel)
    .filter(s => !selectedCourseId || s.courseId === selectedCourseId)
    .filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i);

  const selectedCount = selected.size;

  return (
    <div style={{ minHeight: "100vh", background: "#060D1A", color: "#fff", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{GLOBAL_CSS}</style>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", right: "10%", width: "min(600px,80vw)", height: "min(600px,80vw)", borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,0.06) 0%,transparent 70%)", filter: "blur(60px)", animation: "pulse-glow 10s ease infinite" }} />
        <div style={{ position: "absolute", bottom: "20%", left: "5%", width: "min(400px,60vw)", height: "min(400px,60vw)", borderRadius: "50%", background: "radial-gradient(circle,rgba(34,197,94,0.05) 0%,transparent 70%)", filter: "blur(60px)", animation: "pulse-glow 8s ease infinite 2s" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)", backgroundSize: "60px 60px", maskImage: "radial-gradient(ellipse at 50% 20%,black 25%,transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 20%,black 25%,transparent 75%)" }} />
      </div>

      <div className="sp-page">

        {/* Header */}
        <div style={{ marginBottom: 26, animation: "fadeSlideUp 0.5s ease both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 100, padding: "4px 14px", marginBottom: 14 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6", display: "inline-block", animation: "blink 2s ease infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#93C5FD", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono',monospace" }}>Subject Preferences</span>
          </div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(1.4rem, 5vw, 2rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 6 }}>
            Choose Your Subjects
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "clamp(13px, 2vw, 14px)", lineHeight: 1.6 }}>
            Select the subjects you want to teach this semester. Your selections are submitted for review.
          </p>
        </div>

        {/* Filters */}
        <div className="sp-filters" style={{ animation: "fadeSlideUp 0.5s ease 0.08s both" }}>
          <select className="tc-select" value={term.semester} onChange={e => setTerm(t => ({ ...t, semester: e.target.value }))}>
            {SEMESTER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select className="tc-select" value={term.schoolYear} onChange={e => setTerm(t => ({ ...t, schoolYear: e.target.value }))}>
            {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="tc-select" value={selectedCourseId ?? ""} onChange={e => setSelectedCourseId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
          <select className="tc-select" value={yearLevel} onChange={e => setYearLevel(e.target.value)}>
            <option value="">All Years</option>
            {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
          </select>

          {selectedCount > 0 && (
            <div style={{ marginLeft: "auto", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 700, color: "#93C5FD", fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" }}>
              {selectedCount} selected
            </div>
          )}
        </div>

        {/* Message */}
        {msg && (
          <div style={{ background: msg.type === "success" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${msg.type === "success" ? "rgba(34,197,94,0.28)" : "rgba(239,68,68,0.25)"}`, borderRadius: 10, padding: "11px 16px", marginBottom: 16, color: msg.type === "success" ? "#4ADE80" : "#FCA5A5", fontSize: 13, display: "flex", alignItems: "center", gap: 8, animation: "fadeSlideUp 0.3s ease both" }}>
            {msg.type === "success" ? "✅" : "❌"} {msg.text}
          </div>
        )}

        {/* Table */}
        <div className="sp-table-wrap" style={{ animation: "fadeSlideUp 0.5s ease 0.12s both" }}>
          <table className="sp-table">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th style={{ padding: "11px 14px", width: 36 }} />
                {["Subject", "Code", "Units", "Session", "Status", "Assignment"].map(h => (
                  <th key={h} style={{ padding: "11px 12px", textAlign: "left", fontWeight: 700, color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: "36px 0", textAlign: "center", color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono',monospace", fontSize: 13 }}>Loading subjects…</td></tr>
              ) : filteredSubjects.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "36px 0", textAlign: "center", color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono',monospace", fontSize: 13 }}>No subjects found.</td></tr>
              ) : filteredSubjects.map(s => {
                const checked = selected.has(s.id);
                const status = getStatus(s.id);
                const sc = status ? STATUS_STYLE[status] : null;
                const assignment = assignments.find(a => a.subject?.id === s.id);
                return (
                  <tr key={s.id} className={`tc-table-row${checked ? " selected" : ""}`} onClick={() => toggle(s.id)}>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <div style={{ width: 15, height: 15, borderRadius: 4, border: `2px solid ${checked ? "#3B82F6" : "rgba(255,255,255,0.2)"}`, background: checked ? "#3B82F6" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", margin: "0 auto", transition: "all 0.15s" }}>
                        {checked ? "✓" : ""}
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: checked ? 600 : 400, color: checked ? "#fff" : "rgba(255,255,255,0.7)" }}>{s.name}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 12, color: "#3B82F6" }}>{s.code}</span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" }}>{s.units ?? "—"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, fontWeight: 700, fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em", background: s.hasLab ? "rgba(34,197,94,0.1)" : "rgba(59,130,246,0.1)", color: s.hasLab ? "#4ADE80" : "#93C5FD", border: `1px solid ${s.hasLab ? "rgba(34,197,94,0.25)" : "rgba(59,130,246,0.25)"}`, whiteSpace: "nowrap" }}>
                        {s.hasLab ? "LEC+LAB" : "LEC"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {sc ? (
                        <span style={{ fontSize: 10, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 6, padding: "3px 8px", fontWeight: 700, fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" }}>{status}</span>
                      ) : <span style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono',monospace" }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {assignment ? (
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, fontWeight: 700, fontFamily: "'DM Mono',monospace", background: assignment.finalized ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", color: assignment.finalized ? "#4ADE80" : "#FCD34D", border: `1px solid ${assignment.finalized ? "rgba(34,197,94,0.25)" : "rgba(245,158,11,0.25)"}`, whiteSpace: "nowrap" }}>
                          {assignment.finalized ? "✓ Assigned" : "Pending"}
                        </span>
                      ) : <span style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono',monospace" }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Save row */}
        <div className="sp-save-row" style={{ animation: "fadeSlideUp 0.5s ease 0.18s both" }}>
          <button className="tc-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "💾 Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
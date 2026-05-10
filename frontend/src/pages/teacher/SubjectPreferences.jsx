import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

function getCurrentTerm() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return {
    semester: month >= 1 && month <= 10 ? "FIRST" : "SECOND",
    schoolYear: `${year}-${year + 1}`,
  };
}
const SEMESTER_OPTIONS = [
  { value: "FIRST", label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "SUMMER", label: "Summer" },
];
const SCHOOL_YEARS = ["2024-2025", "2025-2026", "2026-2027"];

export default function SubjectPreferences() {
  const { user } = useAuth();
  const [term, setTerm] = useState(getCurrentTerm());
  const [allSubjects, setAllSubjects] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [saved, setSaved] = useState([]);
  const [selectedMap, setSelectedMap] = useState({}); // { "FIRST|2026-2027": Set([id1, id2]) }
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
      SCHOOL_YEARS.forEach(sy => {
        SEMESTER_OPTIONS.forEach(sem => {
          allTerms.push({ semester: sem.value, schoolYear: sy });
        });
      });
      const results = await Promise.all(
        allTerms.map(t =>
          api.get(`/teachers/${uid}/subject-preferences?semester=${t.semester}&schoolYear=${t.schoolYear}`)
            .then(r => ({ ...t, prefs: r.data?.data ?? [] }))
            .catch(() => ({ ...t, prefs: [] }))
        )
      );
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
      // Derive unique courses from subjects
      const uniqueCourses = [];
      const seen = new Set();
      all.forEach(s => {
        if (s.courseId && !seen.has(s.courseId)) {
          seen.add(s.courseId);
          uniqueCourses.push({ id: s.courseId, code: s.courseCode, name: s.courseName });
        }
      });
      setCourses(uniqueCourses);
    } catch {
      setMsg({ type: "error", text: "Failed to load subjects." });
    } finally {
      setLoading(false);
    }
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
      if (entries.length === 0) {
        setMsg({ type: "error", text: "No subjects selected." });
        return;
      }
      await Promise.all(entries.map(([key, ids]) => {
        const [semester, schoolYear] = key.split("|");
        return api.post(`/teachers/${uid}/subject-preferences`, {
          subjectIds: Array.from(ids),
          semester,
          schoolYear,
          partialUpdate: true,
        });
      }));
      setMsg({ type: "success", text: "✅ Preferences saved!" });
      load();
    } catch (e) {
      setMsg({ type: "error", text: "❌ " + (e.response?.data?.message ?? "Failed to save.") });
    } finally {
      setSaving(false);
    }
  };

  const getStatus = (subjectId) => {
    const pref = saved.find(p => p.subject?.id === subjectId);
    return pref?.status ?? null;
  };

  const STATUS_COLOR = {
    PENDING: { bg: "#fef3c7", color: "#92400e" },
    APPROVED: { bg: "#d1fae5", color: "#065f46" },
    REJECTED: { bg: "#fee2e2", color: "#991b1b" },
  };

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 900, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: 4 }}>Subject Preferences</h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>
        Select the subjects you want to teach this semester.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <select value={term.semester} onChange={e => { setTerm(t => ({ ...t, semester: e.target.value })); }} style={{ padding: "7px 10px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
          {SEMESTER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={term.schoolYear} onChange={e => { setTerm(t => ({ ...t, schoolYear: e.target.value })); }} style={{ padding: "7px 10px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
          {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={selectedCourseId ?? ""} onChange={e => setSelectedCourseId(e.target.value ? Number(e.target.value) : null)}
          style={{ padding: "7px 10px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
          <option value="">All Courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
        </select>
        <select value={yearLevel} onChange={e => setYearLevel(e.target.value)}
          style={{ padding: "7px 10px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
          <option value="">All Year Levels</option>
          <option value="1">Year 1</option>
          <option value="2">Year 2</option>
          <option value="3">Year 3</option>
          <option value="4">Year 4</option>
        </select>
      </div>

      {msg && (
        <div style={{ background: msg.type === "success" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: msg.type === "success" ? "#15803d" : "#dc2626", fontSize: 13 }}>
          {msg.text}
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1.5px solid #e5e7eb" }}>
              <th style={{ padding: "10px 14px", width: 40 }}></th>
              {["Subject", "Code", "Units", "Session Type", "Status", "Assignment"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>Loading…</td></tr>
            ) : allSubjects.filter(s => !yearLevel || String(s.yearLevel) === yearLevel).filter(s => !selectedCourseId || s.courseId === selectedCourseId).filter((s, idx, arr) => arr.findIndex(x => x.id === s.id && (selectedCourseId ? x.courseId === s.courseId : true) && (yearLevel ? x.yearLevel === s.yearLevel : true)) === idx).map(s => {
              const checked = selected.has(s.id);
              const status = getStatus(s.id);
              const sc = status ? STATUS_COLOR[status] : null;
              return (
                <tr key={s.id} onClick={() => toggle(s.id)}
                  style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer", background: checked ? "#eff6ff" : "transparent" }}>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(s.id)}
                      onClick={e => e.stopPropagation()}
                      style={{ width: 15, height: 15, accentColor: "#1a56db" }} />
                  </td>
                  <td style={{ padding: "10px 14px", fontWeight: checked ? 600 : 400 }}>{s.name}</td>
                  <td style={{ padding: "10px 14px", color: "#1a56db", fontWeight: 600 }}>{s.code}</td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>{s.units ?? "—"}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 600,
                      background: s.hasLab ? "#f0fdf4" : "#fef9ee",
                      color: s.hasLab ? "#15803d" : "#92400e"
                    }}>
                      {s.hasLab ? "LECTURE + LAB" : "LECTURE"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {sc ? (
                      <span style={{ fontSize: 11, background: sc.bg, color: sc.color, borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>
                        {status}
                      </span>
                    ) : "—"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {(() => {
                      const a = assignments.find(a => a.subject?.id === s.id);
                      if (!a) return <span style={{ color: "#d1d5db", fontSize: 12 }}>—</span>;
                      return (
                        <span style={{
                          fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 600,
                          background: a.finalized ? "#d1fae5" : "#fef3c7",
                          color: a.finalized ? "#065f46" : "#92400e",
                        }}>
                          {a.finalized ? "✓ Assigned" : "Pending"}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleSave} disabled={saving}
          style={{ padding: "10px 24px", background: "#1a56db", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          {saving ? "Saving…" : "💾 Save Preferences"}
        </button>
      </div>
    </div>
  );
}
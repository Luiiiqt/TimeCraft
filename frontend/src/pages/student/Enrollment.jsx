import { useState, useEffect } from "react";
import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

const CURRENT_SEMESTER  = "FIRST";
const CURRENT_YEAR      = "2024-2025";

export default function Enrollment() {
  const { user }            = useAuth();
  const [subjects,    setSubjects]    = useState([]);
  const [enrolled,    setEnrolled]    = useState([]);
  const [selected,    setSelected]    = useState(new Set());
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState("");
  const [search,      setSearch]      = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [subRes, myRes] = await Promise.all([
        api.get("/subjects"),
        api.get("/checklist/my"),
      ]);
      const allSubjects   = subRes.data?.data ?? subRes.data ?? [];
      const myChecklist   = myRes.data?.data  ?? myRes.data  ?? [];
      setSubjects(allSubjects);
      setEnrolled(myChecklist);
      // Pre-tick subjects already enrolled this term
      const currentIds = myChecklist
        .filter(c => c.semester === CURRENT_SEMESTER && c.academicYear === CURRENT_YEAR)
        .map(c => c.subject?.id);
      setSelected(new Set(currentIds));
    } catch {
      setError("Failed to load subjects. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggleSubject(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (selected.size === 0) { setError("Please select at least one subject."); return; }
    setSaving(true); setError(""); setSuccess(false);
    try {
      await api.post("/checklist/enroll", {
        semester:     CURRENT_SEMESTER,
        academicYear: CURRENT_YEAR,
        subjectIds:   [...selected],
      });
      setSuccess(true);
      loadData();
    } catch (e) {
      setError(e.response?.data?.message ?? "Enrollment failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = subjects.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.code?.toLowerCase().includes(search.toLowerCase()) ||
    s.prerequisite?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnits = subjects
    .filter(s => selected.has(s.id))
    .reduce((sum, s) => sum + (s.units || 0), 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Subject Enrollment</h1>
        <p className="page-subtitle">
          {CURRENT_SEMESTER === "FIRST" ? "1st" : CURRENT_SEMESTER === "SECOND" ? "2nd" : "Summer"} Semester · {CURRENT_YEAR}
        </p>
      </div>

      {success && (
        <div style={{ background: "#F0FBF4", border: "1px solid #52C27E", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#1A6640", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          ✅ Enrollment saved successfully!
        </div>
      )}
      {error && (
        <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#B91C1C", fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Summary bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-card)", borderRadius: "var(--radius-xl)", padding: "16px 20px", marginBottom: 20, border: "1.5px solid var(--grey-200)" }}>
        <div style={{ display: "flex", gap: 28 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--brand-secondary)" }}>{selected.size}</div>
            <div style={{ fontSize: 12, color: "var(--grey-500)" }}>Subjects selected</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#0f766e" }}>{totalUnits}</div>
            <div style={{ fontSize: 12, color: "var(--grey-500)" }}>Total units</div>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={saving || selected.size === 0}
        >
          {saving ? "Saving…" : "Confirm Enrollment"}
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          className="form-input"
          placeholder="Search subjects by name, code, or prerequisite…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      {/* Subject checklist table */}
      {loading ? <p>Loading subjects…</p> : (
        <div style={{ background: "var(--surface-card)", borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1.5px solid var(--grey-200)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "var(--grey-50)", borderBottom: "1.5px solid var(--grey-200)" }}>
                <th style={{ padding: "10px 14px", width: 40 }}></th>
                {["Subject Name","Course Code","Units","Session","Prerequisite"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "var(--grey-600)", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const checked = selected.has(s.id);
                return (
                  <tr
                    key={s.id}
                    onClick={() => toggleSubject(s.id)}
                    style={{
                      borderBottom : "1px solid var(--grey-100)",
                      cursor       : "pointer",
                      background   : checked ? "#EEF4FF" : "transparent",
                      transition   : "background 0.15s",
                    }}
                  >
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSubject(s.id)}
                        onClick={e => e.stopPropagation()}
                        style={{ width: 16, height: 16, accentColor: "#3949AB" }}
                      />
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: checked ? 600 : 400 }}>{s.name}</td>
                    <td style={{ padding: "10px 14px", color: "var(--brand-secondary)", fontWeight: 600 }}>{s.code}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 600 }}>{s.units}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: s.sessionType === "LABORATORY" ? "#F0FBF4" : "#FEF9EE", color: s.sessionType === "LABORATORY" ? "#1A6640" : "#92400e", fontWeight: 600 }}>
                        {s.sessionType}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--grey-500)", fontStyle: s.prerequisite ? "normal" : "italic" }}>
                      {s.prerequisite || "None"}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--grey-400)" }}>No subjects found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
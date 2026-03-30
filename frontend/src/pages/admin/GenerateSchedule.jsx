import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useSchedule from "../../hooks/useSchedule";

// ── Options ───────────────────────────────────────────────────────────────────
const SEMESTER_OPTIONS = [
  { value: "FIRST",  label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "SUMMER", label: "Summer" },
];

const SCHOOL_YEARS = ["2024-2025", "2025-2026", "2026-2027"];

// ── Component ─────────────────────────────────────────────────────────────────
export default function GenerateSchedule() {
  const navigate = useNavigate();
  const { generateSchedule, actionLoading } = useSchedule();

  const [form, setForm] = useState({
    semester   : "FIRST",
    schoolYear : "2024-2025",
    autoPublish: false,
  });
  const [result,    setResult]    = useState(null); // generation summary
  const [error,     setError]     = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setResult(null);
    setError("");
    setConfirmed(false);
  };

  const handleGenerate = async () => {
    setError("");
    setResult(null);
    const res = await generateSchedule({
      semester   : form.semester,
      schoolYear : form.schoolYear,
      autoPublish: form.autoPublish,
    });
    if (res.success) {
      setResult(res.data);
    } else {
      setError(res.error ?? "Schedule generation failed.");
    }
    setConfirmed(false);
  };

  const semesterLabel = SEMESTER_OPTIONS.find((s) => s.value === form.semester)?.label;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      {/* Back */}
      <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>
        ← Back to Dashboard
      </button>

      <h1 style={styles.title}>Generate Schedule</h1>
      <p style={styles.subtitle}>
        Run the automated scheduling engine for a given academic term.
      </p>

      <div style={styles.layout}>
        {/* Left — config panel */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Term Configuration</h2>

          <div style={styles.fields}>
            <div style={styles.field}>
              <label style={styles.label}>Semester</label>
              <select name="semester" value={form.semester} onChange={handleChange}
                style={styles.select}>
                {SEMESTER_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>School Year</label>
              <select name="schoolYear" value={form.schoolYear} onChange={handleChange}
                style={styles.select}>
                {SCHOOL_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div style={styles.checkRow}>
              <input type="checkbox" id="autoPublish" name="autoPublish"
                checked={form.autoPublish} onChange={handleChange}
                style={{ accentColor: "#1a56db", width: "16px", height: "16px" }} />
              <label htmlFor="autoPublish" style={styles.checkLabel}>
                Auto-publish if no conflicts detected
              </label>
            </div>
          </div>

          {/* Confirmation step */}
          {!confirmed ? (
            <button
              onClick={() => setConfirmed(true)}
              disabled={actionLoading}
              style={styles.primaryBtn}>
              Review & Generate
            </button>
          ) : (
            <div style={styles.confirmBox}>
              <p style={styles.confirmText}>
                ⚠️ This will replace any existing <strong>draft</strong> schedules
                for <strong>{semesterLabel} {form.schoolYear}</strong>.
                This action cannot be undone.
              </p>
              <div style={styles.confirmBtns}>
                <button onClick={() => setConfirmed(false)} style={styles.cancelBtn}
                  disabled={actionLoading}>
                  Cancel
                </button>
                <button onClick={handleGenerate} style={styles.dangerBtn}
                  disabled={actionLoading}>
                  {actionLoading ? "Generating…" : "Confirm & Generate"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div style={styles.errorBanner}>⚠ {error}</div>
          )}
        </div>

        {/* Right — result panel */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Generation Result</h2>

          {!result && !actionLoading && (
            <div style={styles.emptyResult}>
              <span style={{ fontSize: "3rem" }}>⚡</span>
              <p style={{ color: "#9ca3af", marginTop: "0.75rem" }}>
                Results will appear here after generation.
              </p>
            </div>
          )}

          {actionLoading && (
            <div style={styles.emptyResult}>
              <div style={styles.spinner} />
              <p style={{ color: "#6b7280", marginTop: "1rem" }}>
                Running scheduling engine…
              </p>
            </div>
          )}

          {result && (
            <div style={styles.resultBody}>
              <div style={styles.resultGrid}>
                <ResultStat label="Total Slots"  value={result.total}      color="#1a56db" />
                <ResultStat label="Successful"   value={result.successful} color="#16a34a" />
                <ResultStat label="Conflicted"   value={result.conflicted} color={result.conflicted > 0 ? "#dc2626" : "#16a34a"} />
              </div>

              <div style={styles.resultMeta}>
                <span style={styles.resultTag}>{result.semester}</span>
                <span style={styles.resultTag}>{result.schoolYear}</span>
              </div>

              {result.conflicted === 0 ? (
                <div style={styles.successBanner}>
                  ✓ Schedule generated successfully with no conflicts.
                  {form.autoPublish && " Schedules have been published."}
                </div>
              ) : (
                <div style={styles.warnBanner}>
                  ⚠ {result.conflicted} slot(s) have conflicts. Review them in{" "}
                  <button onClick={() => navigate("/admin/reports")}
                    style={styles.inlineLink}>
                    Reports
                  </button>.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────
function ResultStat({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "2.2rem", fontWeight: "700", color }}>{value}</div>
      <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.2rem" }}>{label}</div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page     : { padding: "2rem 2.5rem", maxWidth: "1000px", margin: "0 auto", fontFamily: "'Sora', 'Segoe UI', sans-serif" },
  backBtn  : { background: "none", border: "none", color: "#1a56db", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", padding: 0, marginBottom: "1.5rem" },
  title    : { fontSize: "1.75rem", fontWeight: "700", color: "#111827", margin: "0 0 0.25rem", letterSpacing: "-0.02em" },
  subtitle : { color: "#6b7280", fontSize: "0.9rem", margin: "0 0 2rem" },
  layout   : { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" },
  card     : { backgroundColor: "#fff", borderRadius: "12px", padding: "1.75rem", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  cardTitle: { fontSize: "1rem", fontWeight: "700", color: "#111827", margin: "0 0 1.25rem" },
  fields   : { display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" },
  field    : { display: "flex", flexDirection: "column", gap: "0.35rem" },
  label    : { fontSize: "0.85rem", fontWeight: "600", color: "#374151" },
  select   : { padding: "0.65rem 0.9rem", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "0.9rem", color: "#111827", backgroundColor: "#fff" },
  checkRow : { display: "flex", alignItems: "center", gap: "0.5rem" },
  checkLabel: { fontSize: "0.88rem", color: "#374151", cursor: "pointer" },
  primaryBtn: { width: "100%", padding: "0.8rem", backgroundColor: "#1a56db", color: "#fff", border: "none", borderRadius: "8px", fontSize: "0.95rem", fontWeight: "600", cursor: "pointer" },
  cancelBtn : { flex: 1, padding: "0.7rem", backgroundColor: "transparent", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "0.9rem", cursor: "pointer", color: "#6b7280", fontWeight: "600" },
  dangerBtn : { flex: 1, padding: "0.7rem", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", fontSize: "0.9rem", fontWeight: "600", cursor: "pointer" },
  confirmBox: { backgroundColor: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "8px", padding: "1rem" },
  confirmText: { fontSize: "0.875rem", color: "#92400e", margin: "0 0 0.75rem", lineHeight: "1.5" },
  confirmBtns: { display: "flex", gap: "0.5rem" },
  errorBanner: { marginTop: "1rem", padding: "0.75rem 1rem", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "0.875rem" },
  emptyResult: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px", textAlign: "center" },
  spinner: { width: "36px", height: "36px", border: "3px solid #e5e7eb", borderTop: "3px solid #1a56db", borderRadius: "50%", animation: "spin 0.7s linear infinite" },
  resultBody: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  resultGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", textAlign: "center", padding: "1rem 0", borderBottom: "1px solid #f3f4f6" },
  resultMeta: { display: "flex", gap: "0.5rem" },
  resultTag : { padding: "0.3rem 0.75rem", backgroundColor: "#f3f4f6", borderRadius: "99px", fontSize: "0.8rem", color: "#374151", fontWeight: "600" },
  successBanner: { backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "0.85rem 1rem", color: "#14532d", fontSize: "0.875rem" },
  warnBanner   : { backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "0.85rem 1rem", color: "#7f1d1d", fontSize: "0.875rem" },
  inlineLink   : { background: "none", border: "none", color: "#dc2626", fontWeight: "700", cursor: "pointer", padding: 0, textDecoration: "underline", fontSize: "0.875rem" },
};
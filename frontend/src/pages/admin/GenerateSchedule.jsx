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

              {result.aiSummary && result.aiSummary !== "AI summary unavailable." && (
                <div style={styles.aiBox}>
                  <div style={styles.aiLabel}>🤖 AI Summary</div>
                  <p style={styles.aiText}>{result.aiSummary}</p>
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
    <div style={{ textAlign:"center" }}>
      <div style={{ fontSize:"2.2rem", fontWeight:"700", color, fontFamily:"'Playfair Display', Georgia, serif" }}>{value}</div>
      <div style={{ fontSize:"0.8rem", color:"#7AAE7A", marginTop:"0.2rem", fontFamily:"'DM Sans', sans-serif" }}>{label}</div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const C = {
  green:     "#1A6A2A",
  greenMid:  "#34C47C",
  greenLight:"#E8F5EC",
  greenBorder:"#D8EAD8",
  text:      "#112A17",
  muted:     "#7AAE7A",
  border:    "#E0EAE0",
  danger:    "#E24B4A",
  dangerBg:  "rgba(226,75,74,0.07)",
  dangerBorder:"rgba(226,75,74,0.25)",
  amber:     "#BA7517",
  amberBg:   "rgba(186,117,23,0.07)",
  amberBorder:"rgba(186,117,23,0.2)",
  blue:      "#185FA5",
  blueBg:    "rgba(24,95,165,0.07)",
};

const styles = {
  page     : { padding:"2rem 2.5rem", maxWidth:"1000px", margin:"0 auto", fontFamily:"'DM Sans', sans-serif" },
  backBtn  : { background:"none", border:"none", color:C.green, cursor:"pointer", fontSize:"0.9rem", fontWeight:"600", padding:0, marginBottom:"1.5rem" },
  title    : { fontFamily:"'Playfair Display', Georgia, serif", fontSize:"1.75rem", fontWeight:"700", color:C.text, margin:"0 0 0.25rem", letterSpacing:"-0.01em" },
  subtitle : { color:C.muted, fontSize:"0.9rem", margin:"0 0 2rem" },
  layout   : { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" },
  card     : { backgroundColor:"#fff", borderRadius:"12px", padding:"1.75rem", border:`1px solid ${C.border}` },
  cardTitle: { fontFamily:"'Playfair Display', Georgia, serif", fontSize:"1rem", fontWeight:"700", color:C.text, margin:"0 0 1.25rem" },
  fields   : { display:"flex", flexDirection:"column", gap:"1rem", marginBottom:"1.5rem" },
  field    : { display:"flex", flexDirection:"column", gap:"0.35rem" },
  label    : { fontSize:"10.5px", fontWeight:"700", color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em" },
  select   : { padding:"0.65rem 0.9rem", border:`1.5px solid ${C.border}`, borderRadius:"8px", fontSize:"0.9rem", color:C.text, backgroundColor:"#fff", fontFamily:"'DM Sans', sans-serif" },
  checkRow : { display:"flex", alignItems:"center", gap:"0.5rem" },
  checkLabel: { fontSize:"0.88rem", color:C.text, cursor:"pointer" },
  primaryBtn: { width:"100%", padding:"0.8rem", backgroundColor:C.green, color:"#fff", border:"none", borderRadius:"8px", fontSize:"0.95rem", fontWeight:"600", cursor:"pointer", fontFamily:"'DM Sans', sans-serif" },
  cancelBtn : { flex:1, padding:"0.7rem", backgroundColor:"transparent", border:`1.5px solid ${C.border}`, borderRadius:"8px", fontSize:"0.9rem", cursor:"pointer", color:C.muted, fontWeight:"600" },
  dangerBtn : { flex:1, padding:"0.7rem", backgroundColor:C.danger, color:"#fff", border:"none", borderRadius:"8px", fontSize:"0.9rem", fontWeight:"600", cursor:"pointer" },
  confirmBox: { backgroundColor:C.amberBg, border:`1px solid ${C.amberBorder}`, borderRadius:"8px", padding:"1rem" },
  confirmText: { fontSize:"0.875rem", color:"#7A4A10", margin:"0 0 0.75rem", lineHeight:"1.5" },
  confirmBtns: { display:"flex", gap:"0.5rem" },
  errorBanner: { marginTop:"1rem", padding:"0.75rem 1rem", backgroundColor:C.dangerBg, border:`1px solid ${C.dangerBorder}`, borderRadius:"8px", color:C.danger, fontSize:"0.875rem" },
  emptyResult: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"200px", textAlign:"center" },
  spinner: { width:"36px", height:"36px", border:`3px solid ${C.greenBorder}`, borderTop:`3px solid ${C.greenMid}`, borderRadius:"50%", animation:"spin 0.7s linear infinite" },
  resultBody: { display:"flex", flexDirection:"column", gap:"1.25rem" },
  resultGrid: { display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"1rem", textAlign:"center", padding:"1rem 0", borderBottom:`1px solid ${C.border}` },
  resultMeta: { display:"flex", gap:"0.5rem" },
  resultTag : { padding:"0.3rem 0.75rem", backgroundColor:C.greenLight, borderRadius:"99px", fontSize:"0.8rem", color:C.green, fontWeight:"600", border:`1px solid ${C.greenBorder}` },
  successBanner: { backgroundColor:C.greenLight, border:`1px solid ${C.greenBorder}`, borderRadius:"8px", padding:"0.85rem 1rem", color:C.green, fontSize:"0.875rem" },
  warnBanner   : { backgroundColor:C.dangerBg, border:`1px solid ${C.dangerBorder}`, borderRadius:"8px", padding:"0.85rem 1rem", color:"#7A1A1A", fontSize:"0.875rem" },
  inlineLink   : { background:"none", border:"none", color:C.danger, fontWeight:"700", cursor:"pointer", padding:0, textDecoration:"underline", fontSize:"0.875rem" },
  aiBox        : { backgroundColor:C.greenLight, border:`1px solid ${C.greenBorder}`, borderRadius:"8px", padding:"1rem" },
  aiLabel      : { fontSize:"0.8rem", fontWeight:"700", color:C.green, marginBottom:"0.5rem" },
  aiText       : { fontSize:"0.875rem", color:C.text, lineHeight:"1.6", margin:0 },
};
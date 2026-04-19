import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import useConflict from "../../hooks/useConflict";

// ── Options ───────────────────────────────────────────────────────────────────
const SEMESTER_OPTIONS = [
  { value: "FIRST",  label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "SUMMER", label: "Summer" },
];
const SCHOOL_YEARS = ["2024-2025", "2025-2026", "2026-2027"];
const TABS = ["Conflicts", "Teaching Load", "Room Utilisation"];

// ── Component ─────────────────────────────────────────────────────────────────
export default function Reports() {
  const navigate = useNavigate();
  const { conflicts, loading: conflictLoading, error: conflictError,
          unresolvedCount, fetchConflicts, fetchCount,
          resolveOne, resolveAllForSchedule, auditTerm,
          actionLoading, actionError } = useConflict();

  const [activeTab,   setActiveTab]   = useState(0);
  const [semester,    setSemester]    = useState("FIRST");
  const [schoolYear,  setSchoolYear]  = useState("2024-2025");

  // Teaching load
  const [loadReport,  setLoadReport]  = useState([]);
  const [loadLoading, setLoadLoading] = useState(false);
  const [loadError,   setLoadError]   = useState("");

  // Room utilisation
  const [campuses,       setCampuses]       = useState([]);
  const [selectedCampus, setSelectedCampus] = useState("");
  const [roomReport,     setRoomReport]     = useState([]);
  const [roomLoading,    setRoomLoading]    = useState(false);
  const [roomError,      setRoomError]      = useState("");

  // Conflict summary
  const [conflictSummary, setConflictSummary] = useState(null);
  const [auditResult,     setAuditResult]     = useState(null);
  const [summaryLoading,  setSummaryLoading]  = useState(false);

  // ── Fetch campuses for room filter ────────────────────────────────────────
  const ensureCampuses = useCallback(async () => {
    if (campuses.length > 0) return;
    try {
      const res  = await api.get("/rooms/campuses");
      const data = res.data?.data ?? res.data;
      setCampuses(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, [campuses]);

  // ── Tab actions ───────────────────────────────────────────────────────────
  const handleTabChange = (idx) => {
    setActiveTab(idx);
    if (idx === 2) ensureCampuses();
  };

  const handleFetchConflicts = () => {
    fetchConflicts({ semester, schoolYear });
    fetchConflictSummary();
  };

  const fetchConflictSummary = async () => {
    setSummaryLoading(true);
    try {
      const res  = await api.get("/reports/conflicts", { params: { semester, schoolYear } });
      setConflictSummary(res.data?.data ?? res.data);
    } catch { setConflictSummary(null); }
    finally { setSummaryLoading(false); }
  };

  const handleAudit = async () => {
    const res = await auditTerm(semester, schoolYear);
    if (res.success) {
      setAuditResult(res.data);
      handleFetchConflicts();
    }
  };

  const handleFetchLoad = async () => {
    setLoadLoading(true);
    setLoadError("");
    try {
      const res  = await api.get("/reports/teaching-load", { params: { semester, schoolYear } });
      const data = res.data?.data ?? res.data;
      setLoadReport(Array.isArray(data) ? data : []);
    } catch { setLoadError("Failed to load teaching load report."); }
    finally { setLoadLoading(false); }
  };

  const handleFetchRooms = async () => {
    if (!selectedCampus) return;
    setRoomLoading(true);
    setRoomError("");
    try {
      const res  = await api.get("/reports/room-utilisation", {
        params: { campusId: selectedCampus, semester, schoolYear },
      });
      const data = res.data?.data ?? res.data;
      setRoomReport(Array.isArray(data) ? data : []);
    } catch { setRoomError("Failed to load room utilisation report."); }
    finally { setRoomLoading(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>
        ← Back to Dashboard
      </button>
      <h1 style={styles.title}>Reports</h1>
      <p style={styles.subtitle}>View and manage scheduling data</p>

      {/* Term selector (shared across tabs) */}
      <div style={styles.termRow}>
        <select value={semester} onChange={(e) => setSemester(e.target.value)} style={styles.filterSelect}>
          {SEMESTER_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)} style={styles.filterSelect}>
          {SCHOOL_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => handleTabChange(i)}
            style={{ ...styles.tab, ...(activeTab === i ? styles.tabActive : {}) }}>
            {t}
            {i === 0 && unresolvedCount > 0 && (
              <span style={styles.badge}>{unresolvedCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab 0: Conflicts ────────────────────────────────────────────── */}
      {activeTab === 0 && (
        <div>
          <div style={styles.actionRow}>
            <button onClick={handleFetchConflicts} style={styles.primaryBtn}
              disabled={conflictLoading}>
              {conflictLoading ? "Loading…" : "Load Conflicts"}
            </button>
            <button onClick={handleAudit} style={styles.secondaryBtn}
              disabled={actionLoading}>
              {actionLoading ? "Auditing…" : "Run Audit"}
            </button>
          </div>

          {/* Audit result */}
          {auditResult && (
            <div style={styles.infoBanner}>
              Audit complete — {auditResult.newConflictsFound} new conflict(s) found.
            </div>
          )}

          {/* Summary cards */}
          {conflictSummary && (
            <div style={styles.summaryGrid}>
              <SummaryCard label="Total Unresolved"   value={conflictSummary.totalUnresolved} color="#dc2626" />
              <SummaryCard label="This Term"          value={conflictSummary.termUnresolved}  color="#f59e0b" />
            </div>
          )}

          {conflictError && <div style={styles.errorBanner}>{conflictError}</div>}
          {actionError   && <div style={styles.errorBanner}>{actionError}</div>}

          {conflicts.length === 0 && !conflictLoading && (
            <div style={styles.empty}>No unresolved conflicts found for this term.</div>
          )}

          {conflicts.length > 0 && (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>{["Type", "Description", "Schedule ID", "Actions"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {conflicts.map((c, i) => (
                    <tr key={c.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#fef9f9" }}>
                      <td style={styles.td}><ConflictBadge type={c.conflictType} /></td>
                      <td style={styles.td}>{c.description ?? "—"}</td>
                      <td style={styles.td}>{c.schedule?.id ?? "—"}</td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button onClick={() => resolveOne(c.id)} style={styles.resolveBtn}
                            disabled={actionLoading}>
                            Resolve
                          </button>
                          {c.schedule?.id && (
                            <button onClick={() => resolveAllForSchedule(c.schedule.id)}
                              style={styles.resolveAllBtn} disabled={actionLoading}>
                              Resolve All
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 1: Teaching Load ─────────────────────────────────────────── */}
      {activeTab === 1 && (
        <div>
          <div style={styles.actionRow}>
            <button onClick={handleFetchLoad} style={styles.primaryBtn} disabled={loadLoading}>
              {loadLoading ? "Loading…" : "Load Report"}
            </button>
          </div>
          {loadError && <div style={styles.errorBanner}>{loadError}</div>}
          {loadReport.length === 0 && !loadLoading && (
            <div style={styles.empty}>Click "Load Report" to view teaching load data.</div>
          )}
          {loadReport.length > 0 && (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>{["Teacher", "Department", "Units", "Sections"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {loadReport.map((row, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                      <td style={styles.td}>{row[0] ?? "—"}</td>
                      <td style={styles.td}>{row[1] ?? "—"}</td>
                      <td style={styles.td}>{row[2] ?? "—"}</td>
                      <td style={styles.td}>{row[3] ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Room Utilisation ──────────────────────────────────────── */}
      {activeTab === 2 && (
        <div>
          <div style={styles.actionRow}>
            <select value={selectedCampus} onChange={(e) => setSelectedCampus(e.target.value)}
              style={styles.filterSelect}>
              <option value="">Select Campus</option>
              {campuses.map((c) => <option key={c.id} value={c.id}>{c.name ?? c.code}</option>)}
            </select>
            <button onClick={handleFetchRooms} style={styles.primaryBtn}
              disabled={roomLoading || !selectedCampus}>
              {roomLoading ? "Loading…" : "Load Report"}
            </button>
          </div>
          {roomError && <div style={styles.errorBanner}>{roomError}</div>}
          {roomReport.length === 0 && !roomLoading && (
            <div style={styles.empty}>Select a campus and click "Load Report".</div>
          )}
          {roomReport.length > 0 && (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>{["Room", "Type", "Slots Used", "Utilisation %"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {roomReport.map((row, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                      <td style={styles.td}>{row[0] ?? "—"}</td>
                      <td style={styles.td}>{row[1] ?? "—"}</td>
                      <td style={styles.td}>{row[2] ?? "—"}</td>
                      <td style={styles.td}>
                        <UtilBar pct={row[3] ?? 0} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SummaryCard({ label, value, color }) {
  return (
    <div style={{ backgroundColor:"#fff", border:"1px solid #E0EAE0", borderTop:`3px solid ${color}`, borderRadius:"10px", padding:"1rem 1.5rem", textAlign:"center", fontFamily:"'DM Sans', sans-serif" }}>
      <div style={{ fontFamily:"'Playfair Display', Georgia, serif", fontSize:"2rem", fontWeight:"700", color }}>{value ?? "—"}</div>
      <div style={{ fontSize:"0.8rem", color:"#7AAE7A", marginTop:"0.2rem" }}>{label}</div>
    </div>
  );
}

const CONFLICT_COLORS = {
  TEACHER_OVERLAP : { bg:"rgba(226,75,74,0.08)",  color:"#E24B4A" },
  ROOM_OVERLAP    : { bg:"rgba(186,117,23,0.08)",  color:"#BA7517" },
  STUDENT_OVERLAP : { bg:"rgba(83,74,183,0.08)",   color:"#534AB7" },
};

function ConflictBadge({ type }) {
  const c = CONFLICT_COLORS[type] ?? { bg: "#f3f4f6", color: "#374151" };
  return (
    <span style={{ padding: "0.2rem 0.6rem", backgroundColor: c.bg, color: c.color, borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700", whiteSpace: "nowrap" }}>
      {type?.replace("_", " ") ?? "—"}
    </span>
  );
}

function UtilBar({ pct }) {
  const num = typeof pct === "number" ? Math.min(100, Math.round(pct)) : 0;
  const color = num > 80 ? "#E24B4A" : num > 50 ? "#BA7517" : "#34C47C";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ flex: 1, height: "6px", backgroundColor: "#f3f4f6", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: `${num}%`, height: "100%", backgroundColor: color, borderRadius: "3px" }} />
      </div>
      <span style={{ fontSize: "0.8rem", color: "#374151", fontWeight: "600", minWidth: "36px" }}>{num}%</span>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page        : { padding:"2rem 2.5rem", maxWidth:"1000px", margin:"0 auto", fontFamily:"'DM Sans', sans-serif" },
  backBtn     : { background:"none", border:"none", color:"#1A6A2A", cursor:"pointer", fontSize:"0.9rem", fontWeight:"600", padding:0, marginBottom:"1.5rem" },
  title       : { fontFamily:"'Playfair Display', Georgia, serif", fontSize:"1.75rem", fontWeight:"700", color:"#112A17", margin:"0 0 0.2rem", letterSpacing:"-0.01em" },
  subtitle    : { color:"#7AAE7A", fontSize:"0.9rem", margin:"0 0 1.5rem" },
  termRow     : { display:"flex", gap:"0.75rem", marginBottom:"1.5rem" },
  filterSelect: { padding:"0.6rem 0.9rem", border:"1.5px solid #D8EAD8", borderRadius:"8px", fontSize:"0.88rem", color:"#112A17", backgroundColor:"#fff", fontFamily:"'DM Sans', sans-serif" },
  tabs        : { display:"flex", gap:0, borderBottom:"2px solid #E0EAE0", marginBottom:"1.5rem" },
  tab         : { padding:"0.7rem 1.25rem", border:"none", background:"none", fontSize:"0.9rem", fontWeight:"600", color:"#7AAE7A", cursor:"pointer", borderBottom:"2px solid transparent", marginBottom:"-2px", display:"flex", alignItems:"center", gap:"0.4rem", transition:"color 0.15s", fontFamily:"'DM Sans', sans-serif" },
  tabActive   : { color:"#1A6A2A", borderBottomColor:"#34C47C" },
  badge       : { backgroundColor:"#E24B4A", color:"#fff", borderRadius:"99px", padding:"0.1rem 0.45rem", fontSize:"0.72rem", fontWeight:"700" },
  actionRow   : { display:"flex", gap:"0.75rem", marginBottom:"1.25rem" },
  primaryBtn  : { padding:"0.65rem 1.2rem", backgroundColor:"#1A6A2A", color:"#fff", border:"none", borderRadius:"8px", fontSize:"0.9rem", fontWeight:"600", cursor:"pointer", fontFamily:"'DM Sans', sans-serif" },
  secondaryBtn: { padding:"0.65rem 1.2rem", backgroundColor:"transparent", border:"1.5px solid #D8EAD8", borderRadius:"8px", fontSize:"0.9rem", fontWeight:"600", cursor:"pointer", color:"#3B6D3B", fontFamily:"'DM Sans', sans-serif" },
  summaryGrid : { display:"grid", gridTemplateColumns:"repeat(2, 180px)", gap:"1rem", marginBottom:"1.25rem" },
  infoBanner  : { padding:"0.75rem 1rem", backgroundColor:"rgba(52,196,124,0.07)", border:"1px solid rgba(52,196,124,0.25)", borderRadius:"8px", color:"#1A6A2A", fontSize:"0.875rem", marginBottom:"1rem" },
  errorBanner : { padding:"0.75rem 1rem", backgroundColor:"rgba(226,75,74,0.07)", border:"1px solid rgba(226,75,74,0.25)", borderRadius:"8px", color:"#E24B4A", fontSize:"0.875rem", marginBottom:"1rem" },
  empty       : { textAlign:"center", color:"#AAC8AA", padding:"3rem", fontSize:"0.95rem" },
  tableWrap   : { borderRadius:"12px", border:"1px solid #E0EAE0", overflow:"hidden" },
  table       : { width:"100%", borderCollapse:"collapse" },
  th          : { padding:"0.85rem 1.25rem", textAlign:"left", fontSize:"0.78rem", fontWeight:"700", color:"#3B6D3B", textTransform:"uppercase", letterSpacing:"0.05em", backgroundColor:"#F4FAF6", borderBottom:"1px solid #E0EAE0" },
  td          : { padding:"0.85rem 1.25rem", fontSize:"0.9rem", color:"#112A17", borderBottom:"1px solid #EEF4EE", fontFamily:"'DM Sans', sans-serif" },
  resolveBtn  : { padding:"0.3rem 0.75rem", backgroundColor:"rgba(52,196,124,0.1)", border:"1px solid rgba(52,196,124,0.25)", color:"#1A6A2A", borderRadius:"6px", fontSize:"0.8rem", fontWeight:"600", cursor:"pointer" },
  resolveAllBtn: { padding:"0.3rem 0.75rem", backgroundColor:"transparent", border:"1px solid #D8EAD8", color:"#3B6D3B", borderRadius:"6px", fontSize:"0.8rem", fontWeight:"600", cursor:"pointer" },
};
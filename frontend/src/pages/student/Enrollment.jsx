import { useState, useEffect } from "react";
import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

const CURRENT_SEMESTER = "FIRST";
const CURRENT_YEAR     = "2024-2025";

const responsiveStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  input::placeholder { color: rgba(255,255,255,0.2); }
  .enroll-row:hover { background: rgba(255,255,255,0.025) !important; }

  /* Responsive table */
  .enroll-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 16px; }
  .enroll-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 680px; }

  /* Summary bar */
  .summary-bar {
    display: flex; align-items: center;
    justify-content: space-between; gap: 14px; flex-wrap: wrap;
  }
  .search-wrap { position: relative; width: 100%; max-width: 320px; min-width: 200px; }

  /* Header pills */
  .semester-pill {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.25);
    border-radius: 100px; padding: 4px 14px; margin-bottom: 14px;
    font-size: 10px; font-weight: 700; color: #FCD34D;
    letter-spacing: 0.12em; text-transform: uppercase; font-family: 'DM Mono', monospace;
  }

  /* Responsive page padding */
  .enroll-page { max-width: 1100px; margin: 0 auto; padding: 32px 20px 60px; position: relative; z-index: 1; }

  @media (min-width: 600px) {
    .enroll-page { padding: 40px 32px 60px; }
    .search-wrap { width: auto; }
  }
  @media (min-width: 900px) {
    .enroll-page { padding: 40px 40px 60px; }
  }

  /* Footer count */
  .footer-count { font-size: 12px; color: rgba(255,255,255,0.2); font-family: 'DM Mono', monospace; margin-top: 12px; text-align: right; }
`;

export default function Enrollment() {
  const { user } = useAuth();

  if (!user?.isIrregular) {
    return (
      <div style={{
        minHeight: "100vh", background: "#060D1A",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif", padding: "24px",
      }}>
        <style>{responsiveStyles}</style>
        <div style={{ textAlign: "center", maxWidth: 340 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 34, margin: "0 auto 20px",
          }}>🎓</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 18, color: "#F1F5F9", marginBottom: 8 }}>
            Irregular students only
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
            Back subject enrollment is not available for your account type.
          </div>
        </div>
      </div>
    );
  }

  const [sections,   setSections]   = useState([]);
  const [enrolled,   setEnrolled]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(null);
  const [error,      setError]      = useState("");
  const [search,     setSearch]     = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true); setError("");
    try {
      const [sectRes, enrollRes] = await Promise.all([
        api.get("/schedules/back-subjects", { params: { semester: CURRENT_SEMESTER, schoolYear: CURRENT_YEAR, studentId: user?.userId } }),
        api.get("/students/my-enrollments",  { params: { semester: CURRENT_SEMESTER, schoolYear: CURRENT_YEAR } }),
      ]);
      setSections(sectRes.data?.data  ?? sectRes.data  ?? []);
      setEnrolled(enrollRes.data?.data ?? enrollRes.data ?? []);
    } catch {
      setError("Failed to load back subjects. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const enrolledIds = new Set(enrolled.map(e => e.scheduleId ?? e.id));

  async function handleEnroll(scheduleId) {
    setSaving(scheduleId); setError(""); setSuccessMsg("");
    try {
      await api.post(`/schedules/${scheduleId}/assign-student`, { studentId: user?.userId });
      setSuccessMsg("Enrolled successfully!");
      loadData();
    } catch (e) {
      setError(e.response?.data?.message ?? "Enrollment failed. Check for time conflicts.");
    } finally { setSaving(null); }
  }

  async function handleDrop(scheduleId) {
    setSaving(scheduleId); setError(""); setSuccessMsg("");
    try {
      await api.delete(`/schedules/${scheduleId}/remove-student`, { data: { studentId: user?.userId } });
      setSuccessMsg("Dropped successfully.");
      loadData();
    } catch (e) {
      setError(e.response?.data?.message ?? "Failed to drop subject.");
    } finally { setSaving(null); }
  }

  const filtered = sections.filter(s =>
    s.subjectName?.toLowerCase().includes(search.toLowerCase()) ||
    s.subjectCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#060D1A", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{responsiveStyles}</style>

      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-8%", left: "30%", width: "min(560px, 80vw)", height: "min(560px, 80vw)", borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "5%", width: "min(380px, 60vw)", height: "min(380px, 60vw)", borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at 50% 20%, black 20%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 20%, black 20%, transparent 70%)",
        }} />
      </div>

      <div className="enroll-page">

        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <div className="semester-pill">
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
            Irregular Student · {CURRENT_SEMESTER === "FIRST" ? "1st" : "2nd"} Semester · {CURRENT_YEAR}
          </div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(1.4rem, 5vw, 2rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 6 }}>
            Back Subject Enrollment
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "clamp(13px, 2vw, 14px)", lineHeight: 1.6 }}>
            Enroll in subjects from previous year levels that you still need to complete.
          </p>
        </div>

        {/* ── Alerts ── */}
        {successMsg && (
          <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10, padding: "11px 16px", marginBottom: 16, color: "#86EFAC", fontSize: 13, display: "flex", gap: 8, alignItems: "flex-start" }}>
            ✅ {successMsg}
          </div>
        )}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "11px 16px", marginBottom: 16, color: "#FCA5A5", fontSize: 13, display: "flex", gap: 8, alignItems: "flex-start" }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Summary bar ── */}
        <div style={{
          background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14, padding: "14px 18px", marginBottom: 20,
        }}>
          <div className="summary-bar">
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: "#86EFAC", fontSize: 18 }}>
                {enrolled.length}
              </span>
              <span style={{ marginLeft: 8 }}>back subject{enrolled.length !== 1 ? "s" : ""} enrolled</span>
            </div>

            <div className="search-wrap">
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "rgba(255,255,255,0.2)" }}>🔍</span>
              <input
                placeholder="Search subject name or code…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: "100%", padding: "8px 12px 8px 32px",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9,
                  background: "rgba(255,255,255,0.05)", color: "#fff",
                  fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(245,158,11,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "rgba(255,255,255,0.25)", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
            Loading back subjects…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16, padding: "clamp(32px, 8vw, 60px) 24px", textAlign: "center",
          }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>📭</div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: "#F1F5F9", marginBottom: 6 }}>
              No back subjects available
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, maxWidth: 320, margin: "0 auto" }}>
              All your back subjects may already be enrolled, or none are scheduled this term.
            </div>
          </div>
        ) : (
          <div className="enroll-table-wrap" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <table className="enroll-table">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {["Subject", "Code", "Yr", "Section", "Schedule", "Room", "Status", "Action"].map(h => (
                    <th key={h} style={{
                      padding: "12px 14px", textAlign: "left",
                      fontWeight: 700, color: "rgba(255,255,255,0.35)",
                      fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
                      fontFamily: "'DM Mono', monospace",
                      background: "rgba(255,255,255,0.02)", whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const isEnrolled = enrolledIds.has(s.id);
                  const isSaving   = saving === s.id;
                  return (
                    <tr
                      key={s.id}
                      className="enroll-row"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        background: isEnrolled ? "rgba(34,197,94,0.05)" : "transparent",
                        transition: "background 0.15s",
                      }}
                    >
                      <td style={{ padding: "12px 14px", fontWeight: 500, color: "#F1F5F9", maxWidth: 180 }}>{s.subjectName}</td>
                      <td style={{ padding: "12px 14px", color: "#93C5FD", fontWeight: 700, fontFamily: "'DM Mono', monospace", fontSize: 12, whiteSpace: "nowrap" }}>{s.subjectCode}</td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono', monospace",
                          background: "rgba(245,158,11,0.12)", color: "#FCD34D",
                          border: "1px solid rgba(245,158,11,0.3)",
                          borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap",
                        }}>Y{s.yearLevel}</span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>{s.sectionName}</td>
                      <td style={{ padding: "12px 14px", fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Mono', monospace", lineHeight: 1.7, whiteSpace: "nowrap" }}>
                        {s.day1} {s.startTime1}
                        {s.day2 && <><br />{s.day2} {s.startTime2}</>}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>{s.roomNumber || s.roomName}</td>
                      <td style={{ padding: "12px 14px" }}>
                        {isEnrolled ? (
                          <span style={{
                            fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono', monospace",
                            background: "rgba(34,197,94,0.12)", color: "#86EFAC",
                            border: "1px solid rgba(34,197,94,0.3)",
                            borderRadius: 6, padding: "3px 10px", whiteSpace: "nowrap",
                          }}>Enrolled</span>
                        ) : (
                          <span style={{
                            fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono', monospace",
                            background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 6, padding: "3px 10px", whiteSpace: "nowrap",
                          }}>Available</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {isEnrolled ? (
                          <button
                            onClick={() => handleDrop(s.id)}
                            disabled={isSaving}
                            style={{
                              fontSize: 12, padding: "6px 12px", borderRadius: 7,
                              border: "1px solid rgba(239,68,68,0.3)",
                              background: "rgba(239,68,68,0.1)", color: "#FCA5A5",
                              cursor: isSaving ? "not-allowed" : "pointer", fontWeight: 700,
                              fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                              whiteSpace: "nowrap",
                            }}
                          >{isSaving ? "…" : "Drop"}</button>
                        ) : (
                          <button
                            onClick={() => handleEnroll(s.id)}
                            disabled={isSaving}
                            style={{
                              fontSize: 12, padding: "6px 12px", borderRadius: 7,
                              border: "none",
                              background: isSaving ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #22C55E, #16A34A)",
                              color: "#fff", cursor: isSaving ? "not-allowed" : "pointer", fontWeight: 700,
                              fontFamily: "'DM Sans', sans-serif",
                              boxShadow: isSaving ? "none" : "0 4px 14px rgba(34,197,94,0.25)",
                              transition: "all 0.2s ease", whiteSpace: "nowrap",
                            }}
                          >{isSaving ? "…" : "Enroll →"}</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <p className="footer-count">
            {filtered.length} subject{filtered.length !== 1 ? "s" : ""} shown · {enrolled.length} enrolled
          </p>
        )}

      </div>
    </div>
  );
}
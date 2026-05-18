import { useState, useEffect } from "react";
import api from "../../services/api";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes slideUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes pulse-glow { 0%,100%{ opacity:0.5; } 50%{ opacity:1; } }
  @keyframes modalIn  { from { opacity:0; transform:scale(.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }

  .tc-card {
    background: rgba(15,23,42,0.72);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.07);
  }

  /* ── Table ── */
  .tc-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .tc-table { width: 100%; border-collapse: collapse; min-width: 580px; }
  .tc-table th {
    padding: 10px 14px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,255,255,0.35);
    letter-spacing: .1em;
    text-transform: uppercase;
    font-family: 'DM Mono', monospace;
    white-space: nowrap;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .tc-table td {
    padding: 12px 14px;
    font-size: 13px;
    color: rgba(255,255,255,0.65);
    border-bottom: 1px solid rgba(255,255,255,0.04);
    vertical-align: middle;
  }
  .tc-table tr:last-child td { border-bottom: none; }
  .tc-table tr:hover td { background: rgba(255,255,255,0.025); }

  .tc-action-btn {
    font-size: 11px;
    padding: 6px 12px;
    border-radius: 7px;
    border: none;
    cursor: pointer;
    font-weight: 700;
    font-family: 'DM Mono', monospace;
    letter-spacing: .04em;
    transition: all .2s ease;
    touch-action: manipulation;
    min-height: 30px;
    white-space: nowrap;
  }
  .tc-action-btn:hover { transform: translateY(-1px); }
  .tc-action-btn:active { transform: translateY(0); }

  /* ── Modal ── */
  .tc-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: flex-end;   /* bottom sheet on mobile */
    justify-content: center;
    z-index: 50;
    animation: fadeIn .15s ease;
    padding: 0;
  }
  .tc-modal {
    background: #0D1826;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px 20px 0 0;
    padding: 28px 24px 32px;
    width: 100%;
    max-width: 480px;
    box-shadow: 0 -20px 60px rgba(0,0,0,0.5);
    animation: modalIn .25s ease;
  }

  .tc-textarea {
    width: 100%;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1.5px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: #F1F5F9;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    resize: vertical;
    outline: none;
    transition: border-color .2s;
    min-height: 80px;
    -webkit-appearance: none;
    appearance: none;
  }
  .tc-textarea:focus { border-color: rgba(34,197,94,0.45); }
  .tc-textarea::placeholder { color: rgba(255,255,255,0.25); }

  .tc-btn-confirm {
    padding: 10px 22px;
    border-radius: 9px;
    border: none;
    background: linear-gradient(135deg,#22C55E,#16A34A);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all .2s;
    min-height: 40px;
    touch-action: manipulation;
  }
  .tc-btn-confirm:hover { box-shadow: 0 6px 20px rgba(34,197,94,0.4); }

  .tc-btn-ghost {
    padding: 10px 22px;
    border-radius: 9px;
    border: 1.5px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.5);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all .2s;
    min-height: 40px;
    touch-action: manipulation;
  }
  .tc-btn-ghost:hover { background: rgba(255,255,255,0.08); color: #fff; }

  .tc-badge {
    font-size: 11px;
    padding: 3px 10px;
    border-radius: 7px;
    font-weight: 700;
    font-family: 'DM Mono', monospace;
    letter-spacing: .04em;
    white-space: nowrap;
    display: inline-block;
  }

  /* ── Stats grid ── */
  .tc-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-bottom: 24px;
    animation: slideUp .5s ease .06s both;
  }

  /* ── Tablet ── */
  @media (max-width: 600px) {
    .tc-stats-grid { gap: 10px; }
    .tc-table td, .tc-table th { padding: 10px 10px; }
    .tc-textarea { font-size: 16px; } /* prevent iOS zoom */
  }

  /* ── Desktop modal: center it ── */
  @media (min-width: 600px) {
    .tc-modal-overlay {
      align-items: center;
      padding: 20px;
    }
    .tc-modal {
      border-radius: 20px;
      padding: 32px;
    }
  }

  @media (max-width: 400px) {
    .tc-stats-grid { grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    .tc-badge { font-size: 10px; padding: 2px 7px; }
  }
`;

const STATUS_STYLE = {
  PENDING:       { bg: "rgba(245,158,11,0.12)",  color: "#FCD34D", border: "rgba(245,158,11,0.25)", label: "PENDING" },
  FOR_INTERVIEW: { bg: "rgba(59,130,246,0.12)",  color: "#60A5FA", border: "rgba(59,130,246,0.25)", label: "FOR INTERVIEW" },
  APPROVED:      { bg: "rgba(34,197,94,0.12)",   color: "#4ADE80", border: "rgba(34,197,94,0.25)",  label: "APPROVED" },
  REJECTED:      { bg: "rgba(239,68,68,0.1)",    color: "#f87171", border: "rgba(239,68,68,0.2)",   label: "REJECTED" },
};

const ACTION_CONFIG = {
  FOR_INTERVIEW: { label: "Interview", bg: "rgba(59,130,246,0.15)", color: "#60A5FA" },
  APPROVED:      { label: "Approve",   bg: "rgba(34,197,94,0.15)",  color: "#4ADE80" },
  REJECTED:      { label: "Reject",    bg: "rgba(239,68,68,0.1)",   color: "#f87171" },
};

export default function IrregularStudents() {
  const [students,  setStudents]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [msg,       setMsg]       = useState({ type: "", text: "" });
  const [reviewing, setReviewing] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/students/pending-irregular")
      .then(r => { setStudents(r.data?.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submitReview = async () => {
    if (!reviewing) return;
    try {
      await api.put(`/students/${reviewing.studentId}/application-status`, {
        status: reviewing.status, notes: reviewing.notes ?? "",
      });
      setMsg({ type: "success", text: `Status updated to ${reviewing.status}.` });
      setReviewing(null); load();
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.message ?? "Failed to update status." });
    }
  };

  const pending   = students.filter(s => s.applicationStatus === "PENDING").length;
  const interview = students.filter(s => s.applicationStatus === "FOR_INTERVIEW").length;
  const approved  = students.filter(s => s.applicationStatus === "APPROVED").length;

  const pagePad = { padding: "clamp(1rem, 4vw, 2rem) clamp(1rem, 4vw, 2.5rem)" };

  return (
    <div style={{ minHeight: "100vh", background: "#060D1A", color: "#F1F5F9", fontFamily: "'DM Sans',sans-serif", ...pagePad }}>
      <style>{STYLES}</style>

      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", right: "20%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(236,72,153,0.06) 0%,transparent 70%)", filter: "blur(60px)", animation: "pulse-glow 9s ease infinite" }} />
        <div style={{ position: "absolute", bottom: "5%", left: "5%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,rgba(34,197,94,0.04) 0%,transparent 70%)", filter: "blur(60px)", animation: "pulse-glow 12s ease infinite 4s" }} />
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: "clamp(18px, 3vw, 28px)", animation: "slideUp .5s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EC4899", boxShadow: "0 0 8px #EC4899" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#F472B6", letterSpacing: ".12em", textTransform: "uppercase", fontFamily: "'DM Mono',monospace" }}>Dean Portal</span>
          </div>
          <h1 style={{ fontSize: "clamp(1.4rem, 5vw, 2rem)", fontWeight: 800, color: "#fff", letterSpacing: "-.03em", fontFamily: "'Sora',sans-serif" }}>Irregular Students</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "clamp(12px, 3vw, 14px)", marginTop: 4 }}>
            Review and process pending irregular student applications.
          </p>
        </div>

        {/* Stats */}
        <div className="tc-stats-grid">
          {[
            { label: "Pending",       value: loading ? "…" : pending,   color: "#FCD34D", accent: "rgba(245,158,11,0.08)" },
            { label: "For Interview", value: loading ? "…" : interview, color: "#60A5FA", accent: "rgba(59,130,246,0.08)" },
            { label: "Approved",      value: loading ? "…" : approved,  color: "#4ADE80", accent: "rgba(34,197,94,0.08)" },
          ].map(s => (
            <div key={s.label} style={{ background: s.accent, borderRadius: 14, border: `1px solid ${s.color}20`, padding: "clamp(12px, 3vw, 18px) clamp(14px, 3vw, 20px)" }}>
              <div style={{ fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 800, color: s.color, fontFamily: "'Sora',sans-serif", letterSpacing: "-.03em" }}>{s.value}</div>
              <div style={{ fontSize: "clamp(9px, 2vw, 11px)", color: "rgba(255,255,255,0.4)", marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alert */}
        {msg.text && (
          <div style={{
            background: msg.type === "error" ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
            border: `1px solid ${msg.type === "error" ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.25)"}`,
            borderRadius: 10, padding: "10px 16px", marginBottom: 16,
            color: msg.type === "error" ? "#f87171" : "#4ADE80", fontSize: 13,
            display: "flex", gap: 8, alignItems: "flex-start", animation: "slideUp .3s ease", lineHeight: 1.5,
          }}>
            {msg.type === "error" ? "⚠️" : "✅"} {msg.text}
          </div>
        )}

        {/* Table */}
        <div className="tc-card" style={{ overflow: "hidden", animation: "slideUp .5s ease .1s both" }}>
          <div className="tc-table-wrap">
            <table className="tc-table">
              <thead>
                <tr>{["Student", "Course", "Year", "Status", "Actions"].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 48, color: "rgba(255,255,255,0.2)" }}>
                    <div style={{ fontSize: 13, fontFamily: "'DM Mono',monospace" }}>Loading students…</div>
                  </td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 64 }}>
                    <div style={{ fontSize: 40, marginBottom: 14 }}>🎓</div>
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.25)" }}>No pending irregular applications.</div>
                  </td></tr>
                ) : students.map(s => {
                  const st = STATUS_STYLE[s.applicationStatus] ?? STATUS_STYLE.PENDING;
                  return (
                    <tr key={s.userId}>
                      <td>
                        <div style={{ fontWeight: 700, color: "#F1F5F9", fontSize: 13 }}>{s.user?.fullName}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono',monospace", marginTop: 2 }}>ID #{s.userId}</div>
                      </td>
                      <td>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "#60A5FA", fontWeight: 700 }}>{s.course?.code}</span>
                      </td>
                      <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12 }}>Yr {s.yearLevel}</td>
                      <td>
                        <span className="tc-badge" style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                          {st.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {Object.entries(ACTION_CONFIG).map(([action, cfg]) => (
                            <button key={action} className="tc-action-btn"
                              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.bg}` }}
                              onClick={() => setReviewing({ studentId: s.userId, status: action, notes: "" })}>
                              {cfg.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Review Modal (bottom sheet on mobile, centered on desktop) ── */}
      {reviewing && (
        <div className="tc-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setReviewing(null); }}>
          <div className="tc-modal">
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: ACTION_CONFIG[reviewing.status]?.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {reviewing.status === "APPROVED" ? "✅" : reviewing.status === "REJECTED" ? "❌" : "🗓️"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "'Sora',sans-serif" }}>
                  Set Status: {reviewing.status.replace("_", " ")}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Confirm action for this student</div>
              </div>
              <button onClick={() => setReviewing(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 4, flexShrink: 0, touchAction: "manipulation" }}>×</button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, letterSpacing: ".09em", textTransform: "uppercase", fontFamily: "'DM Mono',monospace" }}>Notes (optional)</label>
              <textarea className="tc-textarea" rows={3} placeholder="Add any notes for the student…"
                value={reviewing.notes} onChange={e => setReviewing(r => ({ ...r, notes: e.target.value }))} />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="tc-btn-ghost" onClick={() => setReviewing(null)}>Cancel</button>
              <button className="tc-btn-confirm" onClick={submitReview}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
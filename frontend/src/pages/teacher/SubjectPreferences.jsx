import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

function getCurrentTerm() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return {
    semester: month >= 6 && month <= 10 ? "FIRST" : "SECOND",
    schoolYear: `${year}-${year + 1}`,
  };
}
const { semester: SEMESTER, schoolYear: SCHOOL_YEAR } = getCurrentTerm();

export default function SubjectPreferences() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [saved, setSaved] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    console.log("TEACHER USER:", user);
    try {
      const [sRes, pRes] = await Promise.all([
        api.get(`/teachers/${user?.id ?? user?.userId}/available-subjects`),
        api.get(`/teachers/${user?.id ?? user?.userId}/subject-preferences?semester=${SEMESTER}&schoolYear=${SCHOOL_YEAR}`),
      ]);
      const allSubjects = sRes.data?.data ?? [];
      const prefs = pRes.data?.data ?? [];        
      setSubjects(allSubjects);
      setSaved(prefs);
      setSelected(new Set(prefs.map(p => p.subject?.id)));
    } catch {
      setMsg({ type: "error", text: "Failed to load subjects." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user?.id ?? user?.userId) load(); }, [user]);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    try {
      await api.post(`/teachers/${user?.userId ?? user?.id}/subject-preferences`, {
        subjectIds: [...selected],
        semester: SEMESTER,
        schoolYear: SCHOOL_YEAR,
      });
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
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
        Select the subjects you want to teach this semester. Your program head will review and approve.
      </p>

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
              {["Subject", "Code", "Units", "Session Type", "Status"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>Loading…</td></tr>
            ) : subjects.map(s => {
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
                      background: s.sessionType === "LABORATORY" ? "#f0fdf4" : "#fef9ee",
                      color: s.sessionType === "LABORATORY" ? "#15803d" : "#92400e"
                    }}>
                      {s.sessionType ?? "LECTURE"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {sc ? (
                      <span style={{ fontSize: 11, background: sc.bg, color: sc.color, borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>
                        {status}
                      </span>
                    ) : "—"}
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
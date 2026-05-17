import { useState, useEffect, useCallback } from "react";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const DAY_LABELS = { MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday", THURSDAY: "Thursday", FRIDAY: "Friday", SATURDAY: "Saturday" };

function fmt12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h % 12) || 12)}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function useTimeslots(teacherId) {
  const [timeslots, setTimeslots] = useState([]);
  const [availMap, setAvailMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/teachers/${teacherId}/availability`);
      const data = res.data?.data ?? res.data ?? [];
      let rows = Array.isArray(data) ? data : [];
      if (rows.length === 0) {
        const tsRes = await api.get("/timeslots");
        const allTs = tsRes.data?.data ?? [];
        rows = allTs.map(ts => ({ timeslot: ts, available: false }));
      }
      const tsMap = {}, avMap = {};
      rows.forEach(r => {
        const ts = r.timeslot ?? r;
        const tsId = ts.id ?? r.timeslotId;
        if (tsId && !tsMap[tsId]) tsMap[tsId] = ts;
        if (tsId !== undefined) avMap[tsId] = r.available ?? false;
      });
      const sorted = Object.values(tsMap).sort((a, b) => {
        const di = DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek);
        return di !== 0 ? di : (a.slotNumber ?? 0) - (b.slotNumber ?? 0);
      });
      setTimeslots(sorted);
      setAvailMap(avMap);
    } catch (e) {
      setError(e?.response?.data?.message ?? "Failed to load timeslots.");
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => { load(); }, [load]);
  return { timeslots, availMap, loading, error, reload: load };
}

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes pulse-glow  { 0%,100%{opacity:0.5;} 50%{opacity:1;} }
  @keyframes blink       { 0%,100%{opacity:1;} 50%{opacity:0;} }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }

  .tc-day-col {
    flex: 1 1 140px;
    min-width: 128px;
    border-radius: 14px;
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .tc-day-col.active {
    box-shadow: 0 0 0 1px rgba(34,197,94,0.3), 0 8px 32px rgba(34,197,94,0.1);
  }

  .tc-slot-btn {
    display: block;
    width: 100%;
    text-align: left;
    padding: 8px 10px;
    margin-bottom: 5px;
    border-radius: 9px;
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'DM Sans', sans-serif;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.03);
  }
  .tc-slot-btn:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.14); }
  .tc-slot-btn.selected {
    background: rgba(34,197,94,0.1);
    border-color: rgba(34,197,94,0.3);
  }
  .tc-slot-btn.selected:hover { background: rgba(34,197,94,0.14); }

  .tc-ctrl-btn {
    padding: 8px 14px;
    border-radius: 9px;
    font-size: 12px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.18s;
    border: 1px solid;
  }
  .tc-save-btn {
    padding: 9px 18px;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.2s;
    background: linear-gradient(135deg, #22C55E, #16A34A);
    color: #fff;
    border: none;
    box-shadow: 0 4px 16px rgba(34,197,94,0.3);
  }
  .tc-save-btn:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(34,197,94,0.45); transform: translateY(-1px); }
  .tc-save-btn:disabled { opacity: 0.45; cursor: not-allowed; }
`;

function DayColumn({ day, timeslots, selected, onToggle, isSelectedDay, onSelectDay }) {
  const daySlots = timeslots.filter(ts => ts.dayOfWeek === day);
  const allSelected = daySlots.length > 0 && daySlots.every(ts => selected[ts.id]);

  const handleSelectAll = () => {
    if (!isSelectedDay) return;
    const ns = { ...selected };
    daySlots.forEach(ts => { ns[ts.id] = !allSelected; });
    onToggle(ns);
  };

  return (
    <div className={`tc-day-col${isSelectedDay ? " active" : ""}`}
      style={{ background: isSelectedDay ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.025)", border: `1px solid ${isSelectedDay ? "rgba(34,197,94,0.28)" : "rgba(255,255,255,0.08)"}` }}>

      {/* Day header */}
      <div onClick={() => onSelectDay(day)} style={{ padding: "11px 13px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: isSelectedDay ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.03)", borderBottom: `1px solid ${isSelectedDay ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}` }}>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 12, color: isSelectedDay ? "#4ADE80" : "rgba(255,255,255,0.5)", letterSpacing: "0.04em" }}>
          {DAY_LABELS[day]}
        </span>
        {isSelectedDay && daySlots.length > 0 && (
          <button onClick={e => { e.stopPropagation(); handleSelectAll(); }}
            style={{ background: allSelected ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, cursor: "pointer", color: allSelected ? "#4ADE80" : "rgba(255,255,255,0.5)", fontSize: 10, padding: "2px 8px", fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>
            {allSelected ? "✓ All" : "All"}
          </button>
        )}
      </div>

      {/* Slots */}
      <div style={{ padding: "8px" }}>
        {daySlots.length === 0 ? (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", padding: "12px 4px", textAlign: "center", fontFamily: "'DM Mono',monospace" }}>No slots</div>
        ) : daySlots.map(ts => {
          const isAvail = !!selected[ts.id];
          return (
            <button key={ts.id} className={`tc-slot-btn${isAvail ? " selected" : ""}`}
              onClick={() => onToggle({ ...selected, [ts.id]: !isAvail })}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: isAvail ? "#4ADE80" : "rgba(255,255,255,0.6)", fontFamily: "'DM Mono',monospace" }}>
                  {fmt12(ts.startTime)}
                </span>
                <span style={{ width: 15, height: 15, borderRadius: "50%", border: `1.5px solid ${isAvail ? "#22C55E" : "rgba(255,255,255,0.2)"}`, background: isAvail ? "#22C55E" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#fff", flexShrink: 0, transition: "all 0.15s" }}>
                  {isAvail ? "✓" : ""}
                </span>
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2, fontFamily: "'DM Mono',monospace" }}>
                → {fmt12(ts.endTime)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SetAvailability() {
  const { user } = useAuth();
  const teacherId = user?.userId ?? user?.id;
  const { timeslots, availMap, loading, error, reload } = useTimeslots(teacherId);

  const [selected, setSelected] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  useEffect(() => {
    if (Object.keys(availMap).length > 0) {
      setSelected({ ...availMap });
      setIsDirty(false);
      const savedDay = timeslots.find(ts => availMap[ts.id])?.dayOfWeek ?? null;
      setSelectedDay(savedDay);
    }
  }, [availMap, timeslots]);

  const handleToggle = (newSelected) => {
    const currentlySelected = Object.entries(newSelected).filter(([, v]) => v).map(([k]) => k);
    if (currentlySelected.length > 1) {
      const prevSelected = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
      const newlyAdded = currentlySelected.find(k => !prevSelected.includes(k));
      if (newlyAdded) {
        const limited = {};
        Object.keys(newSelected).forEach(k => { limited[k] = k === newlyAdded; });
        setSelected(limited);
      } else { setSelected(newSelected); }
    } else { setSelected(newSelected); }
    setIsDirty(true);
    setSaveMsg(null);
  };

  const handleSelectDay = (day) => {
    setSelectedDay(prev => prev === day ? null : day);
    setIsDirty(true);
    setSaveMsg(null);
  };

  const handleSave = async () => {
    if (!teacherId) return;
    setSaving(true); setSaveMsg(null);
    try {
      const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => Number(k));
      await api.put(`/teachers/${teacherId}/availability`, { availableTimeslotIds: ids });
      setSaveMsg({ type: "success", text: "Availability saved successfully." });
      setIsDirty(false);
      reload();
    } catch (e) {
      setSaveMsg({ type: "error", text: e?.response?.data?.message ?? "Failed to save availability." });
    } finally { setSaving(false); }
  };

  const deselectAll = () => {
    const none = {};
    timeslots.forEach(ts => { none[ts.id] = false; });
    setSelected(none);
    setIsDirty(true);
  };

  const resetToServer = () => { setSelected({ ...availMap }); setIsDirty(false); setSaveMsg(null); };

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const totalSlots = timeslots.length;
  const pct = totalSlots > 0 ? Math.round((selectedCount / totalSlots) * 100) : 0;
  const barColor = pct >= 50 ? "#22C55E" : pct >= 25 ? "#F59E0B" : "#EF4444";

  return (
    <div style={{ minHeight: "100vh", background: "#060D1A", color: "#fff", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{GLOBAL_CSS}</style>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-5%", left: "20%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(34,197,94,0.07) 0%,transparent 70%)", filter: "blur(60px)", animation: "pulse-glow 9s ease infinite" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "0", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,0.05) 0%,transparent 70%)", filter: "blur(60px)", animation: "pulse-glow 11s ease infinite 3s" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)", backgroundSize: "60px 60px", maskImage: "radial-gradient(ellipse at 50% 20%,black 25%,transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 20%,black 25%,transparent 75%)" }} />
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px 60px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 32, animation: "fadeSlideUp 0.5s ease both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 100, padding: "4px 14px", marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block", animation: "blink 2s ease infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#4ADE80", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono',monospace" }}>Availability Settings</span>
          </div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 6 }}>Set My Availability</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, lineHeight: 1.6 }}>Mark the timeslots when you are available. The system will only assign you to available slots.</p>
        </div>

        {/* Error / Save msg */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "11px 16px", marginBottom: 20, color: "#FCA5A5", fontSize: 13 }}>⚠️ {error}</div>
        )}
        {saveMsg && (
          <div style={{ background: saveMsg.type === "success" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${saveMsg.type === "success" ? "rgba(34,197,94,0.28)" : "rgba(239,68,68,0.28)"}`, borderRadius: 10, padding: "11px 16px", marginBottom: 20, color: saveMsg.type === "success" ? "#4ADE80" : "#FCA5A5", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            {saveMsg.type === "success" ? "✅" : "❌"} {saveMsg.text}
          </div>
        )}

        {/* Controls bar */}
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, animation: "fadeSlideUp 0.5s ease 0.1s both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              <span style={{ color: "#4ADE80", fontWeight: 700 }}>{selectedCount}</span> / {totalSlots} slots
            </span>
            {isDirty && (
              <span style={{ fontSize: 10, background: "rgba(245,158,11,0.15)", color: "#FCD34D", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 6, padding: "2px 9px", fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>UNSAVED</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button className="tc-ctrl-btn" onClick={deselectAll}
              style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)", color: "#FCA5A5" }}>
              ✕ Clear All
            </button>
            {isDirty && (
              <button className="tc-ctrl-btn" onClick={resetToServer}
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.45)" }}>
                ↩ Reset
              </button>
            )}
            <button className="tc-save-btn" onClick={handleSave} disabled={saving || !isDirty}>
              {saving ? "Saving…" : "💾 Save Availability"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.2)" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, letterSpacing: "0.06em" }}>Loading timeslots…</div>
          </div>
        ) : timeslots.length === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "60px 24px", textAlign: "center", color: "rgba(255,255,255,0.25)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 600, fontSize: 16, color: "rgba(255,255,255,0.4)" }}>No timeslots found.</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Contact your administrator to set up timeslots.</div>
          </div>
        ) : (
          <div style={{ animation: "fadeSlideUp 0.5s ease 0.15s both" }}>

            {/* Hint */}
            <div style={{ background: selectedDay ? "rgba(34,197,94,0.07)" : "rgba(245,158,11,0.07)", border: `1px solid ${selectedDay ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}`, borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: selectedDay ? "rgba(74,222,128,0.8)" : "rgba(252,211,77,0.8)", fontFamily: "'DM Mono',monospace", letterSpacing: "0.02em" }}>
              {selectedDay ? `${DAY_LABELS[selectedDay]} selected — click a slot to toggle availability.` : "Click any day header to expand it, then select your available timeslot."}
            </div>

            {/* Day grid */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 18, marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
                {DAYS.map(day => (
                  <DayColumn key={day} day={day} timeslots={timeslots} selected={selected}
                    onToggle={handleToggle} isSelectedDay={selectedDay === day} onSelectDay={handleSelectDay} />
                ))}
              </div>
            </div>

            {/* Progress */}
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 20px", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 8, fontFamily: "'DM Mono',monospace" }}>
                <span>Availability Coverage</span>
                <span style={{ color: barColor, fontWeight: 700 }}>{pct}%</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 4, background: barColor, width: `${pct}%`, transition: "width 0.4s ease, background 0.3s ease" }} />
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 8, fontFamily: "'DM Mono',monospace" }}>
                {pct < 30 ? "⚠ Low availability — may impact scheduling." : pct >= 70 ? "✓ Good coverage." : "ℹ Moderate — you can add more slots."}
              </div>
            </div>

            {/* Instructions */}
            <div style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 14, padding: "14px 20px", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.8 }}>
              <span style={{ color: "#4ADE80", fontWeight: 700 }}>How it works: </span>
              Click a day header → select timeslots → hit <span style={{ color: "#4ADE80", fontWeight: 600 }}>Save Availability</span>. The scheduler only assigns you to marked slots.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
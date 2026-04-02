import { useState, useEffect, useCallback } from "react";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const DAY_LABELS = {
  MONDAY:"Monday", TUESDAY:"Tuesday", WEDNESDAY:"Wednesday",
  THURSDAY:"Thursday", FRIDAY:"Friday", SATURDAY:"Saturday",
};

function fmt12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h % 12) || 12)}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetches all available timeslots from the backend.
 * /api/v1/schedules doesn't expose timeslots directly, so we hit
 * the teacher availability endpoint for the current teacher,
 * which returns { id, timeslot: {...}, available } records.
 */
function useTimeslots(teacherId) {
  const [timeslots, setTimeslots] = useState([]);      // all Timeslot objects
  const [availMap,  setAvailMap]  = useState({});      // timeslotId → boolean
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const load = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    setError(null);
    try {
      // GET /api/v1/teachers/{id}/availability  returns List<TeacherAvailability>
      // Each item: { id, teacher, timeslot: {id, dayOfWeek, slotNumber, startTime, endTime, label}, available }
      const res  = await api.get(`/teachers/${teacherId}/availability`);
      const data = res.data?.data ?? res.data ?? [];
      const rows = Array.isArray(data) ? data : [];

      // Extract unique timeslot objects (sorted by day + slot)
      const tsMap = {};
      const avMap = {};
      rows.forEach(r => {
        const ts = r.timeslot ?? r;          // handle flat or nested shape
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function DayColumn({ day, timeslots, selected, onToggle, isSelectedDay, onSelectDay }) {
  const daySlots = timeslots.filter(ts => ts.dayOfWeek === day);
  const allSelected = daySlots.length > 0 && daySlots.every(ts => selected[ts.id]);

  const handleSelectAll = () => {
    if (!isSelectedDay) return;
    const newSelected = { ...selected };
    daySlots.forEach(ts => {
      newSelected[ts.id] = !allSelected;
    });
    onToggle(newSelected);
  };

  return (
    <div style={{
      flex: "1 1 140px", minWidth: 130,
      background: "#fff", borderRadius: 12,
      border: isSelectedDay ? "2px solid #2D6A4F" : "1.5px solid #E8EBF2",
      overflow: "hidden", opacity: isSelectedDay || !Object.values(selected).some(Boolean) ? 1 : 0.45,
      transition: "all 0.2s",
    }}>
      {/* Day header — click to select this day */}
      <div
        onClick={() => onSelectDay(day)}
        style={{
          background: isSelectedDay
            ? "linear-gradient(135deg, #1B4332, #2D6A4F)"
            : "#F3F4F6",
          padding: "10px 12px", cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <span style={{ color: isSelectedDay ? "#fff" : "#374151", fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
          {DAY_LABELS[day]}
        </span>
        {isSelectedDay && daySlots.length > 0 && (
          <button
            onClick={e => { e.stopPropagation(); handleSelectAll(); }}
            title={allSelected ? "Deselect all" : "Select all"}
            style={{
              background: allSelected ? "#52C27E" : "rgba(255,255,255,0.2)",
              border: "none", borderRadius: 6, cursor: "pointer",
              color: "#fff", fontSize: 11, padding: "3px 8px",
              fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {allSelected ? "✓ All" : "All"}
          </button>
        )}
        {!isSelectedDay && (
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>click to select</span>
        )}
      </div>

      {/* Slot list — only interactive if this day is selected */}
      <div style={{ padding: "8px 8px" }}>
        {daySlots.length === 0 ? (
          <div style={{ fontSize: 12, color: "#9CA3AF", padding: "12px 4px", textAlign: "center" }}>No slots</div>
        ) : daySlots.map(ts => {
          const isAvail = !!selected[ts.id];
          return (
            <button
              key={ts.id}
              onClick={() => {
                if (!isSelectedDay) return;
                onToggle({ ...selected, [ts.id]: !isAvail });
              }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "7px 10px", marginBottom: 5, borderRadius: 8,
                border: isAvail ? "1.5px solid #52C27E" : "1.5px solid #E8EBF2",
                background: isAvail ? "#F0FBF4" : "#FAFBFC",
                cursor: isSelectedDay ? "pointer" : "not-allowed",
                transition: "all 0.15s",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: isAvail ? "#1A5C38" : "#374151" }}>
                  {fmt12(ts.startTime)}
                </span>
                <span style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: `2px solid ${isAvail ? "#52C27E" : "#D1D5DB"}`,
                  background: isAvail ? "#52C27E" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: "#fff", flexShrink: 0,
                }}>
                  {isAvail ? "✓" : ""}
                </span>
              </div>
              <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>
                to {fmt12(ts.endTime)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SetAvailability() {
  const { user } = useAuth();
  const teacherId = user?.userId;

  const { timeslots, availMap, loading, error, reload } = useTimeslots(teacherId);

  // Local selected state (timeslotId → boolean)
  const [selected, setSelected] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [isDirty,   setIsDirty]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState(null);  // { type: "success"|"error", text }

  // Sync server state → local selection once loaded
  useEffect(() => {
    if (Object.keys(availMap).length > 0) {
      setSelected({ ...availMap });
      setIsDirty(false);
      // Detect which day was previously saved
      const savedDay = timeslots.find(ts => availMap[ts.id])?.dayOfWeek ?? null;
      setSelectedDay(savedDay);
    }
  }, [availMap, timeslots]);

  const handleToggle = (newSelected) => {
    setSelected(newSelected);
    setIsDirty(true);
    setSaveMsg(null);
  };

  const handleSelectDay = (day) => {
    if (selectedDay === day) return; // already selected
    // Clear all slots from other days, keep slots on new day
    const cleared = {};
    timeslots.forEach(ts => {
      cleared[ts.id] = ts.dayOfWeek === day ? (selected[ts.id] ?? false) : false;
    });
    setSelected(cleared);
    setSelectedDay(day);
    setIsDirty(true);
    setSaveMsg(null);
  };

  const selectedCount    = Object.values(selected).filter(Boolean).length;
  const totalSlots       = timeslots.length;

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!teacherId) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const availableTimeslotIds = Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => Number(k));

      // PUT /api/v1/teachers/{id}/availability
      await api.put(`/teachers/${teacherId}/availability`, { availableTimeslotIds });
      setSaveMsg({ type: "success", text: "✅ Availability saved successfully!" });
      setIsDirty(false);
      reload();
    } catch (e) {
      setSaveMsg({ type: "error", text: "❌ " + (e?.response?.data?.message ?? "Failed to save availability.") });
    } finally {
      setSaving(false);
    }
  };

  // ── Select all / deselect all ───────────────────────────────────────────────

  const selectAll = () => {
    if (!selectedDay) return;
    const all = {};
    timeslots.forEach(ts => {
      all[ts.id] = ts.dayOfWeek === selectedDay;
    });
    setSelected(all);
    setIsDirty(true);
  };

  const deselectAll = () => {
    const none = {};
    timeslots.forEach(ts => { none[ts.id] = false; });
    setSelected(none);
    setIsDirty(true);
  };

  const resetToServer = () => {
    setSelected({ ...availMap });
    setIsDirty(false);
    setSaveMsg(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FC", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button:hover { opacity: 0.9; }
      `}</style>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 60%, #40916C 100%)",
        padding: "28px 40px", color: "#fff",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, opacity: 0.7, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>
            Availability Settings
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, fontWeight: 400 }}>
            Set My Availability
          </h1>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
            Mark the timeslots when you are available to be scheduled. The system will only assign you to available slots.
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px" }}>

        {/* Error */}
        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "#B91C1C", fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Save message */}
        {saveMsg && (
          <div style={{
            background: saveMsg.type === "success" ? "#F0FBF4" : "#FEE2E2",
            border: `1px solid ${saveMsg.type === "success" ? "#52C27E" : "#FCA5A5"}`,
            borderRadius: 10, padding: "12px 16px", marginBottom: 16,
            color: saveMsg.type === "success" ? "#1A5C38" : "#B91C1C", fontSize: 14,
          }}>
            {saveMsg.text}
          </div>
        )}

        {/* Controls bar */}
        <div style={{
          background: "#fff", borderRadius: 14, padding: "14px 20px",
          border: "1.5px solid #E8EBF2", marginBottom: 20,
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#374151" }}>
              <strong style={{ color: "#2D6A4F" }}>{selectedCount}</strong> of {totalSlots} slots selected
            </span>
            {isDirty && (
              <span style={{ fontSize: 11, background: "#FEF3C7", color: "#92400E", borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>
                Unsaved changes
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={selectAll}   style={outlineBtn("#2D6A4F")}>✅ Select All</button>
            <button onClick={deselectAll} style={outlineBtn("#EF4444")}>❌ Clear All</button>
            {isDirty && (
              <button onClick={resetToServer} style={outlineBtn("#9CA3AF")}>↩️ Reset</button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              style={{
                ...solidBtn("#2D6A4F"),
                opacity: saving || !isDirty ? 0.6 : 1,
                cursor: saving || !isDirty ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving…" : "💾 Save Availability"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            <div style={{ fontWeight: 600 }}>Loading timeslots…</div>
          </div>
        ) : timeslots.length === 0 ? (
          <div style={{
            background: "#fff", borderRadius: 16, padding: "48px 24px",
            border: "1.5px solid #E8EBF2", textAlign: "center", color: "#9CA3AF",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>No timeslots found.</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              Availability data could not be loaded. Please contact your administrator.
            </div>
          </div>
        ) : (
          <>
            {/* Main grid */}
            {/* Selected day indicator */}
            <div style={{
              background: selectedDay ? "#F0FBF4" : "#FEF9EE",
              border: `1px solid ${selectedDay ? "#52C27E" : "#FDE68A"}`,
              borderRadius: 10, padding: "10px 16px", marginBottom: 14,
              fontSize: 13, color: selectedDay ? "#1A5C38" : "#92400E",
            }}>
              {selectedDay
                ? `Your selected day: ${DAY_LABELS[selectedDay]} — click time slots to set your available hours`
                : "Click a day header to select your available day (one day only)"}
            </div>
            <div style={{
              background: "#fff", borderRadius: 16, padding: 20,
              border: "1.5px solid #E8EBF2", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
                {DAYS.map(day => (
                  <DayColumn
                    key={day}
                    day={day}
                    timeslots={timeslots}
                    selected={selected}
                    onToggle={handleToggle}
                    isSelectedDay={selectedDay === day}
                    onSelectDay={handleSelectDay}
                  />
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              background: "#fff", borderRadius: 12, padding: "14px 20px",
              border: "1.5px solid #E8EBF2", marginTop: 14,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B7280", marginBottom: 6 }}>
                <span>Availability Coverage</span>
                <span>{totalSlots > 0 ? Math.round((selectedCount / totalSlots) * 100) : 0}%</span>
              </div>
              <div style={{ height: 8, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 4,
                  background: selectedCount / totalSlots >= 0.5 ? "#52C27E" : "#F59E0B",
                  width: `${totalSlots > 0 ? (selectedCount / totalSlots) * 100 : 0}%`,
                  transition: "width 0.3s ease",
                }} />
              </div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>
                {selectedCount < totalSlots * 0.3
                  ? "⚠️ Low availability — the scheduler may have difficulty finding slots for you."
                  : selectedCount >= totalSlots * 0.7
                  ? "✅ Good availability coverage."
                  : "ℹ️ Moderate availability. You can add more slots if needed."}
              </div>
            </div>

            {/* Instructions */}
            <div style={{
              background: "#F0FBF4", borderRadius: 12, padding: "14px 20px",
              border: "1.5px solid #D1FAE5", marginTop: 14,
              fontSize: 13, color: "#1A5C38", lineHeight: 1.7,
            }}>
              <strong>How it works:</strong><br/>
              • Click a day header to select your available day. Only ONE day can be selected.<br/>
              • Once a day is selected, click individual time slots to mark your available hours.<br/>
              • Click <strong>"Save Availability"</strong> to submit your changes to the system.<br/>
              • The scheduling engine will only assign you to timeslots marked as available.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Button styles ────────────────────────────────────────────────────────────

function outlineBtn(color) {
  return {
    padding: "8px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
    background: "#fff", color: color, border: `1.5px solid ${color}`,
  };
}

function solidBtn(color) {
  return {
    padding: "8px 16px", borderRadius: 8, fontSize: 13,
    fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
    background: color, color: "#fff", border: "none",
  };
}
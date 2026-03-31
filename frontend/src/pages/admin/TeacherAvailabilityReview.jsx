import { useState, useEffect } from "react";
import api from "../../services/api";

const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const DAY_SHORT = { MONDAY:"Mon", TUESDAY:"Tue", WEDNESDAY:"Wed", THURSDAY:"Thu", FRIDAY:"Fri", SATURDAY:"Sat" };

function fmt12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h % 12) || 12)}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
}

export default function TeacherAvailabilityReview() {
  const [teachers,   setTeachers]   = useState([]);
  const [selected,   setSelected]   = useState(null); // selected teacher
  const [avail,      setAvail]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [teacherLoading, setTeacherLoading] = useState(true);

  // Load all teachers
  useEffect(() => {
    api.get("/teachers").then(res => {
      setTeachers(res.data?.data ?? res.data ?? []);
      setTeacherLoading(false);
    }).catch(() => setTeacherLoading(false));
  }, []);

  // Load availability when teacher selected
  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api.get(`/teachers/${selected.id}/availability`).then(res => {
      setAvail(res.data?.data ?? res.data ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selected]);

  // Group availability by day
  const byDay = DAYS.reduce((acc, d) => {
    acc[d] = avail.filter(a => a.timeslot?.dayOfWeek === d && a.available);
    return acc;
  }, {});

  const totalAvail = avail.filter(a => a.available).length;
  const totalSlots = avail.length;

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 1100, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: 4 }}>
        Teacher Availability Review
      </h1>
      <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "2rem" }}>
        View and review availability submitted by teachers before generating schedules.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>

        {/* Teacher list */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #e5e7eb", fontSize: 13, fontWeight: 700, color: "#374151" }}>
            Teachers ({teachers.length})
          </div>
          {teacherLoading ? (
            <div style={{ padding: 20, color: "#9ca3af", fontSize: 13 }}>Loading…</div>
          ) : teachers.length === 0 ? (
            <div style={{ padding: 20, color: "#9ca3af", fontSize: 13 }}>No teachers found.</div>
          ) : teachers.map(t => (
            <button key={t.id} onClick={() => setSelected(t)} style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "12px 16px", border: "none", borderBottom: "1px solid #f3f4f6",
              background: selected?.id === t.id ? "#eff6ff" : "#fff",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              borderLeft: selected?.id === t.id ? "3px solid #1a56db" : "3px solid transparent",
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{t.fullName}</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                {t.teacherProfile?.department?.name || "—"}
              </div>
            </button>
          ))}
        </div>

        {/* Availability grid */}
        <div>
          {!selected ? (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "60px 24px", textAlign: "center", color: "#9ca3af" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>👈</div>
              <div style={{ fontWeight: 600 }}>Select a teacher to view their availability</div>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 22 }}>

              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>{selected.fullName}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    {selected.teacherProfile?.department?.name} ·{" "}
                    {selected.teacherProfile?.campusFlexible ? "GE / Flexible" : "Dept-Fixed"}
                  </div>
                </div>
                {!loading && (
                  <div style={{ fontSize: 13, color: "#374151" }}>
                    <strong style={{ color: "#16a34a" }}>{totalAvail}</strong> / {totalSlots} slots available
                  </div>
                )}
              </div>

              {loading ? (
                <div style={{ color: "#9ca3af", padding: "40px 0", textAlign: "center" }}>Loading availability…</div>
              ) : totalSlots === 0 ? (
                <div style={{ color: "#f59e0b", padding: "40px 0", textAlign: "center", fontWeight: 600 }}>
                  ⚠️ This teacher has not submitted availability yet.
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {DAYS.map(day => (
                    <div key={day} style={{ flex: "1 1 130px", minWidth: 120 }}>
                      <div style={{
                        background: "#1B4332", color: "#fff", borderRadius: "8px 8px 0 0",
                        padding: "7px 12px", fontSize: 12, fontWeight: 700,
                      }}>
                        {DAY_SHORT[day]}
                        <span style={{ float: "right", opacity: 0.7 }}>{byDay[day].length}</span>
                      </div>
                      <div style={{ border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
                        {byDay[day].length === 0 ? (
                          <div style={{ padding: "10px 12px", fontSize: 11, color: "#9ca3af", textAlign: "center" }}>None</div>
                        ) : byDay[day].map(a => (
                          <div key={a.timeslotId} style={{
                            padding: "7px 10px", fontSize: 11,
                            borderBottom: "1px solid #f3f4f6",
                            background: "#f0fdf4", color: "#15803d", fontWeight: 500,
                          }}>
                            {fmt12(a.timeslot.startTime)} – {fmt12(a.timeslot.endTime)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
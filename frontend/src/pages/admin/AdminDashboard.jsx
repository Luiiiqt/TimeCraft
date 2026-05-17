import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useConflict from "../../hooks/useConflict";
import api from "../../services/api";

const CURRENT_SEMESTER = "FIRST";
const CURRENT_YEAR = "2024-2025";

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? accent + "40" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 14, padding: "20px", cursor: "pointer",
        textAlign: "left", display: "flex", flexDirection: "column", gap: 10,
        transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif",
        width: "100%", position: "relative", overflow: "hidden",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? `0 12px 40px rgba(0,0,0,0.3)` : "none",
      }}
    >
      {/* top accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent }} />
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.04em" }}>{label}</div>
    </button>
  );
}

// ── Quick Card ────────────────────────────────────────────────────────────────
function QuickCard({ label, icon, accent, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 14, padding: "20px", cursor: "pointer",
        textAlign: "left", display: "flex", flexDirection: "column", gap: 10,
        transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif", width: "100%",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? "0 16px 48px rgba(0,0,0,0.35)" : "none",
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 11,
        background: accent + "18", border: `1px solid ${accent}30`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
        transition: "transform 0.2s",
        transform: hovered ? "scale(1.08)" : "scale(1)",
      }}>{icon}</div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{label}</div>
      <div style={{ fontSize: 13, color: accent, fontWeight: 800 }}>→</div>
    </button>
  );
}

// ── Section Divider ───────────────────────────────────────────────────────────
function SectionTitle({ children, color = "rgba(255,255,255,0.3)" }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      margin: "36px 0 16px",
    }}>
      <span style={{
        fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700,
        color, letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap",
      }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

// ── Dark Input / Select ───────────────────────────────────────────────────────
function DarkInput({ label, style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: 5, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>{label}</label>}
      <input
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: "9px 12px", background: "rgba(255,255,255,0.04)",
          border: `1.5px solid ${focused ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 8, fontSize: 13, color: "#fff", outline: "none",
          fontFamily: "'DM Sans', sans-serif", width: "100%",
          transition: "border-color 0.2s",
          ...style,
        }}
        {...props}
      />
    </div>
  );
}

function DarkSelect({ label, children, style, ...props }) {
  return (
    <div>
      {label && <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: 5, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>{label}</label>}
      <select
        style={{
          padding: "9px 12px", background: "rgba(255,255,255,0.04)",
          border: "1.5px solid rgba(255,255,255,0.08)",
          borderRadius: 8, fontSize: 13, color: "#fff", outline: "none",
          fontFamily: "'DM Sans', sans-serif", width: "100%",
          colorScheme: "dark",
          ...style,
        }}
        {...props}
      >{children}</select>
    </div>
  );
}

// ── Program Head Form ─────────────────────────────────────────────────────────
function ProgramHeadForm({ departments }) {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ fullName: "", email: "", schoolId: "", departmentId: "", courseIds: [], userType: "PROGRAM_HEAD" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/courses").then(r => setCourses(r.data?.data ?? r.data ?? [])).catch(() => {});
  }, []);

  const toggleCourse = (id) => setForm(p => ({
    ...p,
    courseIds: p.courseIds.includes(id) ? p.courseIds.filter(c => c !== id) : [...p.courseIds, id],
  }));

  const handleSubmit = async () => {
    if (!form.fullName || !form.email || !form.schoolId || !form.departmentId || form.courseIds.length === 0) {
      setMsg("err:All fields required and at least one course."); return;
    }
    setSaving(true); setMsg("");
    try {
      await api.post("/admin/program-heads", { ...form, departmentId: Number(form.departmentId) });
      setMsg("ok:Program Head registered. Default password = School ID.");
      setForm({ fullName: "", email: "", schoolId: "", departmentId: "", courseIds: [], userType: "PROGRAM_HEAD" });
    } catch (e) { setMsg("err:" + (e.response?.data?.message ?? "Failed")); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <DarkInput label="Full Name" placeholder="Maria Santos" value={form.fullName} style={{ width: 160 }}
          onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} />
        <DarkInput label="Email" placeholder="maria@lorma.edu" value={form.email} style={{ width: 160 }}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        <DarkInput label="School ID" placeholder="PH-2024-001" value={form.schoolId} style={{ width: 130 }}
          onChange={e => setForm(p => ({ ...p, schoolId: e.target.value }))} />
        <DarkSelect label="Role" value={form.userType} style={{ width: 150 }}
          onChange={e => setForm(p => ({ ...p, userType: e.target.value }))}>
          <option value="PROGRAM_HEAD">Program Head</option>
          <option value="COORDINATOR">Coordinator</option>
        </DarkSelect>
        <DarkSelect label="Department" value={form.departmentId} style={{ width: 140 }}
          onChange={e => setForm(p => ({ ...p, departmentId: e.target.value }))}>
          <option value="">Select…</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
        </DarkSelect>
        <button
          disabled={saving} onClick={handleSubmit}
          style={{
            padding: "9px 18px", borderRadius: 9, border: "none",
            background: "linear-gradient(135deg,#22C55E,#16A34A)", color: "#fff",
            fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 16px rgba(34,197,94,0.25)",
            opacity: saving ? 0.6 : 1, alignSelf: "flex-end",
          }}
        >{saving ? "Saving…" : "Register"}</button>
      </div>
      <div style={{ marginTop: 14 }}>
        <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Assign Courses</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {courses.map(c => (
            <button key={c.id} onClick={() => toggleCourse(c.id)}
              style={{
                padding: "5px 13px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                cursor: "pointer", border: "1.5px solid", transition: "all 0.15s",
                fontFamily: "'DM Sans', sans-serif",
                borderColor: form.courseIds.includes(c.id) ? "#22C55E" : "rgba(255,255,255,0.12)",
                background: form.courseIds.includes(c.id) ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.03)",
                color: form.courseIds.includes(c.id) ? "#86efac" : "rgba(255,255,255,0.45)",
              }}>{c.code ?? c.name}</button>
          ))}
        </div>
      </div>
      {msg && <p style={{ fontSize: 12, marginTop: 8, color: msg.startsWith("ok:") ? "#86efac" : "#fca5a5", fontFamily: "'DM Sans', sans-serif" }}>{msg.slice(3)}</p>}
    </>
  );
}

// ── Delete Term Form ──────────────────────────────────────────────────────────
function DeleteTermForm() {
  const [semester, setSemester] = useState("FIRST");
  const [schoolYear, setSchoolYear] = useState("2024-2025");
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleDelete = async () => {
    if (!window.confirm(`Archive ALL schedules for ${semester} ${schoolYear}? This cannot be undone.`)) return;
    setDeleting(true); setMsg(null);
    try {
      await api.delete("/schedules/term", { params: { semester, schoolYear } });
      setMsg({ ok: true, text: "Schedule archived successfully." });
    } catch (e) {
      setMsg({ ok: false, text: e.response?.data?.message ?? "Failed" });
    } finally { setDeleting(false); }
  };

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
      <DarkSelect label="Semester" value={semester} style={{ width: 150, borderColor: "rgba(220,38,38,0.25)" }}
        onChange={e => setSemester(e.target.value)}>
        <option value="FIRST">1st Semester</option>
        <option value="SECOND">2nd Semester</option>
        <option value="SUMMER">Summer</option>
      </DarkSelect>
      <DarkSelect label="School Year" value={schoolYear} style={{ width: 130, borderColor: "rgba(220,38,38,0.25)" }}
        onChange={e => setSchoolYear(e.target.value)}>
        {["2024-2025", "2025-2026", "2026-2027", "2027-2028"].map(y => <option key={y} value={y}>{y}</option>)}
      </DarkSelect>
      <button
        onClick={handleDelete} disabled={deleting}
        style={{
          padding: "9px 18px", borderRadius: 9,
          background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)",
          color: "#fca5a5", fontSize: 13, fontWeight: 700,
          cursor: deleting ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif",
          opacity: deleting ? 0.6 : 1,
        }}
      >{deleting ? "Archiving…" : "🗑 Archive Schedule"}</button>
      {msg && <span style={{ fontSize: 12, fontWeight: 600, color: msg.ok ? "#86efac" : "#fca5a5", fontFamily: "'DM Sans', sans-serif" }}>
        {msg.ok ? "✓" : "✗"} {msg.text}
      </span>}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unresolvedCount, fetchCount } = useConflict();

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [teacherForm, setTeacherForm] = useState({ fullName: "", email: "", schoolId: "", departmentId: "", isGETeacher: false });
  const [teacherSaving, setTeacherSaving] = useState(false);
  const [teacherMsg, setTeacherMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      setStatsLoading(true);
      try {
        const [deptRes, roomRes, subjectRes, studentRes, conflictCount] = await Promise.all([
          api.get("/departments"), api.get("/rooms"), api.get("/subjects"), api.get("/students"), fetchCount(),
        ]);
        const deps = deptRes.data?.data ?? deptRes.data ?? [];
        const rms  = roomRes.data?.data ?? roomRes.data ?? [];
        const subs = subjectRes.data?.data ?? subjectRes.data ?? [];
        const stus = studentRes.data?.data ?? studentRes.data ?? [];
        setDepartments(Array.isArray(deps) ? deps : []);
        setStats({
          departments: Array.isArray(deps) ? deps.length : 0,
          rooms: Array.isArray(rms) ? rms.length : 0,
          subjects: Array.isArray(subs) ? subs.length : 0,
          students: Array.isArray(stus) ? stus.length : 0,
          conflicts: conflictCount,
        });
      } catch { setStats({ departments: "--", rooms: "--", subjects: "--", students: "--", conflicts: "--" }); }
      finally { setStatsLoading(false); }
    };
    load();
  }, []);

  const val = v => statsLoading ? "…" : v;

  const panel = {
    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14, padding: "22px 24px", marginBottom: 20,
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#060D1A", color: "#fff",
      fontFamily: "'DM Sans', sans-serif", padding: "32px 36px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        select option { background: #0f1a2e; color: #fff; }
        @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
      `}</style>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-8%", left: "30%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at 50% 15%, black 20%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 15%, black 20%, transparent 70%)",
        }} />
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1, animation: "fadeUp 0.4s ease both" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: 100, padding: "4px 14px", marginBottom: 14,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block", animation: "blink 2s ease infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#4ADE80", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
              {CURRENT_SEMESTER === "FIRST" ? "1st" : "2nd"} Semester · {CURRENT_YEAR}
            </span>
          </div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 6 }}>
            Admin Dashboard
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
            Manage users, schedules, and system settings.
          </p>
        </div>

        {/* ── Conflict alert ── */}
        {!statsLoading && stats?.conflicts > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)",
            borderLeft: "3px solid #ef4444", borderRadius: 12,
            padding: "12px 18px", marginBottom: 24,
          }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div style={{ fontSize: 13, color: "#fca5a5" }}>
              <strong style={{ color: "#ef4444" }}>{stats.conflicts} unresolved conflict{stats.conflicts !== 1 ? "s" : ""}</strong>
              {" "}detected in the current schedule.{" "}
              <button onClick={() => navigate("/admin/reports")}
                style={{ background: "none", border: "none", color: "#ef4444", fontWeight: 700, cursor: "pointer", fontSize: 13, padding: 0, textDecoration: "underline" }}>
                View in Reports →
              </button>
            </div>
          </div>
        )}

        {/* ── Stat cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 8 }}>
          <StatCard label="Departments" value={val(stats?.departments)} icon="⬡" accent="#22C55E" onClick={() => navigate("/admin/departments")} />
          <StatCard label="Rooms"       value={val(stats?.rooms)}       icon="▣" accent="#0891b2" onClick={() => navigate("/admin/rooms")} />
          <StatCard label="Subjects"    value={val(stats?.subjects)}    icon="📖" accent="#7c3aed" onClick={() => navigate("/admin/subjects")} />
          <StatCard label="Students"    value={val(stats?.students)}    icon="🎓" accent="#0f766e" onClick={() => navigate("/admin/students")} />
          <StatCard
            label="Conflicts" value={val(stats?.conflicts)} icon="⚠️"
            accent={stats?.conflicts > 0 ? "#ef4444" : "#22C55E"}
            onClick={() => navigate("/admin/reports")}
          />
        </div>

        {/* ── Teacher Registration ── */}
        <SectionTitle>Register Teacher</SectionTitle>
        <div style={panel}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <DarkInput label="Full Name" placeholder="Juan dela Cruz" value={teacherForm.fullName} style={{ width: 160 }}
              onChange={e => setTeacherForm(p => ({ ...p, fullName: e.target.value }))} />
            <DarkInput label="Email" placeholder="juan@lorma.edu" value={teacherForm.email} style={{ width: 160 }}
              onChange={e => setTeacherForm(p => ({ ...p, email: e.target.value }))} />
            <DarkInput label="School ID" placeholder="T-2024-001" value={teacherForm.schoolId} style={{ width: 130 }}
              onChange={e => setTeacherForm(p => ({ ...p, schoolId: e.target.value }))} />
            <DarkSelect label="Department" value={teacherForm.departmentId} style={{ width: 140 }}
              onChange={e => setTeacherForm(p => ({ ...p, departmentId: e.target.value }))}>
              <option value="">Select…</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
            </DarkSelect>

            {/* GE Teacher checkbox */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, paddingBottom: 2, cursor: "pointer" }}
              onClick={() => setTeacherForm(p => ({ ...p, isGETeacher: !p.isGETeacher }))}>
              <div style={{
                width: 18, height: 18, borderRadius: 5, border: "1.5px solid",
                borderColor: teacherForm.isGETeacher ? "#22C55E" : "rgba(255,255,255,0.2)",
                background: teacherForm.isGETeacher ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}>
                {teacherForm.isGETeacher && <span style={{ fontSize: 10, color: "#22C55E", fontWeight: 900 }}>✓</span>}
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>GE Teacher</span>
            </div>

            <button
              disabled={teacherSaving}
              onClick={async () => {
                if (!teacherForm.fullName || !teacherForm.email || !teacherForm.schoolId || !teacherForm.departmentId) {
                  setTeacherMsg("err:All fields required."); return;
                }
                setTeacherSaving(true); setTeacherMsg("");
                try {
                  await api.post("/admin/teachers", { ...teacherForm, departmentId: Number(teacherForm.departmentId) });
                  setTeacherMsg("ok:Teacher registered. Default password = School ID.");
                  setTeacherForm({ fullName: "", email: "", schoolId: "", departmentId: "", isGETeacher: false });
                } catch (e) { setTeacherMsg("err:" + (e.response?.data?.message ?? "Failed")); }
                finally { setTeacherSaving(false); }
              }}
              style={{
                padding: "9px 18px", borderRadius: 9, border: "none",
                background: "linear-gradient(135deg,#22C55E,#16A34A)", color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: teacherSaving ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 16px rgba(34,197,94,0.25)",
                opacity: teacherSaving ? 0.6 : 1, alignSelf: "flex-end",
              }}
            >{teacherSaving ? "Saving…" : "Register"}</button>
          </div>
          {teacherMsg && <p style={{ fontSize: 12, marginTop: 8, color: teacherMsg.startsWith("ok:") ? "#86efac" : "#fca5a5", fontFamily: "'DM Sans', sans-serif" }}>{teacherMsg.slice(3)}</p>}
        </div>

        {/* ── Program Head Registration ── */}
        <SectionTitle>Register Program Head / Coordinator</SectionTitle>
        <div style={panel}>
          <ProgramHeadForm departments={departments} />
        </div>

        {/* ── Quick Actions ── */}
        <SectionTitle>Quick Actions</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 8 }}>
          <QuickCard label="Generate Schedule"             icon="⚡" accent="#22C55E" onClick={() => navigate("/admin/generate")} />
          <QuickCard label="Manage Departments"            icon="⬡" accent="#0891b2" onClick={() => navigate("/admin/departments")} />
          <QuickCard label="Manage Rooms"                  icon="▣" accent="#7c3aed" onClick={() => navigate("/admin/rooms")} />
          <QuickCard label="Manage Subjects"               icon="📖" accent="#f59e0b" onClick={() => navigate("/admin/subjects")} />
          <QuickCard label="Manage Students"               icon="🎓" accent="#22C55E" onClick={() => navigate("/admin/students")} />
          <QuickCard label="Reports"                       icon="↗" accent="#ef4444" onClick={() => navigate("/admin/reports")} />
          <QuickCard label="Teacher Availability"          icon="🕐" accent="#0891b2" onClick={() => navigate("/admin/availability")} />
          <QuickCard label="Irregular Enrollment"          icon="📋" accent="#7c3aed" onClick={() => navigate("/admin/irregular-enrollment")} />
          <QuickCard label="Schedule & Curriculum History" icon="🗂️" accent="#f59e0b" onClick={() => navigate("/admin/history")} />
        </div>

        {/* ── Danger Zone ── */}
        <SectionTitle color="rgba(252,165,165,0.5)">Danger Zone</SectionTitle>
        <div style={{
          background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)",
          borderLeft: "3px solid #ef4444", borderRadius: 14, padding: "20px 24px",
        }}>
          <p style={{ fontSize: 13, color: "rgba(252,165,165,0.6)", marginBottom: 14 }}>
            Archiving a term's schedule moves all entries to history. This action cannot be undone.
          </p>
          <DeleteTermForm />
        </div>

      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useConflict from "../../hooks/useConflict";
import api from "../../services/api";

const CURRENT_SEMESTER = "FIRST";
const CURRENT_YEAR = "2024-2025";

const RESPONSIVE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');
  @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }

  .adm-shell { box-sizing:border-box; min-height:100vh; background:#060D1A; color:#fff; font-family:'DM Sans',sans-serif; padding:clamp(16px,4vw,32px) clamp(16px,4vw,36px); }
  .adm-shell *, .adm-shell *::before, .adm-shell *::after { box-sizing:border-box; }
  select option { background:#0f1a2e; color:#fff; }

  .adm-inner { max-width:1100px; margin:0 auto; position:relative; z-index:1; animation:fadeUp 0.4s ease both; }

  /* Stat grid */
  .adm-stat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; margin-bottom:8px; }
  /* Quick actions grid */
  .adm-quick-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin-bottom:8px; }

  /* Form flex rows */
  .adm-form-row { display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end; }
  .adm-form-row .adm-field { flex:1 1 140px; min-width:0; }

  /* Conflict alert */
  .adm-conflict { display:flex; align-items:flex-start; gap:12px; background:rgba(220,38,38,0.08); border:1px solid rgba(220,38,38,0.2); border-left:3px solid #ef4444; border-radius:12px; padding:12px 18px; margin-bottom:24px; flex-wrap:wrap; }

  /* Panel */
  .adm-panel { background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:clamp(16px,3vw,22px) clamp(16px,3vw,24px); margin-bottom:20px; }

  /* Danger zone */
  .adm-danger { background:rgba(220,38,38,0.05); border:1px solid rgba(220,38,38,0.15); border-left:3px solid #ef4444; border-radius:14px; padding:clamp(16px,3vw,20px) clamp(16px,3vw,24px); }

  /* Inputs */
  .adm-input, .adm-select {
    padding:9px 12px; background:rgba(255,255,255,0.04);
    border:1.5px solid rgba(255,255,255,0.08); border-radius:8px;
    font-size:13px; color:#fff; outline:none;
    font-family:'DM Sans',sans-serif; width:100%;
    transition:border-color 0.2s; colorScheme:dark;
  }
  .adm-input:focus { border-color:rgba(34,197,94,0.5); }
  .adm-select { colorScheme:dark; }

  .adm-label { display:block; font-size:10px; font-weight:700; color:rgba(255,255,255,0.3); margin-bottom:5px; letter-spacing:0.1em; text-transform:uppercase; font-family:'DM Mono',monospace; }

  /* Register button */
  .adm-reg-btn { padding:9px 18px; border-radius:9px; border:none; background:linear-gradient(135deg,#22C55E,#16A34A); color:#fff; font-size:13px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; box-shadow:0 4px 16px rgba(34,197,94,0.25); white-space:nowrap; align-self:flex-end; transition:opacity 0.2s; }
  .adm-reg-btn:disabled { opacity:0.6; cursor:not-allowed; }

  /* Stat card button */
  .adm-stat-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:16px; cursor:pointer; text-align:left; display:flex; flex-direction:column; gap:8px; transition:all 0.2s; font-family:'DM Sans',sans-serif; width:100%; position:relative; overflow:hidden; }
  .adm-stat-card:hover { background:rgba(255,255,255,0.06); transform:translateY(-2px); box-shadow:0 12px 40px rgba(0,0,0,0.3); }

  /* Quick card */
  .adm-quick-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:16px; cursor:pointer; text-align:left; display:flex; flex-direction:column; gap:10px; transition:all 0.2s; font-family:'DM Sans',sans-serif; width:100%; }
  .adm-quick-card:hover { background:rgba(255,255,255,0.06); transform:translateY(-3px); box-shadow:0 16px 48px rgba(0,0,0,0.35); }

  /* Section title */
  .adm-section-title { display:flex; align-items:center; gap:12px; margin:36px 0 16px; }

  /* Checkbox row */
  .adm-checkbox-row { display:flex; align-items:center; gap:7px; cursor:pointer; padding-bottom:2px; flex-shrink:0; }

  /* Course tags */
  .adm-course-tags { display:flex; flex-wrap:wrap; gap:8px; }

  /* Delete form row */
  .adm-delete-row { display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap; }
  .adm-delete-row .adm-field { flex:1 1 120px; min-width:0; }

  /* Responsive: mobile */
  @media (max-width:480px) {
    .adm-stat-grid { grid-template-columns:repeat(2,1fr); }
    .adm-quick-grid { grid-template-columns:repeat(2,1fr); }
  }
`;

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent, onClick }) {
  return (
    <button className="adm-stat-card" onClick={onClick} style={{ borderTop: `2px solid ${accent}` }}>
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(22px,4vw,28px)", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.04em" }}>{label}</div>
    </button>
  );
}

// ── Quick Card ────────────────────────────────────────────────────────────────
function QuickCard({ label, icon, accent, onClick }) {
  return (
    <button className="adm-quick-card" onClick={onClick}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: accent + "18", border: `1px solid ${accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{label}</div>
      <div style={{ fontSize: 13, color: accent, fontWeight: 800 }}>→</div>
    </button>
  );
}

// ── Section Title ─────────────────────────────────────────────────────────────
function SectionTitle({ children, color = "rgba(255,255,255,0.3)" }) {
  return (
    <div className="adm-section-title">
      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, fontWeight: 700, color, letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

// ── Dark Input / Select ───────────────────────────────────────────────────────
function DarkInput({ label, style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ width: "100%" }}>
      {label && <label className="adm-label">{label}</label>}
      <input
        className="adm-input"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ borderColor: focused ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.08)", ...style }}
        {...props}
      />
    </div>
  );
}

function DarkSelect({ label, children, style, ...props }) {
  return (
    <div style={{ width: "100%" }}>
      {label && <label className="adm-label">{label}</label>}
      <select className="adm-select" style={{ colorScheme: "dark", ...style }} {...props}>{children}</select>
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
      <div className="adm-form-row">
        <div className="adm-field"><DarkInput label="Full Name" placeholder="Maria Santos" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} /></div>
        <div className="adm-field"><DarkInput label="Email" placeholder="maria@lorma.edu" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
        <div className="adm-field"><DarkInput label="School ID" placeholder="PH-2024-001" value={form.schoolId} onChange={e => setForm(p => ({ ...p, schoolId: e.target.value }))} /></div>
        <div className="adm-field">
          <DarkSelect label="Role" value={form.userType} onChange={e => setForm(p => ({ ...p, userType: e.target.value }))}>
            <option value="PROGRAM_HEAD">Program Head</option>
            <option value="COORDINATOR">Coordinator</option>
          </DarkSelect>
        </div>
        <div className="adm-field">
          <DarkSelect label="Department" value={form.departmentId} onChange={e => setForm(p => ({ ...p, departmentId: e.target.value }))}>
            <option value="">Select…</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
          </DarkSelect>
        </div>
        <button className="adm-reg-btn" disabled={saving} onClick={handleSubmit}>{saving ? "Saving…" : "Register"}</button>
      </div>
      <div style={{ marginTop: 14 }}>
        <label className="adm-label" style={{ marginBottom: 8 }}>Assign Courses</label>
        <div className="adm-course-tags">
          {courses.map(c => (
            <button key={c.id} onClick={() => toggleCourse(c.id)} style={{
              padding: "5px 13px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: "pointer", border: "1.5px solid", transition: "all 0.15s", fontFamily: "'DM Sans',sans-serif",
              borderColor: form.courseIds.includes(c.id) ? "#22C55E" : "rgba(255,255,255,0.12)",
              background: form.courseIds.includes(c.id) ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.03)",
              color: form.courseIds.includes(c.id) ? "#86efac" : "rgba(255,255,255,0.45)",
            }}>{c.code ?? c.name}</button>
          ))}
        </div>
      </div>
      {msg && <p style={{ fontSize: 12, marginTop: 8, color: msg.startsWith("ok:") ? "#86efac" : "#fca5a5", fontFamily: "'DM Sans',sans-serif" }}>{msg.slice(3)}</p>}
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
    <div className="adm-delete-row">
      <div className="adm-field">
        <DarkSelect label="Semester" value={semester} style={{ borderColor: "rgba(220,38,38,0.25)" }} onChange={e => setSemester(e.target.value)}>
          <option value="FIRST">1st Semester</option>
          <option value="SECOND">2nd Semester</option>
          <option value="SUMMER">Summer</option>
        </DarkSelect>
      </div>
      <div className="adm-field">
        <DarkSelect label="School Year" value={schoolYear} style={{ borderColor: "rgba(220,38,38,0.25)" }} onChange={e => setSchoolYear(e.target.value)}>
          {["2024-2025", "2025-2026", "2026-2027", "2027-2028"].map(y => <option key={y} value={y}>{y}</option>)}
        </DarkSelect>
      </div>
      <button onClick={handleDelete} disabled={deleting} style={{
        padding: "9px 18px", borderRadius: 9, background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)",
        color: "#fca5a5", fontSize: 13, fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer",
        fontFamily: "'DM Sans',sans-serif", opacity: deleting ? 0.6 : 1, whiteSpace: "nowrap", alignSelf: "flex-end",
      }}>{deleting ? "Archiving…" : "🗑 Archive Schedule"}</button>
      {msg && <span style={{ fontSize: 12, fontWeight: 600, color: msg.ok ? "#86efac" : "#fca5a5", fontFamily: "'DM Sans',sans-serif", alignSelf: "flex-end" }}>{msg.ok ? "✓" : "✗"} {msg.text}</span>}
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
        const rms = roomRes.data?.data ?? roomRes.data ?? [];
        const subs = subjectRes.data?.data ?? subjectRes.data ?? [];
        const stus = studentRes.data?.data ?? studentRes.data ?? [];
        setDepartments(Array.isArray(deps) ? deps : []);
        setStats({ departments: Array.isArray(deps) ? deps.length : 0, rooms: Array.isArray(rms) ? rms.length : 0, subjects: Array.isArray(subs) ? subs.length : 0, students: Array.isArray(stus) ? stus.length : 0, conflicts: conflictCount });
      } catch { setStats({ departments: "--", rooms: "--", subjects: "--", students: "--", conflicts: "--" }); }
      finally { setStatsLoading(false); }
    };
    load();
  }, []);

  const val = v => statsLoading ? "…" : v;

  return (
    <div className="adm-shell">
      <style>{RESPONSIVE_CSS}</style>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-8%", left: "30%", width: "clamp(300px,50vw,600px)", height: "clamp(300px,50vw,600px)", borderRadius: "50%", background: "radial-gradient(circle,rgba(34,197,94,0.07) 0%,transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "5%", width: "clamp(200px,35vw,400px)", height: "clamp(200px,35vw,400px)", borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,0.05) 0%,transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)", backgroundSize: "60px 60px", maskImage: "radial-gradient(ellipse at 50% 15%,black 20%,transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 15%,black 20%,transparent 70%)" }} />
      </div>

      <div className="adm-inner">
        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 100, padding: "4px 14px", marginBottom: 14 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block", animation: "blink 2s ease infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#4ADE80", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono',monospace" }}>
              {CURRENT_SEMESTER === "FIRST" ? "1st" : "2nd"} Semester · {CURRENT_YEAR}
            </span>
          </div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(1.5rem,5vw,2rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 6 }}>Admin Dashboard</h1>
          <p style={{ fontSize: "clamp(12px,2vw,14px)", color: "rgba(255,255,255,0.4)" }}>Manage users, schedules, and system settings.</p>
        </div>

        {/* ── Conflict alert ── */}
        {!statsLoading && stats?.conflicts > 0 && (
          <div className="adm-conflict">
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <div style={{ fontSize: 13, color: "#fca5a5", minWidth: 0 }}>
              <strong style={{ color: "#ef4444" }}>{stats.conflicts} unresolved conflict{stats.conflicts !== 1 ? "s" : ""}</strong>
              {" "}detected in the current schedule.{" "}
              <button onClick={() => navigate("/admin/reports")} style={{ background: "none", border: "none", color: "#ef4444", fontWeight: 700, cursor: "pointer", fontSize: 13, padding: 0, textDecoration: "underline" }}>
                View in Reports →
              </button>
            </div>
          </div>
        )}

        {/* ── Stat cards ── */}
        <div className="adm-stat-grid">
          <StatCard label="Departments" value={val(stats?.departments)} icon="⬡" accent="#22C55E" onClick={() => navigate("/admin/departments")} />
          <StatCard label="Rooms" value={val(stats?.rooms)} icon="▣" accent="#0891b2" onClick={() => navigate("/admin/rooms")} />
          <StatCard label="Subjects" value={val(stats?.subjects)} icon="📖" accent="#7c3aed" onClick={() => navigate("/admin/subjects")} />
          <StatCard label="Students" value={val(stats?.students)} icon="🎓" accent="#0f766e" onClick={() => navigate("/admin/students")} />
          <StatCard label="Conflicts" value={val(stats?.conflicts)} icon="⚠️" accent={stats?.conflicts > 0 ? "#ef4444" : "#22C55E"} onClick={() => navigate("/admin/reports")} />
        </div>

        {/* ── Teacher Registration ── */}
        <SectionTitle>Register Teacher</SectionTitle>
        <div className="adm-panel">
          <div className="adm-form-row">
            <div className="adm-field"><DarkInput label="Full Name" placeholder="Juan dela Cruz" value={teacherForm.fullName} onChange={e => setTeacherForm(p => ({ ...p, fullName: e.target.value }))} /></div>
            <div className="adm-field"><DarkInput label="Email" placeholder="juan@lorma.edu" value={teacherForm.email} onChange={e => setTeacherForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="adm-field"><DarkInput label="School ID" placeholder="T-2024-001" value={teacherForm.schoolId} onChange={e => setTeacherForm(p => ({ ...p, schoolId: e.target.value }))} /></div>
            <div className="adm-field">
              <DarkSelect label="Department" value={teacherForm.departmentId} onChange={e => setTeacherForm(p => ({ ...p, departmentId: e.target.value }))}>
                <option value="">Select…</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
              </DarkSelect>
            </div>
            <div className="adm-checkbox-row" onClick={() => setTeacherForm(p => ({ ...p, isGETeacher: !p.isGETeacher }))}>
              <div style={{ width: 18, height: 18, borderRadius: 5, border: "1.5px solid", borderColor: teacherForm.isGETeacher ? "#22C55E" : "rgba(255,255,255,0.2)", background: teacherForm.isGETeacher ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}>
                {teacherForm.isGETeacher && <span style={{ fontSize: 10, color: "#22C55E", fontWeight: 900 }}>✓</span>}
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>GE Teacher</span>
            </div>
            <button className="adm-reg-btn" disabled={teacherSaving}
              onClick={async () => {
                if (!teacherForm.fullName || !teacherForm.email || !teacherForm.schoolId || !teacherForm.departmentId) { setTeacherMsg("err:All fields required."); return; }
                setTeacherSaving(true); setTeacherMsg("");
                try {
                  await api.post("/admin/teachers", { ...teacherForm, departmentId: Number(teacherForm.departmentId) });
                  setTeacherMsg("ok:Teacher registered. Default password = School ID.");
                  setTeacherForm({ fullName: "", email: "", schoolId: "", departmentId: "", isGETeacher: false });
                } catch (e) { setTeacherMsg("err:" + (e.response?.data?.message ?? "Failed")); }
                finally { setTeacherSaving(false); }
              }}
            >{teacherSaving ? "Saving…" : "Register"}</button>
          </div>
          {teacherMsg && <p style={{ fontSize: 12, marginTop: 8, color: teacherMsg.startsWith("ok:") ? "#86efac" : "#fca5a5", fontFamily: "'DM Sans',sans-serif" }}>{teacherMsg.slice(3)}</p>}
        </div>

        {/* ── Program Head Registration ── */}
        <SectionTitle>Register Program Head / Coordinator</SectionTitle>
        <div className="adm-panel">
          <ProgramHeadForm departments={departments} />
        </div>

        {/* ── Quick Actions ── */}
        <SectionTitle>Quick Actions</SectionTitle>
        <div className="adm-quick-grid">
          <QuickCard label="Generate Schedule" icon="⚡" accent="#22C55E" onClick={() => navigate("/admin/generate")} />
          <QuickCard label="Manage Departments" icon="⬡" accent="#0891b2" onClick={() => navigate("/admin/departments")} />
          <QuickCard label="Manage Rooms" icon="▣" accent="#7c3aed" onClick={() => navigate("/admin/rooms")} />
          <QuickCard label="Manage Subjects" icon="📖" accent="#f59e0b" onClick={() => navigate("/admin/subjects")} />
          <QuickCard label="Manage Students" icon="🎓" accent="#22C55E" onClick={() => navigate("/admin/students")} />
          <QuickCard label="Reports" icon="↗" accent="#ef4444" onClick={() => navigate("/admin/reports")} />
          <QuickCard label="Teacher Availability" icon="🕐" accent="#0891b2" onClick={() => navigate("/admin/availability")} />
          <QuickCard label="Irregular Enrollment" icon="📋" accent="#7c3aed" onClick={() => navigate("/admin/irregular-enrollment")} />
          <QuickCard label="Schedule & Curriculum History" icon="🗂️" accent="#f59e0b" onClick={() => navigate("/admin/history")} />
        </div>

        {/* ── Danger Zone ── */}
        <SectionTitle color="rgba(252,165,165,0.5)">Danger Zone</SectionTitle>
        <div className="adm-danger">
          <p style={{ fontSize: 13, color: "rgba(252,165,165,0.6)", marginBottom: 14 }}>Archiving a term's schedule moves all entries to history. This action cannot be undone.</p>
          <DeleteTermForm />
        </div>
      </div>
    </div>
  );
}
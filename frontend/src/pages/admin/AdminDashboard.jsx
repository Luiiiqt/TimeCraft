import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useConflict from "../../hooks/useConflict";
import api from "../../services/api";

const CURRENT_SEMESTER = "FIRST";
const CURRENT_YEAR = "2024-2025";

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, accentColor, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "#fff", border: "1px solid #E0EAE0",
      borderTop: `3px solid ${accentColor}`,
      borderRadius: "12px", padding: "18px",
      cursor: "pointer", textAlign: "left",
      display: "flex", flexDirection: "column", gap: "8px",
      width: "100%", fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ fontSize: "1.4rem" }}>{icon}</div>
      <div style={{ fontSize: "24px", fontWeight: "700", color: "#112A17" }}>{value}</div>
      <div style={{ fontSize: "13px", color: "#555" }}>{label}</div>
    </button>
  );
}

// ── Quick Action Card ─────────────────────────────────────────────────────────

function QuickCard({ label, icon, accentColor, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "var(--surface-card)",
        border: `1.5px solid var(--grey-200)`,
        borderTop: `3px solid ${accentColor}`,
        borderRadius: "var(--radius-xl)",
        padding: "var(--space-5) var(--space-5)",
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        boxShadow: "var(--shadow-sm)",
        transition: "box-shadow var(--ease-base), transform var(--ease-base)",
        fontFamily: "var(--font-body)",
        width: "100%",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{
        width: 44,
        height: 44,
        borderRadius: "var(--radius-lg)",
        background: accentColor + "18",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.6rem",
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: "var(--text-sm)",
        fontWeight: "var(--weight-semibold)",
        color: "var(--grey-900)",
      }}>
        {label}
      </div>
      <div style={{
        fontSize: "var(--text-sm)",
        color: accentColor,
        fontWeight: "var(--weight-bold)",
      }}>
        →
      </div>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

function ProgramHeadForm({ departments }) {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ fullName: "", email: "", schoolId: "", departmentId: "", courseIds: [], userType: "PROGRAM_HEAD" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/courses").then(r => setCourses(r.data?.data ?? r.data ?? [])).catch(() => {});
  }, []);

  const toggleCourse = (id) => {
    setForm(p => ({
      ...p,
      courseIds: p.courseIds.includes(id)
        ? p.courseIds.filter(c => c !== id)
        : [...p.courseIds, id],
    }));
  };

  const handleSubmit = async () => {
    if (!form.fullName || !form.email || !form.schoolId || !form.departmentId || form.courseIds.length === 0) {
      setMsg("✗ All fields required and at least one course."); return;
    }
    setSaving(true); setMsg("");
    try {
      await api.post("/admin/program-heads", {
        fullName: form.fullName,
        email: form.email,
        schoolId: form.schoolId,
        departmentId: Number(form.departmentId),
        courseIds: form.courseIds,
        userType: form.userType || "PROGRAM_HEAD",
      });
      setMsg("✓ Program Head registered. Default password = School ID.");
      setForm({ fullName: "", email: "", schoolId: "", departmentId: "", courseIds: [] });
    } catch (e) {
      setMsg("✗ " + (e.response?.data?.message ?? "Failed"));
    } finally { setSaving(false); }
  };

  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        {[
          { key: "fullName", label: "FULL NAME", placeholder: "Maria Santos" },
          { key: "email", label: "EMAIL", placeholder: "maria@school.edu" },
          { key: "schoolId", label: "SCHOOL ID", placeholder: "PH-2024-001" },
        ].map(f => (
          <div key={f.key}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--grey-500)", display: "block", marginBottom: 4 }}>{f.label}</label>
            <input placeholder={f.placeholder} value={form[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              style={{ padding: "7px 10px", borderRadius: 7, border: "1.5px solid var(--grey-200)", fontSize: 13, width: 160 }} />
          </div>
        ))}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--grey-500)", display: "block", marginBottom: 4 }}>ROLE</label>
          <select value={form.userType} onChange={e => setForm(p => ({ ...p, userType: e.target.value }))}
            style={{ padding: "7px 10px", borderRadius: 7, border: "1.5px solid var(--grey-200)", fontSize: 13 }}>
            <option value="PROGRAM_HEAD">Program Head</option>
            <option value="COORDINATOR">Coordinator</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--grey-500)", display: "block", marginBottom: 4 }}>DEPARTMENT</label>
          <select value={form.departmentId} onChange={e => setForm(p => ({ ...p, departmentId: e.target.value }))}
            style={{ padding: "7px 10px", borderRadius: 7, border: "1.5px solid var(--grey-200)", fontSize: 13 }}>
            <option value="">Select…</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
          </select>
        </div>
        <button disabled={saving} onClick={handleSubmit}
          style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: saving ? "#AAC8AA" : "#1A6A2A", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {saving ? "Saving…" : "Register"}
        </button>
      </div>

      {/* Course multi-select */}
      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--grey-500)", display: "block", marginBottom: 6 }}>ASSIGN COURSES</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {courses.map(c => (
            <button key={c.id} onClick={() => toggleCourse(c.id)}
              style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: `1.5px solid ${form.courseIds.includes(c.id) ? "#1A6A2A" : "#d1d5db"}`,
                background: form.courseIds.includes(c.id) ? "#d1fae5" : "#f9fafb",
                color: form.courseIds.includes(c.id) ? "#065f46" : "#374151",
              }}>
              {c.code ?? c.name}
            </button>
          ))}
        </div>
      </div>

      {msg && <p style={{ fontSize: 12, marginTop: 8, color: msg.startsWith("✓") ? "#16a34a" : "#dc2626" }}>{msg}</p>}
    </>
  );
}

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
  const [showTeacherForm, setShowTeacherForm] = useState(false);

  const [courses, setCourses] = useState([]);
  const [phForm, setPhForm] = useState({ fullName: "", email: "", schoolId: "", departmentId: "", courseIds: [] });
  const [phSaving, setPhSaving] = useState(false);
  const [phMsg, setPhMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      setStatsLoading(true);
      try {
        const [deptRes, roomRes, subjectRes, studentRes, conflictCount] = await Promise.all([
          api.get("/departments"),
          api.get("/rooms"),
          api.get("/subjects"),
          api.get("/students"),
          fetchCount(),
        ]);
        const departments = deptRes.data?.data ?? deptRes.data ?? [];
        const rooms = roomRes.data?.data ?? roomRes.data ?? [];
        const subjects = subjectRes.data?.data ?? subjectRes.data ?? [];
        const students = studentRes.data?.data ?? studentRes.data ?? [];
        setDepartments(Array.isArray(departments) ? departments : []);
        setStats({
          departments: Array.isArray(departments) ? departments.length : 0,
          rooms: Array.isArray(rooms) ? rooms.length : 0,
          subjects: Array.isArray(subjects) ? subjects.length : 0,
          students: Array.isArray(students) ? students.length : 0,
          conflicts: conflictCount,
        });
      } catch {
        setStats({ departments: "--", rooms: "--", conflicts: "--" });
      } finally {
        setStatsLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const val = (v) => (statsLoading ? "…" : v);

  return (
    <div className="fade-in">

      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          {CURRENT_SEMESTER} Semester · {CURRENT_YEAR}
        </p>
      </div>

      {/* Conflict alert banner */}
      {!statsLoading && stats?.conflicts > 0 && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: "10px",
          background: "rgba(226,75,74,0.07)", border: "1px solid rgba(226,75,74,0.25)",
          borderLeft: "3px solid #E24B4A", borderRadius: "10px",
          padding: "12px 16px", marginBottom: "24px",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>⚠️</span>
          <div style={{ fontSize: "13px", color: "#7A1A1A" }}>
            <strong>{stats.conflicts} unresolved conflict{stats.conflicts !== 1 ? "s" : ""}</strong>{" "}
            detected in the current schedule.{" "}
            <button onClick={() => navigate("/admin/reports")} style={{
              background: "none", border: "none", color: "#E24B4A",
              fontWeight: "700", cursor: "pointer", fontSize: "13px",
              padding: 0, textDecoration: "underline", fontFamily: "'DM Sans', sans-serif",
            }}>View in Reports →</button>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
        gap: "12px", marginBottom: "28px",
      }}>
        <StatCard
          label="Departments"
          value={val(stats?.departments)}
          icon="⬡"
          accentColor="#34C47C"
          onClick={() => navigate("/admin/departments")}
        />
        <StatCard
          label="Rooms"
          value={val(stats?.rooms)}
          icon="▣"
          accentColor="#0891b2"
          onClick={() => navigate("/admin/rooms")}
        />
        <StatCard
          label="Subjects"
          value={val(stats?.subjects)}
          icon="📖"
          accentColor="#7c3aed"
          onClick={() => navigate("/admin/subjects")}
        />
        <StatCard
          label="Students"
          value={val(stats?.students)}
          icon="🎓"
          accentColor="#0f766e"
          onClick={() => navigate("/admin/students")}
        />
        <StatCard
          label="Unresolved Conflicts"
          value={val(stats?.conflicts)}
          icon="⚠️"
          accentColor={stats?.conflicts > 0 ? "var(--color-danger)" : "var(--color-success)"}
          onClick={() => navigate("/admin/reports")}
        />
      </div>

      {/* Teacher Registration */}
      <h2 className="section-title" style={{ marginBottom: "var(--space-3)" }}>Register Teacher</h2>
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E0EAE0", padding: "20px 22px", marginBottom: "24px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          {[
            { key: "fullName", label: "FULL NAME", placeholder: "Juan dela Cruz" },
            { key: "email", label: "EMAIL", placeholder: "juan@school.edu" },
            { key: "schoolId", label: "SCHOOL ID", placeholder: "T-2024-001" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--grey-500)", display: "block", marginBottom: 4 }}>{f.label}</label>
              <input placeholder={f.placeholder} value={teacherForm[f.key]}
                onChange={e => setTeacherForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ padding: "7px 10px", borderRadius: 7, border: "1.5px solid var(--grey-200)", fontSize: 13, width: 160 }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--grey-500)", display: "block", marginBottom: 4 }}>DEPARTMENT</label>
            <select value={teacherForm.departmentId} onChange={e => setTeacherForm(p => ({ ...p, departmentId: e.target.value }))}
              style={{ padding: "7px 10px", borderRadius: 7, border: "1.5px solid var(--grey-200)", fontSize: 13 }}>
              <option value="">Select…</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 4 }}>
            <input type="checkbox" id="isGE" checked={teacherForm.isGETeacher}
              onChange={e => setTeacherForm(p => ({ ...p, isGETeacher: e.target.checked }))}
              style={{ width: 14, height: 14 }} />
            <label htmlFor="isGE" style={{ fontSize: 12, color: "var(--grey-700)", cursor: "pointer" }}>GE Teacher</label>
          </div>
          <button disabled={teacherSaving} onClick={async () => {
            if (!teacherForm.fullName || !teacherForm.email || !teacherForm.schoolId || !teacherForm.departmentId) {
              setTeacherMsg("✗ All fields required."); return;
            }
            setTeacherSaving(true); setTeacherMsg("");
            try {
              await api.post("/admin/teachers", {
                fullName: teacherForm.fullName,
                email: teacherForm.email,
                schoolId: teacherForm.schoolId,
                departmentId: Number(teacherForm.departmentId),
                isGETeacher: teacherForm.isGETeacher,
              });
              setTeacherMsg("✓ Teacher registered. Default password = School ID.");
              setTeacherForm({ fullName: "", email: "", schoolId: "", departmentId: "", isGETeacher: false });
            } catch (e) {
              setTeacherMsg("✗ " + (e.response?.data?.message ?? "Failed"));
            } finally { setTeacherSaving(false); }
          }} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: teacherSaving ? "#AAC8AA" : "#1A6A2A", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            {teacherSaving ? "Saving…" : "Register"}
          </button>
        </div>
        {teacherMsg && <p style={{ fontSize: 12, marginTop: 8, color: teacherMsg.startsWith("✓") ? "#16a34a" : "#dc2626" }}>{teacherMsg}</p>}
      </div>

      {/* Program Head Registration */}
      <h2 className="section-title" style={{ marginBottom: "var(--space-3)" }}>Register Program Head / Coordinator</h2>
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E0EAE0", padding: "20px 22px", marginBottom: "24px", fontFamily: "'DM Sans', sans-serif" }}>
        <ProgramHeadForm departments={departments} />
      </div>

      {/* Quick actions */}
      <h2 className="section-title">Quick Actions</h2>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px",
      }}>
        <QuickCard
          label="Generate Schedule"
          icon="⚡"
          accentColor="var(--brand-secondary)"
          onClick={() => navigate("/admin/generate")}
        />
        <QuickCard
          label="Manage Departments"
          icon="⬡"
          accentColor="#185FA5"
          onClick={() => navigate("/admin/departments")}
        />
        <QuickCard
          label="Manage Rooms"
          icon="▣"
          accentColor="#534AB7"
          onClick={() => navigate("/admin/rooms")}
        />
        <QuickCard
          label="Manage Subjects"
          icon="📖"
          accentColor="#BA7517"
          onClick={() => navigate("/admin/subjects")}
        />
        <QuickCard
          label="Manage Students"
          icon="🎓"
          accentColor="#1A6A2A"
          onClick={() => navigate("/admin/students")}
        />
        <QuickCard
          label="Reports"
          icon="↗"
          accentColor="#E24B4A"
          onClick={() => navigate("/admin/reports")}
        />
        <QuickCard
          label="Teacher Availability"
          icon="🕐"
          accentColor="#185FA5"
          onClick={() => navigate("/admin/availability")}
        />
        <QuickCard
          label="Irregular Enrollment"
          icon="📋"
          accentColor="#534AB7"
          onClick={() => navigate("/admin/irregular-enrollment")}
        />
      </div>
    </div>
  );
}
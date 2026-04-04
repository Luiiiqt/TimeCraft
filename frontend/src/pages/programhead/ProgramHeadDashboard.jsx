import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

function getDefaultTerm() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const semester = month >= 6 && month <= 10 ? "FIRST" : "SECOND";
  const schoolYear = `${year}-${year + 1}`;
  return { semester, schoolYear };
}
const { semester: SEMESTER, schoolYear: SCHOOL_YEAR } = getDefaultTerm();

export default function ProgramHeadDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [sectionForm, setSectionForm] = useState({ courseId: "", yearLevel: 1, sectionCount: 1 });
  const [sectionSaving, setSectionSaving] = useState(false);
  const [sectionMsg, setSectionMsg] = useState("");

  useEffect(() => {
    Promise.all([
      api.get(`/program-head/assignments?semester=${SEMESTER}&schoolYear=${SCHOOL_YEAR}`),
      api.get(`/program-head/preferences?semester=${SEMESTER}&schoolYear=${SCHOOL_YEAR}`),
      api.get(`/program-head/my-courses`),
    ]).then(([aRes, pRes, cRes]) => {
      setAssignments(aRes.data?.data ?? []);
      setPending((pRes.data?.data ?? []).filter(p => p.status === "PENDING"));
      const courseList = cRes.data?.data ?? [];
      setCourses(courseList);
      if (courseList.length > 0) setSectionForm(f => ({ ...f, courseId: courseList[0].id }));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const saveSectionConfig = async () => {
    if (!sectionForm.courseId) return;
    setSectionSaving(true); setSectionMsg("");
    try {
      await api.post("/sections/config", {
        courseId: Number(sectionForm.courseId),
        yearLevel: Number(sectionForm.yearLevel),
        sectionCount: Number(sectionForm.sectionCount),
        semester: SEMESTER,
        schoolYear: SCHOOL_YEAR,
      });
      setSectionMsg(`✓ ${sectionForm.sectionCount} section(s) created for Year ${sectionForm.yearLevel}`);
    } catch (e) {
      setSectionMsg("✗ " + (e.response?.data?.message ?? "Failed to save"));
    } finally {
      setSectionSaving(false);
    }
  };

  const finalized = assignments.filter(a => a.finalized).length;

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 1000, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: 4 }}>
        Program Head Dashboard
      </h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 28 }}>
        {user?.departmentName} · {SEMESTER === "FIRST" ? "1st" : SEMESTER === "SECOND" ? "2nd" : "Summer"} Semester {SCHOOL_YEAR}
      </p>

      {user?.courses?.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {user.courses.map(c => (
            <span key={c.id} style={{ padding: "3px 12px", background: "#dbeafe", color: "#1e40af", borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
              {c.code}
            </span>
          ))}
        </div>
      )}
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Assignments", value: loading ? "…" : assignments.length, color: "#1a56db" },
          { label: "Finalized", value: loading ? "…" : finalized, color: "#16a34a" },
          { label: "Pending Approvals", value: loading ? "…" : pending.length, color: "#d97706" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "20px 22px", border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Section Setup */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "20px 22px", marginBottom: 28 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 14 }}>Section Setup</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          {courses.length > 1 && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>COURSE</label>
              <select value={sectionForm.courseId} onChange={e => setSectionForm(f => ({ ...f, courseId: e.target.value }))}
                style={{ padding: "7px 10px", borderRadius: 7, border: "1.5px solid #d1d5db", fontSize: 13 }}>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>YEAR LEVEL</label>
            <select value={sectionForm.yearLevel} onChange={e => setSectionForm(f => ({ ...f, yearLevel: e.target.value }))}
              style={{ padding: "7px 10px", borderRadius: 7, border: "1.5px solid #d1d5db", fontSize: 13 }}>
              {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>NO. OF SECTIONS</label>
            <input type="number" min={1} max={10} value={sectionForm.sectionCount}
              onChange={e => setSectionForm(f => ({ ...f, sectionCount: e.target.value }))}
              style={{ width: 80, padding: "7px 10px", borderRadius: 7, border: "1.5px solid #d1d5db", fontSize: 13 }} />
          </div>
          <button onClick={saveSectionConfig} disabled={sectionSaving}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: sectionSaving ? "#93c5fd" : "#1a56db",
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: sectionSaving ? "not-allowed" : "pointer" }}>
            {sectionSaving ? "Saving…" : "Save & Create Sections"}
          </button>
        </div>
        {sectionMsg && <p style={{ fontSize: 12, marginTop: 10, color: sectionMsg.startsWith("✓") ? "#16a34a" : "#dc2626" }}>{sectionMsg}</p>}
      </div>

      {/* Quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {[
          { to: "/program-head/assignments", icon: "📋", label: "Manage Subject Assignments", color: "#1a56db" },
          { to: "/program-head/preferences", icon: "✅", label: "Review Teacher Preferences", color: "#16a34a" },
          { to: "/program-head/generate", icon: "⚡", label: "Generate Schedule", color: "#7c3aed" },
          { to: "/program-head/subjects", icon: "📚", label: "Manage Subjects", color: "#0891b2" },
        ].map(l => (
          <Link key={l.to} to={l.to} style={{
            background: "#fff", borderRadius: 12, padding: "20px 18px",
            border: "1px solid #e5e7eb", borderTop: `3px solid ${l.color}`,
            textDecoration: "none", display: "block",
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{l.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{l.label}</div>
            <div style={{ fontSize: 12, color: l.color, marginTop: 4, fontWeight: 600 }}>→</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
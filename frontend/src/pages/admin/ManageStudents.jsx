import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

const YEAR_LABELS = { 1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year" };

function badge(text, color) {
  return (
    <span style={{
      display      : "inline-block",
      padding      : "2px 10px",
      borderRadius : 20,
      fontSize     : 11,
      fontWeight   : 700,
      background   : color + "18",
      color,
      border       : `1px solid ${color}40`,
      letterSpacing: "0.03em",
    }}>
      {text}
    </span>
  );
}

const EMPTY_FORM = {
  fullName    : "",
  schoolId    : "",
  email       : "",
  courseId    : "",
  departmentId: "",
  yearLevel   : "1",
  section     : "",
  isIrregular : false,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldGroup({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--grey-500)", display: "block", marginBottom: 4, letterSpacing: "0.05em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, style = {} }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        padding      : "7px 10px",
        borderRadius : 7,
        border       : "1.5px solid var(--grey-200)",
        fontSize     : 13,
        width        : "100%",
        fontFamily   : "var(--font-body)",
        background   : "var(--surface-page)",
        color        : "var(--grey-900)",
        ...style,
      }}
    />
  );
}

function Select({ value, onChange, children, style = {} }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        padding      : "7px 10px",
        borderRadius : 7,
        border       : "1.5px solid var(--grey-200)",
        fontSize     : 13,
        width        : "100%",
        fontFamily   : "var(--font-body)",
        background   : "var(--surface-page)",
        color        : "var(--grey-900)",
        ...style,
      }}
    >
      {children}
    </select>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ManageStudents() {
  const [students,     setStudents]     = useState([]);
  const [courses,      setCourses]      = useState([]);
  const [departments,  setDepartments]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [msg,          setMsg]          = useState("");

  // form
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [showForm,     setShowForm]     = useState(false);

  // filters
  const [filterCourse, setFilterCourse] = useState("");
  const [filterYear,   setFilterYear]   = useState("");
  const [filterType,   setFilterType]   = useState(""); // "irregular" | ""
  const [search,       setSearch]       = useState("");

  // promote / tag modal
  const [actionStudent, setActionStudent] = useState(null); // { id, name, action }
  const [tagSection,    setTagSection]    = useState("");
  const [actionSaving,  setActionSaving]  = useState(false);
  const [actionMsg,     setActionMsg]     = useState("");

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  // ── Load ────────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterCourse)              params.courseId   = filterCourse;
      if (filterYear)                params.yearLevel  = filterYear;
      if (filterType === "irregular") params.irregular = true;

      const [sRes, cRes, dRes] = await Promise.all([
        api.get("/students", { params }),
        api.get("/courses"),
        api.get("/departments"),
      ]);

      const raw = sRes.data?.data ?? sRes.data ?? [];
      setStudents(Array.isArray(raw) ? raw : []);
      setCourses(Array.isArray(cRes.data?.data ?? cRes.data) ? (cRes.data?.data ?? cRes.data) : []);
      setDepartments(Array.isArray(dRes.data?.data ?? dRes.data) ? (dRes.data?.data ?? dRes.data) : []);
    } catch {
      flash("✗ Failed to load students.");
    } finally {
      setLoading(false);
    }
  }, [filterCourse, filterYear, filterType]);

  useEffect(() => { load(); }, [load]);

  // ── Create Student ──────────────────────────────────────────────────────────

  const handleCreate = async () => {
    const { fullName, schoolId, email, courseId, departmentId, yearLevel, section, isIrregular } = form;
    if (!fullName || !schoolId || !email || !courseId || !departmentId || !yearLevel) {
      flash("✗ All required fields must be filled."); return;
    }
    if (!isIrregular && !section) {
      flash("✗ Section is required for regular students."); return;
    }
    setSaving(true);
    try {
      await api.post("/students", {
        fullName,
        schoolId,
        email,
        password    : schoolId,           // default password = school ID
        courseId    : Number(courseId),
        departmentId: Number(departmentId),
        yearLevel   : Number(yearLevel),
        section     : isIrregular ? null : section.toUpperCase(),
        isIrregular,
      });
      flash("✓ Student registered. Default password = School ID.");
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (e) {
      flash("✗ " + (e.response?.data?.message ?? "Failed to create student."));
    } finally {
      setSaving(false);
    }
  };

  // ── Promote / Tag ───────────────────────────────────────────────────────────

  const handleAction = async () => {
    if (!actionStudent) return;
    setActionSaving(true); setActionMsg("");
    try {
      if (actionStudent.action === "promote") {
        await api.put(`/students/${actionStudent.id}/promote`);
        setActionMsg("✓ Student promoted.");
      } else if (actionStudent.action === "tag-irregular") {
        await api.put(`/students/${actionStudent.id}/tag-irregular`);
        setActionMsg("✓ Tagged as irregular.");
      } else if (actionStudent.action === "tag-regular") {
        if (!tagSection) { setActionMsg("✗ Section required."); setActionSaving(false); return; }
        await api.put(`/students/${actionStudent.id}/tag-regular`, { section: tagSection.toUpperCase() });
        setActionMsg("✓ Tagged as regular.");
      }
      load();
      setTimeout(() => { setActionStudent(null); setTagSection(""); setActionMsg(""); }, 1200);
    } catch (e) {
      setActionMsg("✗ " + (e.response?.data?.message ?? "Action failed."));
    } finally {
      setActionSaving(false);
    }
  };

  // ── Filtered list ───────────────────────────────────────────────────────────

  const displayed = students.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.fullName?.toLowerCase().includes(q) ||
      s.schoolId?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fade-in">

      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Manage Students</h1>
          <p className="page-subtitle">Register regular and irregular students · View and update enrolment status</p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setMsg(""); }}
          style={{
            padding      : "9px 18px",
            borderRadius : 8,
            border       : "none",
            background   : "#1A6A2A",
            color        : "#fff",
            fontWeight   : 700,
            fontSize     : 13,
            cursor       : "pointer",
            display      : "flex",
            alignItems   : "center",
            gap          : 6,
          }}
        >
          {showForm ? "✕ Cancel" : "+ Register Student"}
        </button>
      </div>

      {/* Flash */}
      {msg && (
        <div style={{
          padding      : "10px 16px",
          borderRadius : 8,
          marginBottom : 16,
          fontSize     : 13,
          fontWeight   : 600,
          background   : msg.startsWith("✓") ? "#dcfce7" : "#fee2e2",
          color        : msg.startsWith("✓") ? "#16a34a" : "#dc2626",
          border       : `1px solid ${msg.startsWith("✓") ? "#bbf7d0" : "#fecaca"}`,
        }}>
          {msg}
        </div>
      )}

      {/* Registration Form */}
      {showForm && (
        <div style={{
          background   : "var(--surface-card)",
          borderRadius : 12,
          border       : "1px solid var(--grey-200)",
          padding      : "20px 24px",
          marginBottom : 24,
          boxShadow    : "var(--shadow-sm)",
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "var(--grey-900)" }}>
            New Student Registration
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            <FieldGroup label="FULL NAME *">
              <Input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="Juan dela Cruz" />
            </FieldGroup>
            <FieldGroup label="SCHOOL ID *">
              <Input value={form.schoolId} onChange={e => setForm(p => ({ ...p, schoolId: e.target.value }))} placeholder="S-2024-001" />
            </FieldGroup>
            <FieldGroup label="EMAIL *">
              <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="juan@school.edu" />
            </FieldGroup>
            <FieldGroup label="DEPARTMENT *">
              <Select value={form.departmentId} onChange={e => setForm(p => ({ ...p, departmentId: e.target.value }))}>
                <option value="">Select…</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.code} – {d.name}</option>)}
              </Select>
            </FieldGroup>
            <FieldGroup label="COURSE *">
              <Select value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}>
                <option value="">Select…</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
              </Select>
            </FieldGroup>
            <FieldGroup label="YEAR LEVEL *">
              <Select value={form.yearLevel} onChange={e => setForm(p => ({ ...p, yearLevel: e.target.value }))}>
                {[1, 2, 3, 4].map(y => <option key={y} value={y}>{YEAR_LABELS[y]}</option>)}
              </Select>
            </FieldGroup>
            {!form.isIrregular && (
              <FieldGroup label="SECTION *">
                <Input value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} placeholder="A" style={{ textTransform: "uppercase" }} />
              </FieldGroup>
            )}
          </div>

          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              id="isIrregular"
              checked={form.isIrregular}
              onChange={e => setForm(p => ({ ...p, isIrregular: e.target.checked, section: "" }))}
              style={{ width: 15, height: 15, cursor: "pointer" }}
            />
            <label htmlFor="isIrregular" style={{ fontSize: 13, color: "var(--grey-700)", cursor: "pointer", fontWeight: 600 }}>
              Irregular Student <span style={{ fontWeight: 400, color: "var(--grey-500)" }}>(no fixed section)</span>
            </label>
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={handleCreate}
              disabled={saving}
              style={{
                padding    : "9px 22px",
                borderRadius: 8,
                border     : "none",
                background : saving ? "#93c5fd" : "var(--brand-primary, #1a56db)",
                color      : "#fff",
                fontWeight : 700,
                fontSize   : 13,
                cursor     : saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving…" : "Register Student"}
            </button>
            <span style={{ fontSize: 12, color: "var(--grey-500)" }}>
              Default password will be the School ID.
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        background   : "var(--surface-card)",
        borderRadius : 12,
        border       : "1px solid var(--grey-200)",
        padding      : "14px 18px",
        marginBottom : 20,
        display      : "flex",
        gap          : 12,
        flexWrap     : "wrap",
        alignItems   : "center",
      }}>
        <input
          placeholder="🔍  Search name, ID, email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding      : "7px 12px",
            borderRadius : 7,
            border       : "1.5px solid var(--grey-200)",
            fontSize     : 13,
            minWidth     : 220,
            background   : "var(--surface-page)",
            color        : "var(--grey-900)",
            fontFamily   : "var(--font-body)",
          }}
        />
        <Select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} style={{ width: "auto", minWidth: 140 }}>
          <option value="">All Courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
        </Select>
        <Select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ width: "auto", minWidth: 130 }}>
          <option value="">All Year Levels</option>
          {[1, 2, 3, 4].map(y => <option key={y} value={y}>{YEAR_LABELS[y]}</option>)}
        </Select>
        <Select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: "auto", minWidth: 130 }}>
          <option value="">All Types</option>
          <option value="irregular">Irregular Only</option>
        </Select>
        <button
          onClick={load}
          style={{
            padding      : "7px 14px",
            borderRadius : 7,
            border       : "1.5px solid var(--grey-200)",
            background   : "var(--surface-page)",
            fontSize     : 13,
            cursor       : "pointer",
            color        : "var(--grey-700)",
            fontWeight   : 600,
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{
        background   : "var(--surface-card)",
        borderRadius : 12,
        border       : "1px solid var(--grey-200)",
        overflow     : "hidden",
        boxShadow    : "var(--shadow-sm)",
      }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--grey-400)", fontSize: 14 }}>Loading students…</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--grey-400)", fontSize: 14 }}>No students found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom:"2px solid #E0EAE0", background:"#F4FAF6" }}>
                {["School ID", "Full Name", "Email", "Course", "Year", "Section", "Type", "Actions"].map(h => (
                  <th key={h} style={{
                    padding    : "11px 14px",
                    textAlign  : "left",
                    fontSize   : 11,
                    fontWeight : 700,
                    color      : "#3B6D3B",
                    letterSpacing: "0.05em",
                    whiteSpace : "nowrap",
                  }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((s, i) => {
                const profile = s.studentProfile ?? s.profile ?? null;
                const isIrr   = profile?.irregular ?? profile?.isIrregular ?? false;
                return (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom : "1px solid var(--grey-100)",
                      background   : i % 2 === 0 ? "transparent" : "var(--grey-50, #fafafa)",
                      transition   : "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--grey-100, #f3f4f6)"}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "var(--grey-50, #fafafa)"}
                  >
                    <td style={{ padding: "10px 14px", fontSize: 13, fontFamily: "monospace", color: "var(--grey-700)" }}>{s.schoolId}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "var(--grey-900)" }}>{s.fullName}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--grey-600)" }}>{s.email}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>{profile?.course?.code ?? "—"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>{profile?.yearLevel ? YEAR_LABELS[profile.yearLevel] : "—"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>{profile?.section ?? <span style={{ color: "var(--grey-400)" }}>—</span>}</td>
                    <td style={{ padding: "10px 14px" }}>
                      {isIrr ? badge("Irregular", "#BA7517") : badge("Regular", "#185FA5")}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <ActionBtn label="Promote" color="#534AB7" onClick={() => setActionStudent({ id: s.id, name: s.fullName, action: "promote" })} />
                        {!isIrr && (
                          <ActionBtn label="→ Irregular" color="#BA7517" onClick={() => setActionStudent({ id: s.id, name: s.fullName, action: "tag-irregular" })} />
                        )}
                        {isIrr && (
                          <ActionBtn label="→ Regular" color="#185FA5" onClick={() => { setActionStudent({ id: s.id, name: s.fullName, action: "tag-regular" }); setTagSection(""); }} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "var(--grey-400)", textAlign: "right" }}>
        {displayed.length} student{displayed.length !== 1 ? "s" : ""} shown
      </div>

      {/* Action Modal */}
      {actionStudent && (
        <div style={{
          position       : "fixed",
          inset          : 0,
          background     : "rgba(0,0,0,0.45)",
          zIndex         : 1000,
          display        : "flex",
          alignItems     : "center",
          justifyContent : "center",
        }}
          onClick={e => { if (e.target === e.currentTarget) { setActionStudent(null); setActionMsg(""); } }}
        >
          <div style={{
            background   : "var(--surface-card)",
            borderRadius : 14,
            padding      : "28px 32px",
            minWidth     : 340,
            boxShadow    : "0 20px 60px rgba(0,0,0,0.25)",
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--grey-900)" }}>
              {actionStudent.action === "promote"      && "Promote Student"}
              {actionStudent.action === "tag-irregular" && "Tag as Irregular"}
              {actionStudent.action === "tag-regular"  && "Tag as Regular"}
            </h3>
            <p style={{ fontSize: 13, color: "var(--grey-600)", marginBottom: 16 }}>
              <strong>{actionStudent.name}</strong>
              {actionStudent.action === "promote"       && " will be moved to the next year level."}
              {actionStudent.action === "tag-irregular" && " will be tagged as irregular. Their section will be removed."}
              {actionStudent.action === "tag-regular"   && " will be tagged as regular. Enter their section below."}
            </p>

            {actionStudent.action === "tag-regular" && (
              <div style={{ marginBottom: 14 }}>
                <FieldGroup label="SECTION *">
                  <Input
                    value={tagSection}
                    onChange={e => setTagSection(e.target.value)}
                    placeholder="e.g. A"
                    style={{ textTransform: "uppercase" }}
                  />
                </FieldGroup>
              </div>
            )}

            {actionMsg && (
              <p style={{ fontSize: 12, marginBottom: 12, fontWeight: 600, color: actionMsg.startsWith("✓") ? "#16a34a" : "#dc2626" }}>
                {actionMsg}
              </p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleAction}
                disabled={actionSaving}
                style={{
                  padding      : "8px 20px",
                  borderRadius : 8,
                  border       : "none",
                  background   : saving ? "#AAC8AA" : "#1A6A2A",
                  color        : "#fff",
                  fontWeight   : 700,
                  fontSize     : 13,
                  cursor       : actionSaving ? "not-allowed" : "pointer",
                }}
              >
                {actionSaving ? "Saving…" : "Confirm"}
              </button>
              <button
                onClick={() => { setActionStudent(null); setActionMsg(""); setTagSection(""); }}
                style={{
                  padding      : "8px 16px",
                  borderRadius : 8,
                  border       : "1.5px solid var(--grey-200)",
                  background   : "transparent",
                  fontWeight   : 600,
                  fontSize     : 13,
                  cursor       : "pointer",
                  color        : "var(--grey-700)",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tiny action button ────────────────────────────────────────────────────────

function ActionBtn({ label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
      style={{
        padding:"4px 10px", borderRadius:6,
        border:`1px solid ${color}30`,
        background: color + "12", color,
        fontSize:11, fontWeight:700, cursor:"pointer",
        whiteSpace:"nowrap", transition:"opacity 0.15s",
        fontFamily:"'DM Sans', sans-serif",
      }}
    >{label}</button>
  );
}
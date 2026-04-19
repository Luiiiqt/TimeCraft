import { useState, useEffect } from "react";
import api from "../../services/api";

const EMPTY = {
  name: "", code: "", subjectType: "MAJOR",
  sessionType: "LECTURE", units: 3,
  prerequisite: "", departmentId: "",
};

export default function ManageSubjects() {
  const [subjects,     setSubjects]     = useState([]);
  const [departments,  setDepartments]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [form,         setForm]         = useState(EMPTY);
  const [editId,       setEditId]       = useState(null);
  const [showModal,    setShowModal]    = useState(false);
  const [error,        setError]        = useState("");
  const [search,       setSearch]       = useState("");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        api.get("/subjects"),
        api.get("/departments"),
      ]);
      setSubjects(sRes.data?.data    ?? sRes.data    ?? []);
      setDepartments(dRes.data?.data ?? dRes.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(EMPTY); setEditId(null); setError(""); setShowModal(true);
  }

  function openEdit(s) {
    setForm({
      name: s.name, code: s.code,
      subjectType: s.subjectType, sessionType: s.sessionType,
      units: s.units, prerequisite: s.prerequisite || "",
      departmentId: s.department?.id ?? "",
    });
    setEditId(s.id); setError(""); setShowModal(true);
  }

  async function handleSubmit() {
    setError("");
    if (!form.name || !form.code || !form.departmentId) {
      setError("Name, code and department are required."); return;
    }
    try {
      const payload = { ...form, units: Number(form.units), departmentId: Number(form.departmentId) };
      if (editId) {
        await api.put(`/subjects/${editId}`, payload);
      } else {
        await api.post("/subjects", payload);
      }
      setShowModal(false);
      loadAll();
    } catch (e) {
      setError(e.response?.data?.message ?? "Save failed.");
    }
  }

  async function handleDeactivate(id) {
    if (!window.confirm("Deactivate this subject?")) return;
    await api.put(`/subjects/${id}/deactivate`);
    loadAll();
  }

  async function handleDelete(id) {
    if (!window.confirm("Permanently delete this subject? This cannot be undone.")) return;
    try {
      await api.delete(`/subjects/${id}`);
      loadAll();
    } catch (e) {
      alert(e.response?.data?.message ?? "Delete failed.");
    }
  }

  const filtered = subjects.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Manage Subjects</h1>
          <p className="page-subtitle">Add, edit, and deactivate subjects per course</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Subject</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          className="form-input"
          placeholder="Search by name or code…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 340 }}
        />
      </div>

      {/* Table */}
      {loading ? <p>Loading…</p> : (
        <div style={{ background: "var(--surface-card)", borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1.5px solid var(--grey-200)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "var(--grey-50)", borderBottom: "1.5px solid var(--grey-200)" }}>
                {["Code","Name","Type","Session","Units","Prerequisite","Department","Status","Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "var(--grey-600)", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--grey-100)" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--brand-secondary)" }}>{s.code}</td>
                  <td style={{ padding: "10px 14px" }}>{s.name}</td>
                  <td style={{ padding: "10px 14px" }}><span style={{ fontSize:11, padding:"2px 8px", borderRadius:6, background:"rgba(83,74,183,0.1)", color:"#534AB7", fontWeight:600, border:"1px solid rgba(83,74,183,0.2)" }}>{s.subjectType}</span></td>
                  <td style={{ padding: "10px 14px" }}><span style={{ fontSize:11, padding:"2px 8px", borderRadius:6, background: s.sessionType === "LABORATORY" ? "rgba(52,196,124,0.1)" : "rgba(186,117,23,0.08)", color: s.sessionType === "LABORATORY" ? "#1A6A2A" : "#BA7517", fontWeight:600, border:`1px solid ${s.sessionType === "LABORATORY" ? "rgba(52,196,124,0.2)" : "rgba(186,117,23,0.2)"}` }}>{s.sessionType}</span></td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>{s.units}</td>
                  <td style={{ padding: "10px 14px", color: "var(--grey-500)", fontStyle: s.prerequisite ? "normal" : "italic" }}>{s.prerequisite || "None"}</td>
                  <td style={{ padding: "10px 14px", color: "var(--grey-600)" }}>{s.department?.code}</td>
                  <td style={{ padding: "10px 14px" }}><span style={{ fontSize:11, padding:"2px 8px", borderRadius:6, background: s.active ? "rgba(52,196,124,0.1)" : "rgba(226,75,74,0.08)", color: s.active ? "#1A6A2A" : "#B83030", fontWeight:600, border:`1px solid ${s.active ? "rgba(52,196,124,0.2)" : "rgba(226,75,74,0.2)"}` }}>{s.active ? "Active" : "Inactive"}</span></td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-sm" onClick={() => openEdit(s)}>Edit</button>
                      {s.active && <button className="btn btn-sm btn-warning" onClick={() => handleDeactivate(s.id)}>Deactivate</button>}
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 32, textAlign: "center", color: "var(--grey-400)" }}>No subjects found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background:"#fff", borderRadius:16, padding:32, width:500, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 12px 40px rgba(17,42,23,0.15)", border:"1px solid #D8EAD8" }}>
            <h2 style={{ fontFamily:"'Playfair Display', Georgia, serif", fontSize:20, fontWeight:700, marginBottom:20, color:"#112A17" }}>{editId ? "Edit Subject" : "New Subject"}</h2>
            {error && <div style={{ background: "#FEE2E2", color: "#B91C1C", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

            {[
              { label: "Subject Name *", key: "name", type: "text", placeholder: "e.g. Data Structures and Algorithms" },
              { label: "Subject Code *", key: "code", type: "text", placeholder: "e.g. IT-DSA" },
              { label: "Prerequisite",   key: "prerequisite", type: "text", placeholder: "e.g. IT-PROG1 or leave blank" },
              { label: "Units *",        key: "units", type: "number", placeholder: "3" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>{f.label}</label>
                <input
                  className="form-input"
                  type={f.type}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: "100%" }}
                />
              </div>
            ))}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Subject Type *</label>
                <select className="form-input" value={form.subjectType} onChange={e => setForm(p => ({ ...p, subjectType: e.target.value }))} style={{ width: "100%" }}>
                  <option value="MAJOR">Major</option>
                  <option value="MINOR">Minor</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Session Type *</label>
                <select className="form-input" value={form.sessionType} onChange={e => setForm(p => ({ ...p, sessionType: e.target.value }))} style={{ width: "100%" }}>
                  <option value="LECTURE">Lecture</option>
                  <option value="LABORATORY">Laboratory</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Department *</label>
              <select className="form-input" value={form.departmentId} onChange={e => setForm(p => ({ ...p, departmentId: e.target.value }))} style={{ width: "100%" }}>
                <option value="">Select department…</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editId ? "Save Changes" : "Create Subject"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
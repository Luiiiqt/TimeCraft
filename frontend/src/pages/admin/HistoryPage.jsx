import { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import TimetableGrid from "../../components/schedule/TimetableGrid";

const SEMESTERS = ["FIRST", "SECOND", "SUMMER"];
const YEARS = ["2024-2025", "2025-2026", "2026-2027", "2027-2028"];

const HISTORY_CSS = `
  .hist-shell { box-sizing:border-box; padding:clamp(12px,3vw,1.5rem); font-family:'DM Sans',sans-serif; }
  .hist-shell * { box-sizing:border-box; }
  .hist-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px; gap:12px; flex-wrap:wrap; }
  .hist-tabs { display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap; }
  .hist-filters { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; align-items:flex-end; }
  .hist-filter-group { display:flex; flex-direction:column; gap:3px; }
  .hist-filter-label { font-size:11px; font-weight:600; color:#6b7280; }
  .hist-select { padding:6px 12px; border-radius:7px; border:1.5px solid #d1d5db; font-size:13px; background:#fff; min-width:120px; max-width:100%; }
  .hist-tab-btn { padding:7px 14px; border-radius:8px; font-size:13px; font-weight:600; border:1.5px solid #d1d5db; cursor:pointer; white-space:nowrap; }
  .hist-export-btn { padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; background:#1565C0; color:#fff; border:none; cursor:pointer; white-space:nowrap; flex-shrink:0; }
  .hist-dept-header { font-size:14px; font-weight:700; color:#1B5E20; background:#E8F5E9; padding:6px 12px; border-radius:6px; margin-bottom:12px; }
  .hist-section-title { font-size:13px; font-weight:700; color:#374151; padding:6px 0 8px 4px; }
  .hist-table-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .hist-table { width:100%; border-collapse:collapse; font-size:12px; min-width:480px; }

  @media (max-width:600px) {
    .hist-header { flex-direction:column; }
    .hist-export-btn { width:100%; text-align:center; }
    .hist-filter-group { width:100%; }
    .hist-select { width:100%; }
  }
`;

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key] ?? "Unknown";
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

function CollapsibleGrid({ schedules }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} style={{ marginBottom: 8, padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1.5px solid #d1d5db", background: open ? "#f3f4f6" : "#1565C0", color: open ? "#374151" : "#fff" }}>
        {open ? "⬆ Hide Timetable" : "⬇ View Timetable"}
      </button>
      {open && <TimetableGrid schedules={schedules} />}
    </div>
  );
}

export default function HistoryPage() {
  const [tab, setTab] = useState("schedule");
  const [semester, setSemester] = useState("FIRST");
  const [schoolYear, setSchoolYear] = useState("2026-2027");
  const [schedules, setSchedules] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deptFilter, setDeptFilter] = useState("ALL");
  const printRef = useRef();

  useEffect(() => {
    if (tab !== "schedule") return;
    setLoading(true); setDeptFilter("ALL");
    api.get("/schedules/history-all-sections", { params: { semester, schoolYear } })
      .then(r => setSchedules(r.data?.data ?? []))
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false));
  }, [tab, semester, schoolYear]);

  useEffect(() => {
    if (tab !== "curriculum") return;
    setLoading(true); setDeptFilter("ALL");
    api.get("/curriculum/all-courses-with-curricula")
      .then(r => setCurricula(r.data?.data ?? []))
      .catch(() => setCurricula([]))
      .finally(() => setLoading(false));
  }, [tab]);

  const schedDepts = ["ALL", ...new Set(schedules.map(s => s.department?.name ?? "Unknown"))];
  const currDepts = ["ALL", ...new Set(curricula.map(c => c.department?.name ?? "Unknown"))];

  const dedupedSchedules = Object.values(
    schedules.reduce((acc, s) => {
      const key = `${s.courseCode}-${s.yearLevel}-${s.sectionName}`;
      if (!acc[key] || (s.schedules?.length > 0 && !acc[key].schedules?.length)) acc[key] = s;
      return acc;
    }, {})
  );

  const filteredSchedules = deptFilter === "ALL" ? dedupedSchedules : dedupedSchedules.filter(s => (s.department?.name ?? "Unknown") === deptFilter);
  const filteredCurricula = deptFilter === "ALL" ? curricula : curricula.filter(c => (c.department?.name ?? "Unknown") === deptFilter);

  const handleExportPDF = () => {
    import('html2pdf.js').then(m => {
      const h = m.default || m;
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'font-family:Arial,sans-serif;font-size:11px;color:#111827;padding:20px;background:#fff;';
      wrapper.innerHTML = `<div style="text-align:center;margin-bottom:14px;border-bottom:2px solid #1B5E20;padding-bottom:10px;"><div style="font-size:15px;font-weight:700;color:#1B5E20;">LORMA COLLEGE</div><div style="font-size:12px;font-weight:600;margin-top:2px;">Archive History — ${tab === "schedule" ? "Schedules" : "Curricula"}</div>${tab === "schedule" ? `<div style="font-size:10px;color:#6b7280;margin-top:2px;">${semester} Semester · ${schoolYear}${deptFilter !== "ALL" ? ` · ${deptFilter}` : ""}</div>` : ""}<div style="font-size:9px;color:#9ca3af;margin-top:3px;">Generated by TimeCraft · ${new Date().toLocaleDateString()}</div></div>`;
      const data = tab === "schedule" ? filteredSchedules : filteredCurricula;
      const deptKey = tab === "schedule" ? (s => s.department?.name ?? "Unknown") : (c => c.department?.name ?? "Unknown");
      const grouped = data.reduce((acc, item) => { const k = deptKey(item); if (!acc[k]) acc[k] = []; acc[k].push(item); return acc; }, {});
      const thStyle = 'padding:5px 8px;font-weight:700;background:#f3f4f6;border:1px solid #d1d5db;text-align:left;font-size:10px;';
      const tdStyle = 'padding:5px 8px;border:1px solid #e5e7eb;font-size:10px;vertical-align:top;';
      const deptStyle = 'font-size:12px;font-weight:700;color:#1B5E20;background:#E8F5E9;padding:5px 10px;margin:14px 0 5px;border-left:4px solid #2E7D32;';
      let body = '';
      if (tab === "schedule") {
        Object.entries(grouped).forEach(([dept, sections]) => {
          body += `<div style="${deptStyle}">${dept}</div>`;
          sections.forEach(section => {
            const secLabel = section.sectionName ? `${section.courseCode} · Year ${section.yearLevel}-${section.sectionName}` : `${section.courseCode} — ${section.courseName}`;
            body += `<div style="font-size:10px;font-weight:600;color:#374151;padding:4px 0 3px 2px;margin-top:8px;">${secLabel}</div>`;
            body += `<table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:6px;table-layout:fixed;"><colgroup><col style="width:28%"/><col style="width:18%"/><col style="width:14%"/><col style="width:18%"/><col style="width:16%"/><col style="width:6%"/></colgroup><thead><tr><th style="${thStyle}">Subject</th><th style="${thStyle}">Teacher</th><th style="${thStyle}">Room</th><th style="${thStyle}">Day 1</th><th style="${thStyle}">Day 2</th><th style="${thStyle}">Status</th></tr></thead><tbody>`;
            if (!section.schedules || section.schedules.length === 0) { body += `<tr><td colspan="6" style="${tdStyle}color:#9ca3af;font-style:italic;">No schedules generated</td></tr>`; }
            else { section.schedules.forEach(s => { const statusBg = s.status === 'PUBLISHED' ? '#d1fae5' : '#fef3c7'; const statusColor = s.status === 'PUBLISHED' ? '#065f46' : '#92400e'; body += `<tr><td style="${tdStyle}">${s.subjectCode} — ${s.subjectName}</td><td style="${tdStyle}">${s.teacherName || ''}</td><td style="${tdStyle}">${s.roomName || 'Online'}</td><td style="${tdStyle}">${s.timeslotLabel1 || ''}</td><td style="${tdStyle}">${s.timeslotLabel2 || '—'}</td><td style="${tdStyle}"><span style="padding:1px 5px;border-radius:8px;font-size:9px;font-weight:700;background:${statusBg};color:${statusColor};">${s.status}</span></td></tr>`; }); }
            body += `</tbody></table>`;
          });
        });
      } else {
        Object.entries(grouped).forEach(([dept, courses]) => {
          body += `<div style="${deptStyle}">${dept}</div>`;
          body += `<table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:10px;table-layout:fixed;"><colgroup><col style="width:28%"/><col style="width:24%"/><col style="width:14%"/><col style="width:14%"/><col style="width:20%"/></colgroup><thead><tr><th style="${thStyle}">Course</th><th style="${thStyle}">Curriculum Name</th><th style="${thStyle}">Effective Year</th><th style="${thStyle}">Imported At</th><th style="${thStyle}">Status</th></tr></thead><tbody>`;
          courses.forEach(course => {
            if (!course.curricula || course.curricula.length === 0) { body += `<tr><td style="${tdStyle}">${course.courseCode} — ${course.courseName}</td><td style="${tdStyle}color:#9ca3af;font-style:italic;">—</td><td style="${tdStyle}color:#9ca3af;">—</td><td style="${tdStyle}color:#9ca3af;">—</td><td style="${tdStyle}color:#9ca3af;font-style:italic;">No curriculum imported</td></tr>`; }
            else { course.curricula.forEach(c => { const bg = c.active ? '#d1fae5' : '#f3f4f6'; const color = c.active ? '#065f46' : '#6b7280'; body += `<tr><td style="${tdStyle}">${course.courseCode} — ${course.courseName}</td><td style="${tdStyle}font-weight:600;">${c.name}</td><td style="${tdStyle}">${c.effectiveYear}</td><td style="${tdStyle}">${c.importedAt ? new Date(c.importedAt).toLocaleDateString() : '—'}</td><td style="${tdStyle}"><span style="padding:1px 5px;border-radius:8px;font-size:9px;font-weight:700;background:${bg};color:${color};">${c.active ? 'ACTIVE' : 'INACTIVE'}</span></td></tr>`; }); }
          });
          body += `</tbody></table>`;
        });
      }
      const bodyDiv = document.createElement('div');
      bodyDiv.innerHTML = body;
      wrapper.appendChild(bodyDiv);
      document.body.appendChild(wrapper);
      h().set({ margin: [0.35, 0.35, 0.35, 0.35], filename: `Archive-History-${tab}-${schoolYear}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' }, jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' } }).from(wrapper).save().then(() => { document.body.removeChild(wrapper); });
    });
  };

  const cell = { padding: "8px 12px", wordBreak: "break-word", verticalAlign: "top" };
  const th = { ...cell, fontWeight: 600, color: "#374151", borderBottom: "1.5px solid #e5e7eb", background: "#f3f4f6", textAlign: "left" };

  return (
    <div className="hist-shell">
      <style>{HISTORY_CSS}</style>

      <div className="hist-header">
        <div>
          <h1 style={{ fontSize: "clamp(1.3rem,4vw,1.75rem)", fontWeight: 700, color: "#111827", margin: 0 }}>Archive History</h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>View previously deleted schedules and curricula.</p>
        </div>
        <button className="hist-export-btn" onClick={handleExportPDF}>💾 Export PDF</button>
      </div>

      {/* Tabs */}
      <div className="hist-tabs">
        {["schedule", "curriculum"].map(t => (
          <button key={t} className="hist-tab-btn" onClick={() => setTab(t)} style={{ background: tab === t ? "#92400e" : "#fff", color: tab === t ? "#fff" : "#374151" }}>
            {t === "schedule" ? "🗓 Schedules" : "📄 Curricula"}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="hist-filters">
        {tab === "schedule" && (
          <>
            <div className="hist-filter-group">
              <label className="hist-filter-label">SEMESTER</label>
              <select className="hist-select" value={semester} onChange={e => setSemester(e.target.value)}>
                {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="hist-filter-group">
              <label className="hist-filter-label">SCHOOL YEAR</label>
              <select className="hist-select" value={schoolYear} onChange={e => setSchoolYear(e.target.value)}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </>
        )}
        <div className="hist-filter-group">
          <label className="hist-filter-label">DEPARTMENT</label>
          <select className="hist-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            {(tab === "schedule" ? schedDepts : currDepts).map(d => <option key={d} value={d}>{d === "ALL" ? "All Departments" : d}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      <div ref={printRef}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: "clamp(15px,3vw,18px)", fontWeight: 700, color: "#111827" }}>Archive History — {tab === "schedule" ? "Schedules" : "Curricula"}</div>
          {tab === "schedule" && <div style={{ fontSize: 12, color: "#6b7280" }}>{semester} Semester · {schoolYear}{deptFilter !== "ALL" ? ` · ${deptFilter}` : ""}</div>}
        </div>

        {loading ? (
          <p style={{ color: "#6b7280", fontSize: 13 }}>Loading…</p>
        ) : tab === "schedule" ? (
          filteredSchedules.length === 0
            ? <p style={{ color: "#6b7280", fontSize: 13 }}>No sections found.</p>
            : Object.entries(
              filteredSchedules.reduce((acc, s) => { const k = s.department?.name ?? "Unknown"; if (!acc[k]) acc[k] = []; acc[k].push(s); return acc; }, {})
            ).map(([dept, sections]) => {
              const seen = {}; const deduped = [];
              sections.forEach(sec => {
                const key = `${sec.courseCode}-${sec.yearLevel}-${sec.sectionName}`;
                if (!seen[key]) { seen[key] = sec; deduped.push(sec); }
                else if (sec.schedules?.length > 0 && !seen[key].schedules?.length) { const idx = deduped.indexOf(seen[key]); deduped[idx] = sec; seen[key] = sec; }
              });
              return (
                <div key={dept} style={{ marginBottom: 36 }}>
                  <div className="hist-dept-header">{dept}</div>
                  {deduped.map(section => {
                    const gridSchedules = section.schedules ?? [];
                    return (
                      <div key={section.sectionId} style={{ marginBottom: 32 }}>
                        <div className="hist-section-title">{section.sectionName ? `${section.courseCode} · Year ${section.yearLevel}-${section.sectionName}` : `${section.courseCode} — ${section.courseName}`}</div>
                        {gridSchedules.length === 0 ? <p style={{ color: "#9ca3af", fontSize: 12, fontStyle: "italic", paddingLeft: 4 }}>No schedules generated</p> : <CollapsibleGrid schedules={gridSchedules} />}
                      </div>
                    );
                  })}
                </div>
              );
            })
        ) : (
          filteredCurricula.length === 0
            ? <p style={{ color: "#6b7280", fontSize: 13 }}>No courses found.</p>
            : Object.entries(
              filteredCurricula.reduce((acc, c) => { const k = c.department?.name ?? "Unknown"; if (!acc[k]) acc[k] = []; acc[k].push(c); return acc; }, {})
            ).map(([dept, rows]) => (
              <div key={dept} style={{ marginBottom: 28 }}>
                <div className="hist-dept-header">{dept}</div>
                <div className="hist-table-wrap">
                  <table className="hist-table" style={{ tableLayout: "fixed" }}>
                    <colgroup>
                      <col style={{ width: "28%" }} /><col style={{ width: "24%" }} />
                      <col style={{ width: "14%" }} /><col style={{ width: "14%" }} />
                      <col style={{ width: "20%" }} />
                    </colgroup>
                    <thead>
                      <tr>{["Course", "Curriculum Name", "Effective Year", "Imported At", "Status"].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {rows.map(course =>
                        course.curricula.length === 0 ? (
                          <tr key={course.courseId} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={cell}>{course.courseCode} — {course.courseName}</td>
                            <td style={{ ...cell, color: "#9ca3af", fontStyle: "italic" }}>—</td>
                            <td style={{ ...cell, color: "#9ca3af", fontStyle: "italic" }}>—</td>
                            <td style={{ ...cell, color: "#9ca3af", fontStyle: "italic" }}>—</td>
                            <td style={{ ...cell, color: "#9ca3af", fontStyle: "italic" }}>No curriculum imported</td>
                          </tr>
                        ) : course.curricula.map((c, i) => (
                          <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={cell}>{course.courseCode} — {course.courseName}</td>
                            <td style={{ ...cell, fontWeight: 600 }}>{c.name}</td>
                            <td style={cell}>{c.effectiveYear}</td>
                            <td style={cell}>{c.importedAt ? new Date(c.importedAt).toLocaleDateString() : "—"}</td>
                            <td style={cell}>
                              <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: c.active ? "#d1fae5" : "#f3f4f6", color: c.active ? "#065f46" : "#6b7280" }}>
                                {c.active ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
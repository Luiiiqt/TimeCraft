import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

const YEARS = [1, 2, 3, 4];
const SEMESTERS = ["FIRST", "SECOND", "SUMMER"];
const SEM_LABEL = { FIRST: "1st Sem", SECOND: "2nd Sem", SUMMER: "Summer" };

const TYPE_COLOR = {
  MAJOR: { bg: "rgba(59,130,246,0.15)", text: "#93C5FD", border: "rgba(59,130,246,0.3)" },
  MINOR: { bg: "rgba(255,255,255,0.07)", text: "rgba(255,255,255,0.5)", border: "rgba(255,255,255,0.12)" },
};
const SES_COLOR = {
  LECTURE:     { bg: "rgba(34,197,94,0.12)",  text: "#86EFAC", border: "rgba(34,197,94,0.3)" },
  LABORATORY:  { bg: "rgba(245,158,11,0.12)", text: "#FCD34D", border: "rgba(245,158,11,0.3)" },
  LECTURE_LAB: { bg: "rgba(139,92,246,0.12)", text: "#C4B5FD", border: "rgba(139,92,246,0.3)" },
};

function Pill({ text, colors }) {
  return (
    <span style={{
      fontSize: 10, padding: "3px 9px", borderRadius: 6, fontWeight: 700,
      background: colors.bg, color: colors.text,
      border: `1px solid ${colors.border}`,
      letterSpacing: "0.04em",
      fontFamily: "'DM Mono', monospace",
      whiteSpace: "nowrap",
    }}>{text}</span>
  );
}

export default function ManageSubjects() {
  const { user } = useAuth();

  const [curriculum, setCurriculum] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState(null);
  const [activeYear, setActiveYear] = useState(1);
  const [activeSem, setActiveSem] = useState("FIRST");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [term] = useState(() => {
    const now = new Date(); const m = now.getMonth() + 1; const y = now.getFullYear();
    return { semester: m >= 6 && m <= 10 ? "FIRST" : "SECOND", schoolYear: `${y}-${y + 1}` };
  });

  useEffect(() => {
    if (!user) return;
    api.get("/program-head/my-courses")
      .then(r => {
        const list = r.data?.data ?? [];
        setCourses(list);
        if (list.length > 0) setCourseId(list[0].id);
      }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    Promise.all([
      api.get(`/subjects/course/${courseId}/curriculum`),
      api.get(`/dean/assignments?semester=FIRST&schoolYear=${term.schoolYear}`),
      api.get(`/dean/assignments?semester=SECOND&schoolYear=${term.schoolYear}`),
      api.get(`/dean/assignments?semester=SUMMER&schoolYear=${term.schoolYear}`),
    ])
      .then(([cRes, aRes1, aRes2, aRes3]) => {
        setCurriculum(cRes.data?.data ?? []);
        setAssignments([
          ...(aRes1.data?.data ?? []),
          ...(aRes2.data?.data ?? []),
          ...(aRes3.data?.data ?? []),
        ]);
      })
      .catch(() => { setCurriculum([]); setAssignments([]); })
      .finally(() => setLoading(false));
  }, [courseId, term]);

  const visible = curriculum.filter(cs =>
    Number(cs.yearLevel) === Number(activeYear) &&
    String(cs.semester) === String(activeSem) &&
    (search === "" ||
      cs.subject?.name?.toLowerCase().includes(search.toLowerCase()) ||
      cs.subject?.code?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060D1A",
      color: "#fff",
      fontFamily: "'DM Sans', sans-serif",
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        select { color-scheme: dark; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        tr.subject-row:hover { background: rgba(255,255,255,0.025) !important; }
      `}</style>

      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-5%", right: "20%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at 70% 10%, black 15%, transparent 65%)",
          WebkitMaskImage: "radial-gradient(ellipse at 70% 10%, black 15%, transparent 65%)",
        }} />
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 40px 60px", position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)",
            borderRadius: 100, padding: "4px 14px", marginBottom: 14,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6", display: "inline-block" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#93C5FD", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
              Curriculum · Read-only view
            </span>
          </div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 6 }}>
            Curriculum Subjects
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.6 }}>
            View all subjects in your course curriculum. Go to <span style={{ color: "#93C5FD" }}>Assign Teachers</span> to manage assignments.
          </p>
        </div>

        {/* ── Course selector ── */}
        {courses.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginRight: 10 }}>Course</label>
            <select
              value={courseId ?? ""}
              onChange={e => setCourseId(Number(e.target.value))}
              style={{
                padding: "8px 12px", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 9,
                background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13,
                fontFamily: "'DM Sans', sans-serif", outline: "none", cursor: "pointer",
              }}
            >
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
        )}

        {courses.length === 1 && (
          <div style={{ marginBottom: 20 }}>
            <span style={{
              fontSize: 13, fontWeight: 600, color: "#93C5FD",
              background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)",
              padding: "7px 14px", borderRadius: 8, fontFamily: "'DM Mono', monospace",
            }}>
              {courses[0].code} — {courses[0].name}
            </span>
          </div>
        )}

        {/* ── Filters row ── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
          {/* Year tabs */}
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 4 }}>
            {YEARS.map(y => (
              <button key={y} onClick={() => setActiveYear(y)} style={{
                padding: "5px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer",
                border: "none",
                background: activeYear === y ? "rgba(59,130,246,0.85)" : "transparent",
                color: activeYear === y ? "#fff" : "rgba(255,255,255,0.4)",
                transition: "all 0.2s ease",
                fontFamily: "'DM Sans', sans-serif",
              }}>Year {y}</button>
            ))}
          </div>

          {/* Semester tabs */}
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 4 }}>
            {SEMESTERS.map(s => (
              <button key={s} onClick={() => setActiveSem(s)} style={{
                padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer",
                border: "none",
                background: activeSem === s ? "rgba(34,197,94,0.8)" : "transparent",
                color: activeSem === s ? "#fff" : "rgba(255,255,255,0.4)",
                transition: "all 0.2s ease",
                fontFamily: "'DM Sans', sans-serif",
              }}>{SEM_LABEL[s]}</button>
            ))}
          </div>

          {/* Search */}
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "rgba(255,255,255,0.2)" }}>🔍</span>
            <input
              placeholder="Search subjects…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "8px 12px 8px 34px",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9,
                background: "rgba(255,255,255,0.04)", color: "#fff",
                fontSize: 13, outline: "none",
                fontFamily: "'DM Sans', sans-serif",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>
        </div>

        {/* ── Info banner ── */}
        <div style={{
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 10, padding: "10px 16px", marginBottom: 20,
          fontSize: 13, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>📋</span>
          This is a read-only curriculum view. To assign teachers, use the <strong style={{ color: "#FCD34D" }}>Assign Teachers</strong> section.
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
            Loading curriculum…
          </div>
        ) : (
          <div style={{
            background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16, overflow: "hidden",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {["Code", "Name", "Type", "Session", "Units", "Prerequisite", "Assigned Teacher"].map(h => (
                    <th key={h} style={{
                      padding: "12px 16px", textAlign: "left",
                      fontWeight: 700, color: "rgba(255,255,255,0.35)",
                      fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
                      fontFamily: "'DM Mono', monospace",
                      background: "rgba(255,255,255,0.02)",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "48px 0", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 14 }}>
                      {curriculum.length === 0
                        ? "The Dean has not imported the curriculum yet."
                        : `No subjects for Year ${activeYear} — ${SEM_LABEL[activeSem]}.`}
                    </td>
                  </tr>
                ) : visible.map((cs, i) => {
                  const a = assignments.find(a => a.subject?.id === cs.subject?.id);
                  return (
                    <tr key={cs.id} className="subject-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.15s" }}>
                      <td style={{ padding: "12px 16px", color: "#93C5FD", fontWeight: 700, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                        {cs.subject?.code}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 500, color: "#F1F5F9" }}>
                        {cs.subject?.name}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <Pill text={cs.subject?.subjectType} colors={TYPE_COLOR[cs.subject?.subjectType] ?? TYPE_COLOR.MINOR} />
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {cs.subject?.hasLab
                          ? <Pill text="Lec + Lab" colors={SES_COLOR.LECTURE_LAB} />
                          : <Pill text={cs.subject?.sessionType} colors={SES_COLOR[cs.subject?.sessionType] ?? SES_COLOR.LECTURE} />}
                      </td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                        {cs.subject?.units}
                      </td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                        {cs.subject?.prerequisite?.code ?? "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {a ? (
                          <span style={{
                            fontSize: 12, borderRadius: 6, padding: "3px 10px", fontWeight: 700,
                            background: a.finalized ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
                            color: a.finalized ? "#86EFAC" : "#FCD34D",
                            border: `1px solid ${a.finalized ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
                            fontFamily: "'DM Mono', monospace",
                          }}>
                            {a.finalized ? "✓ " : "⏳ "}{a.teacher?.fullName}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono', monospace" }}>Not assigned</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, padding: "0 2px" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono', monospace" }}>
            {visible.length} subject{visible.length !== 1 ? "s" : ""} · Year {activeYear} — {SEM_LABEL[activeSem]}
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono', monospace" }}>
            {curriculum.length} total in curriculum
          </p>
        </div>

      </div>
    </div>
  );
}
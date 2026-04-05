const CSS = `
  @keyframes tc-fadein { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
  .tc-resolve-btn:hover { background: rgba(52,196,124,0.2) !important; }
`;

const TYPE_CFG = {
  TEACHER_DOUBLE_BOOKED: { color:"#E8792A", bg:"rgba(232,121,42,0.07)", border:"rgba(232,121,42,0.25)", icon:"⚠", label:"Teacher double-booked" },
  ROOM_DOUBLE_BOOKED:    { color:"#E24B4A", bg:"rgba(226,75,74,0.07)",  border:"rgba(226,75,74,0.25)",  icon:"⬕", label:"Room double-booked"    },
  STUDENT_TIME_CONFLICT: { color:"#BA7517", bg:"rgba(186,117,23,0.07)", border:"rgba(186,117,23,0.25)", icon:"◉", label:"Student time conflict"   },
  TEACHER_UNAVAILABLE:   { color:"#C47A10", bg:"rgba(196,122,16,0.07)", border:"rgba(196,122,16,0.25)", icon:"◈", label:"Teacher unavailable"     },
  WRONG_ROOM_TYPE:       { color:"#534AB7", bg:"rgba(83,74,183,0.07)",  border:"rgba(83,74,183,0.25)",  icon:"▣", label:"Wrong room type"         },
  WRONG_CAMPUS:          { color:"#185FA5", bg:"rgba(24,95,165,0.07)",  border:"rgba(24,95,165,0.25)",  icon:"⬡", label:"Wrong campus"            },
  WRONG_DEPARTMENT:      { color:"#5F5E5A", bg:"rgba(95,94,90,0.07)",   border:"rgba(95,94,90,0.2)",    icon:"◧", label:"Wrong department"        },
};

export default function ConflictAlert({ conflict, onResolve }) {
  const { conflictType, description, subjectCode, subjectName, teacherName, sectionLabel, detectedAt, resolved } = conflict;
  const cfg = TYPE_CFG[conflictType] ?? { color:"#888", bg:"rgba(136,135,128,0.07)", border:"rgba(136,135,128,0.2)", icon:"!", label: conflictType };
  const date = detectedAt ? new Date(detectedAt).toLocaleString("en-PH", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }) : null;

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderLeft: `3px solid ${cfg.color}`,
        borderRadius:"10px",
        padding:"14px 16px",
        display:"flex", flexDirection:"column", gap:"8px",
        opacity: resolved ? 0.55 : 1,
        animation:"tc-fadein 0.2s ease",
        fontFamily:"'DM Sans', sans-serif",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
            <span style={{ fontSize:"14px", color: cfg.color }}>{cfg.icon}</span>
            <span style={{ fontSize:"12px", fontWeight:"700", color: cfg.color, textTransform:"uppercase", letterSpacing:"0.5px" }}>{cfg.label}</span>
            {resolved && (
              <span style={{ fontSize:"10px", fontWeight:"700", color:"#1A6A2A", background:"rgba(52,196,124,0.12)", padding:"2px 7px", borderRadius:"5px", textTransform:"uppercase", letterSpacing:"0.4px" }}>Resolved</span>
            )}
          </div>
          {!resolved && onResolve && (
            <button
              className="tc-resolve-btn"
              onClick={() => onResolve(conflict)}
              style={{ fontSize:"12px", fontWeight:"600", color:"#1A6A2A", background:"rgba(52,196,124,0.1)", border:"1px solid rgba(52,196,124,0.25)", borderRadius:"7px", padding:"5px 13px", cursor:"pointer", flexShrink:0, transition:"background 0.15s" }}
            >Resolve</button>
          )}
        </div>

        <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
          {subjectCode && (
            <span style={{ fontSize:"11px", color:"#334A33", background:"rgba(52,196,124,0.08)", border:"1px solid rgba(52,196,124,0.15)", borderRadius:"5px", padding:"2px 8px" }}>
              <span style={{ color: cfg.color, fontWeight:"700" }}>{subjectCode}</span>
              {subjectName && ` · ${subjectName}`}
            </span>
          )}
          {teacherName && <span style={{ fontSize:"11px", color:"#5A7A5A", background:"#F4FAF6", border:"1px solid #D8EAD8", borderRadius:"5px", padding:"2px 8px" }}>◈ {teacherName}</span>}
          {sectionLabel && <span style={{ fontSize:"11px", color:"#5A7A5A", background:"#F4FAF6", border:"1px solid #D8EAD8", borderRadius:"5px", padding:"2px 8px" }}>▦ {sectionLabel}</span>}
        </div>

        {description && <p style={{ fontSize:"12px", color:"#3B6D3B", margin:0, lineHeight:1.5 }}>{description}</p>}
        {date && <p style={{ fontSize:"10px", color:"#7AAE7A", margin:0, letterSpacing:"0.2px" }}>Detected {date}</p>}
      </div>
    </>
  );
}
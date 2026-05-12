const CSS = `
  .tc-slot:hover { filter: brightness(1.06); transform: translateY(-1px); }
  .tc-slot:active { transform: scale(0.98); }
`;

export default function ScheduleSlot({ schedule, onClick }) {
  const { subjectCode, subjectName, teacherName, roomName, sessionType, subjectType, status, campusCode, isOnline } = schedule;
  const isLab      = sessionType === "LABORATORY";
  const isConflict = status === "CONFLICTED";
  const isDraft    = status === "DRAFT";
  const isMajor    = subjectType === "MAJOR";

  const accent = isConflict ? "#E24B4A" : isLab ? "#185FA5" : isMajor ? "#BA7517" : "#1A6A2A";
  const bg     = isConflict ? "rgba(226,75,74,0.08)" : isLab ? "rgba(24,95,165,0.08)" : isMajor ? "rgba(186,117,23,0.08)" : "rgba(26,106,42,0.07)";

  return (
    <>
      <style>{CSS}</style>
      <button
        className="tc-slot"
        onClick={onClick}
        title={`${subjectName} — ${teacherName} — ${roomName}`}
        style={{
          display:"flex", flexDirection:"column", alignItems:"flex-start", gap:"3px",
          width:"100%", height:"100%", minHeight:"72px",
          padding:"7px 9px", border:"none", borderRadius:"7px",
          borderLeft:`3px solid ${accent}`,
          background: bg,
          opacity: isDraft ? 0.7 : 1,
          cursor:"pointer", textAlign:"left",
          transition:"filter 0.15s, transform 0.12s",
          overflow:"hidden", fontFamily:"'DM Sans', sans-serif",
        }}
      >
        <span style={{ fontSize:"10.5px", fontWeight:"700", color: accent, letterSpacing:"0.3px", textTransform:"uppercase", lineHeight:1 }}>{subjectCode}</span>
        <span style={{ fontSize:"11px", fontWeight:"500", color:"#112A17", lineHeight:1.3, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{subjectName}</span>
        {teacherName && (
          <span style={{ fontSize:"10px", color:"#7AAE7A", display:"flex", alignItems:"center", gap:"4px" }}>
            <span style={{ color:"#AAC8AA" }}>·</span>{teacherName.split(" ").pop()}
          </span>
        )}
        {isOnline ? (
          <span style={{ fontSize:"10px", color:"#6330B4", display:"flex", alignItems:"center", gap:"4px" }}>
            <span style={{ color:"#AAC8AA" }}>◫</span>Online Class
          </span>
        ) : roomName && (
          <span style={{ fontSize:"10px", color:"#7AAE7A", display:"flex", alignItems:"center", gap:"4px" }}>
            <span style={{ color:"#AAC8AA" }}>◫</span>{roomName}
            {campusCode && <span style={{ fontWeight:"700", fontSize:"9px", color:"#AAC8AA", textTransform:"uppercase", marginLeft:"2px" }}>{campusCode}</span>}
          </span>
        )}
        <div style={{ display:"flex", flexWrap:"wrap", gap:"3px", marginTop:"2px" }}>
          {isConflict && <span style={{ fontSize:"9px", fontWeight:"600", padding:"1px 5px", borderRadius:"4px", background:"rgba(226,75,74,0.15)", color:"#E24B4A", textTransform:"uppercase", letterSpacing:"0.3px" }}>⚠ conflict</span>}
          {isDraft    && <span style={{ fontSize:"9px", fontWeight:"600", padding:"1px 5px", borderRadius:"4px", background:"rgba(136,135,128,0.1)", color:"#888780", textTransform:"uppercase", letterSpacing:"0.3px" }}>draft</span>}
          {isLab      && <span style={{ fontSize:"9px", fontWeight:"600", padding:"1px 5px", borderRadius:"4px", background:"rgba(24,95,165,0.12)", color:"#185FA5", textTransform:"uppercase", letterSpacing:"0.3px" }}>lab</span>}
          {isOnline   && <span style={{ fontSize:"9px", fontWeight:"600", padding:"1px 5px", borderRadius:"4px", background:"rgba(99,60,180,0.12)", color:"#6330B4", textTransform:"uppercase", letterSpacing:"0.3px" }}>🌐 online</span>}
        </div>
      </button>
    </>
  );
}
import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { useWebSocketContext } from "../../context/WebSocketContext";

const PAGE_META = {
  "/admin":                { title: "Dashboard",         section: "Overview"   },
  "/admin/generate":       { title: "Generate Schedule", section: "Schedule"   },
  "/admin/reports":        { title: "Reports",           section: "Schedule"   },
  "/admin/departments":    { title: "Departments",       section: "Management" },
  "/admin/rooms":          { title: "Rooms",             section: "Management" },
  "/admin/accounts":       { title: "Accounts",          section: "Management" },
  "/teacher":              { title: "Dashboard",         section: "Overview"   },
  "/teacher/schedule":     { title: "My Schedule",       section: "Schedule"   },
  "/teacher/availability": { title: "Set Availability",  section: "Schedule"   },
  "/teacher/preferences":  { title: "Preferences",       section: "Schedule"   },
  "/student":              { title: "Dashboard",         section: "Overview"   },
  "/student/timetable":    { title: "My Timetable",      section: "Timetable"  },
  "/student/enrollment":   { title: "Enrollment",        section: "Timetable"  },
  "/dean":                 { title: "Dashboard",         section: "Overview"   },
  "/dean/subjects":        { title: "Subjects",          section: "Assignments"},
  "/dean/assignments":     { title: "Assignments",       section: "Assignments"},
  "/dean/preferences":     { title: "Preferences",       section: "Assignments"},
  "/dean/generate":        { title: "Generate",          section: "Schedule"   },
  "/dean/schedule":        { title: "Schedule",          section: "Schedule"   },
};

const NAV_LINKS = {
  ADMIN: [
    { path: "/admin",             label: "Dashboard",   icon: "⬡" },
    { path: "/admin/reports",     label: "Reports",     icon: "📊" },
    { path: "/admin/departments", label: "Departments", icon: "🏫" },
    { path: "/admin/rooms",       label: "Rooms",       icon: "🚪" },
    { path: "/admin/accounts",    label: "Accounts",    icon: "👥" },
    { path: "/admin/history",     label: "History",     icon: "🗂️" },
  ],
  TEACHER: [
    { path: "/teacher",              label: "Dashboard",   icon: "⬡" },
    { path: "/teacher/schedule",     label: "Schedule",    icon: "📋" },
    { path: "/teacher/availability", label: "Availability",icon: "📅" },
    { path: "/teacher/preferences",  label: "Preferences", icon: "⚙️" },
  ],
  STUDENT: [
    { path: "/student",            label: "Dashboard", icon: "⬡" },
    { path: "/student/timetable",  label: "Timetable", icon: "🗓️" },
    { path: "/student/enrollment", label: "Enrollment",icon: "📝" },
  ],
  DEAN: [
    { path: "/dean",            label: "Dashboard", icon: "⬡" },
    { path: "/dean/curriculum", label: "Curriculum",icon: "📚" },
    { path: "/dean/subjects",   label: "Subjects",  icon: "📖" },
    { path: "/dean/generate",   label: "Generate",  icon: "⚡" },
    { path: "/dean/schedule",   label: "Schedule",  icon: "📋" },
    { path: "/dean/irregular",  label: "Irregular", icon: "🔀" },
  ],
  PROGRAM_HEAD: [
    { path: "/ph",             label: "Dashboard", icon: "⬡" },
    { path: "/ph/subjects",    label: "Subjects",  icon: "📖" },
    { path: "/ph/preferences", label: "Assign",    icon: "✏️" },
  ],
  GE_COORDINATOR: [
    { path: "/ge",             label: "Dashboard", icon: "⬡" },
    { path: "/ge/preferences", label: "Assign",    icon: "✏️" },
    { path: "/ge/schedule",    label: "Schedule",  icon: "📋" },
  ],
};

const ROLE_COLOR = {
  ADMIN:          "#22C55E",
  TEACHER:        "#3B82F6",
  STUDENT:        "#8B5CF6",
  DEAN:           "#F59E0B",
  PROGRAM_HEAD:   "#EC4899",
  GE_COORDINATOR: "#06B6D4",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');

  @keyframes tc-nav-in        { from{opacity:0;transform:translateY(-10px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);} }
  @keyframes tc-notif-pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.4);}50%{box-shadow:0 0 0 6px rgba(245,158,11,0);} }
  @keyframes tc-blink         { 0%,100%{opacity:1;}50%{opacity:0;} }

  .tc-nav-link {
    position:relative; display:flex; align-items:center; gap:5px;
    padding:6px 13px; border-radius:8px; border:none;
    background:transparent; color:rgba(255,255,255,0.38);
    font-size:12.5px; font-weight:600; cursor:pointer;
    font-family:'DM Sans',sans-serif;
    transition:color 0.15s, background 0.15s;
    white-space:nowrap;
  }
  .tc-nav-link:hover { color:rgba(255,255,255,0.75); background:rgba(255,255,255,0.05); }
  .tc-nav-link.active { color:#fff; background:rgba(34,197,94,0.15); }
  .tc-nav-link.active::after {
    content:''; position:absolute; bottom:-1px; left:50%; transform:translateX(-50%);
    width:20px; height:2px; border-radius:2px; background:#22C55E;
  }

  .tc-nav-icon { font-size:11px; opacity:0.7; }
  .tc-nav-link.active .tc-nav-icon { opacity:1; }

  .tc-user-btn {
    display:flex; align-items:center; gap:8px; cursor:pointer;
    padding:4px 10px 4px 4px; border-radius:30px;
    border:1px solid rgba(255,255,255,0.1);
    background:rgba(255,255,255,0.04);
    transition:border-color 0.2s, background 0.2s;
  }
  .tc-user-btn:hover { border-color:rgba(34,197,94,0.4); background:rgba(34,197,94,0.06); }

  .tc-dropdown {
    position:absolute; top:calc(100% + 10px); right:0;
    width:230px;
    background:rgba(10,18,32,0.98);
    backdrop-filter:blur(24px);
    border:1px solid rgba(255,255,255,0.1);
    border-radius:14px;
    box-shadow:0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset;
    overflow:hidden;
    animation:tc-nav-in 0.18s ease both;
    z-index:200;
  }

  .tc-dropdown-item {
    width:100%; padding:10px 16px; border:none; background:transparent;
    text-align:left; font-size:12.5px; color:rgba(255,255,255,0.6);
    cursor:pointer; display:flex; align-items:center; gap:9px;
    font-family:'DM Sans',sans-serif; transition:background 0.15s,color 0.15s;
  }
  .tc-dropdown-item:hover { background:rgba(255,255,255,0.05); color:#fff; }
  .tc-dropdown-item.danger { color:rgba(248,113,113,0.8); }
  .tc-dropdown-item.danger:hover { background:rgba(239,68,68,0.09); color:#fca5a5; }

  .tc-notif-btn {
    display:flex; align-items:center; gap:6px;
    padding:5px 12px; border-radius:8px;
    background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.25);
    color:#fde68a; font-size:11px; font-weight:700; cursor:pointer;
    font-family:'DM Sans',sans-serif; transition:all 0.2s;
  }
  .tc-notif-btn:hover { background:rgba(245,158,11,0.18); }

  .tc-conflict-btn {
    position:relative; width:32px; height:32px; border-radius:9px;
    background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.25);
    display:flex; align-items:center; justify-content:center;
    font-size:14px; cursor:pointer; animation:tc-notif-pulse 2.5s ease infinite;
    transition:background 0.2s;
  }
  .tc-conflict-btn:hover { background:rgba(245,158,11,0.2); }
`;

export default function Navbar({ conflictCount = 0 }) {
  const { user, role, logout } = useAuth();
  const { notifications, clearNotifications } = useWebSocketContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const close = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    if (dropdownOpen) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [dropdownOpen]);

  const handleLogout = () => { setDropdownOpen(false); logout(); navigate("/login"); };
  const initials = (user?.fullName || "U").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const links = NAV_LINKS[role] ?? [];
  const accentColor = ROLE_COLOR[role] ?? "#22C55E";

  // Current page meta
  const currentMeta = PAGE_META[location.pathname] ?? { title: "TimeCraft", section: "" };

  return (
    <header style={{
      background: scrolled
        ? "rgba(6,13,26,0.94)"
        : "rgba(6,13,26,0.85)",
      backdropFilter: "blur(24px)",
      height: "60px",
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      gap: 0,
      fontFamily: "'DM Sans', sans-serif",
      position: "sticky",
      top: 0,
      zIndex: 100,
      borderBottom: scrolled
        ? "1px solid rgba(255,255,255,0.08)"
        : "1px solid rgba(255,255,255,0.05)",
      transition: "background 0.3s, border-color 0.3s",
    }}>

      {/* ── Brand ──────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginRight:24, flexShrink:0 }}>
        <div style={{
          width:32, height:32, borderRadius:9,
          background:"linear-gradient(135deg,#22C55E,#16A34A)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:16, fontWeight:900, color:"#fff",
          boxShadow:"0 4px 14px rgba(34,197,94,0.35)",
        }}>⬡</div>
        <div>
          <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:14.5, letterSpacing:"-0.02em", color:"#fff", lineHeight:1.1 }}>TimeCraft</div>
          <div style={{ fontSize:8.5, color:"rgba(255,255,255,0.3)", letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"'DM Mono',monospace" }}>Lorma College</div>
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────────── */}
      <div style={{ width:1, height:24, background:"rgba(255,255,255,0.08)", marginRight:20, flexShrink:0 }} />

      {/* ── Center nav ─────────────────────────────────────────── */}
      <nav style={{ display:"flex", alignItems:"center", gap:2, flex:1, justifyContent:"center" }}>
        {links.map(({ path, label, icon }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              className={`tc-nav-link${isActive ? " active" : ""}`}
              onClick={() => navigate(path)}
              style={isActive ? { color:"#fff", background:`${accentColor}18` } : {}}
            >
              <span className="tc-nav-icon">{icon}</span>
              {label}
              {/* Active indicator dot override for non-green roles */}
              {isActive && accentColor !== "#22C55E" && (
                <span style={{
                  position:"absolute", bottom:-1, left:"50%", transform:"translateX(-50%)",
                  width:20, height:2, borderRadius:2, background:accentColor,
                  display:"block",
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Right side ─────────────────────────────────────────── */}
      <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>

        {/* Notifications */}
        {notifications.length > 0 && (
          <button className="tc-notif-btn" onClick={clearNotifications} title={notifications[0]?.message}>
            🔔 {notifications.length} new
          </button>
        )}

        {/* Conflict badge */}
        {role === "ADMIN" && conflictCount > 0 && (
          <button
            className="tc-conflict-btn"
            onClick={() => navigate("/admin/reports")}
            title={`${conflictCount} unresolved conflict${conflictCount !== 1 ? "s" : ""}`}
          >
            ⚠️
            <span style={{
              position:"absolute", top:6, right:6,
              width:7, height:7, borderRadius:"50%",
              background:"#f59e0b", border:"1.5px solid rgba(6,13,26,0.9)",
              animation:"tc-blink 2s ease infinite",
            }} />
          </button>
        )}

        {/* Role badge */}
        <div style={{
          padding:"3px 10px", borderRadius:20,
          background:`${accentColor}15`,
          border:`1px solid ${accentColor}30`,
          fontSize:10, fontWeight:700,
          color:accentColor,
          fontFamily:"'DM Mono',monospace",
          letterSpacing:"0.08em",
          textTransform:"uppercase",
          flexShrink:0,
        }}>
          {role?.replace("_", " ")}
        </div>

        {/* User pill + dropdown */}
        <div style={{ position:"relative" }} ref={dropdownRef}>
          <div className="tc-user-btn" onClick={() => setDropdownOpen(v => !v)}>
            {/* Avatar */}
            <div style={{
              width:28, height:28, borderRadius:"50%",
              background:`${accentColor}22`,
              border:`1.5px solid ${accentColor}55`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:10, fontWeight:800, color:accentColor,
              fontFamily:"'DM Mono',monospace", letterSpacing:"0.05em",
            }}>{initials}</div>
            <div style={{ maxWidth:120 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.85)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {user?.fullName || "User"}
              </div>
            </div>
            <span style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginLeft:2 }}>▾</span>
          </div>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="tc-dropdown">
              {/* User info */}
              <div style={{ padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{
                    width:36, height:36, borderRadius:"50%",
                    background:`${accentColor}22`, border:`1.5px solid ${accentColor}50`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:12, fontWeight:800, color:accentColor, fontFamily:"'DM Mono',monospace",
                  }}>{initials}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{user?.fullName || "User"}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:2 }}>{user?.email || ""}</div>
                  </div>
                </div>
              </div>

              {/* Status line */}
              <div style={{ padding:"8px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#22C55E", display:"inline-block", animation:"tc-blink 2.5s ease infinite" }} />
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.28)", fontFamily:"'DM Mono',monospace", letterSpacing:"0.08em" }}>
                  ACTIVE SESSION · {role?.replace("_", " ")}
                </span>
              </div>

              {/* Dashboard link */}
              <button
                className="tc-dropdown-item"
                onClick={() => { setDropdownOpen(false); navigate(links[0]?.path ?? "/"); }}
              >
                <span style={{ fontSize:13 }}>⬡</span> Dashboard
              </button>

              <div style={{ height:1, background:"rgba(255,255,255,0.06)" }} />

              {/* Sign out */}
              <button className="tc-dropdown-item danger" onClick={handleLogout}>
                <span style={{ fontSize:13 }}>↩</span> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const PAGE_META = {
  "/admin":                { title: "Dashboard",         section: "Overview"   },
  "/admin/generate":       { title: "Generate Schedule", section: "Schedule"   },
  "/admin/reports":        { title: "Reports",           section: "Schedule"   },
  "/admin/departments":    { title: "Departments",       section: "Management" },
  "/admin/rooms":          { title: "Rooms",             section: "Management" },
  "/admin/availability":   { title: "Availability",      section: "Schedule"   },
  "/teacher":              { title: "Dashboard",         section: "Overview"   },
  "/teacher/schedule":     { title: "My Schedule",       section: "Schedule"   },
  "/teacher/availability": { title: "Set Availability",  section: "Schedule"   },
  "/teacher/preferences":  { title: "Preferences",       section: "Schedule"   },
  "/student":              { title: "Dashboard",         section: "Overview"   },
  "/student/timetable":    { title: "My Timetable",      section: "Timetable"  },
  "/student/enrollment":   { title: "Enrollment",        section: "Timetable"  },
  "/dean":              { title: "Dashboard",    section: "Overview"   },
  "/dean/subjects":     { title: "Subjects",     section: "Assignments"},
  "/dean/assignments":  { title: "Assignments",  section: "Assignments"},
  "/dean/preferences":  { title: "Preferences",  section: "Assignments"},
  "/dean/generate":     { title: "Generate",     section: "Schedule"   },
  "/dean/schedule":     { title: "Schedule",     section: "Schedule"   },
};

const NAV_LINKS = {
  PROGRAM_HEAD: [
    { path: "/ph",             label: "Dashboard"   },
    { path: "/ph/subjects",    label: "Subjects"    },
    { path: "/ph/preferences", label: "Assign"      },
  ],
  ADMIN: [
    { path: "/admin",               label: "Dashboard"    },
    { path: "/admin/generate",      label: "Generate"     },
    { path: "/admin/reports",       label: "Reports"      },
    { path: "/admin/availability",  label: "Availability" },
    { path: "/admin/departments",   label: "Departments"  },
    { path: "/admin/rooms",         label: "Rooms"        },
  ],
  TEACHER: [
    { path: "/teacher",              label: "Dashboard"    },
    { path: "/teacher/schedule",     label: "Schedule"     },
    { path: "/teacher/availability", label: "Availability" },
    { path: "/teacher/preferences",  label: "Preferences"  },
  ],
  STUDENT: [
    { path: "/student",            label: "Dashboard"  },
    { path: "/student/timetable",  label: "Timetable"  },
    { path: "/student/enrollment", label: "Enrollment" },
  ],
  DEAN: [
    { path: "/dean",             label: "Dashboard"   },
    { path: "/dean/curriculum",  label: "Curriculum"  },
    { path: "/dean/subjects",    label: "Subjects"    },
    { path: "/dean/preferences", label: "Preferences" },
    { path: "/dean/generate",    label: "Generate"    },
    { path: "/dean/schedule",    label: "Schedule"    },
    { path: "/dean/irregular",   label: "Irregular"   },
  ],
  PROGRAM_HEAD: [
    { path: "/ph",               label: "Dashboard"   },
    { path: "/ph/subjects",      label: "Subjects"    },
    { path: "/ph/preferences",   label: "Assign"      },
  ],
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
  @keyframes tc-dropdown-in { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes tc-notif-pulse  { 0%,100% { box-shadow:0 0 0 0 rgba(232,121,42,0.4); } 50% { box-shadow:0 0 0 5px rgba(232,121,42,0); } }
  .tc-nav-tab:hover  { background: rgba(52,196,124,0.1) !important; color: #112A17 !important; }
  .tc-nav-tab.active { background: #112A17 !important; color: #fff !important; }
  .tc-user-pill:hover { border-color: #34C47C !important; }
  .tc-dropdown-item:hover { background: #F4FAF6 !important; }
  .tc-dropdown-item.danger:hover { background: #FEF2F2 !important; color: #B91C1C !important; }
  .tc-bell-btn:hover { border-color: rgba(232,121,42,0.5) !important; }
`;

export default function Navbar({ conflictCount = 0 }) {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
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

  const V = {
    "--green":      "#34C47C",
    "--dark-green": "#112A17",
    "--mid-green":  "#1a3d2a",
    "--light-green":"#E8F5EC",
    "--border":     "#E0EAE0",
    "--text":       "#112A17",
    "--muted":      "#7AAE7A",
  };

  return (
    <header style={{
      ...V,
      background: "#fff",
      height: "56px",
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      borderBottom: "1px solid var(--border)",
      gap: "0",
      fontFamily: "'DM Sans', sans-serif",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>

      {/* Brand */}
      <div style={{ display:"flex", alignItems:"center", gap:"9px", marginRight:"28px", flexShrink:0 }}>
        <div style={{
          width:"30px", height:"30px", borderRadius:"8px",
          background:"var(--light-green)", border:"1.5px solid var(--green)",
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"var(--green)", fontSize:"15px", fontWeight:"700",
        }}>⬡</div>
        <div>
          <div style={{ fontFamily:"'Playfair Display', Georgia, serif", fontSize:"15px", fontWeight:"700", color:"var(--dark-green)", lineHeight:1.1 }}>TimeCraft</div>
          <div style={{ fontSize:"8.5px", color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.13em" }}>Lorma College</div>
        </div>
      </div>

      {/* Center tabs */}
      <nav style={{ display:"flex", alignItems:"center", gap:"2px", flex:1, justifyContent:"center", background:"#F2F7F2", border:"1px solid #D8EAD8", borderRadius:"30px", padding:"3px" }}>
        {links.map(({ path, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              className={`tc-nav-tab${isActive ? " active" : ""}`}
              onClick={() => navigate(path)}
              style={{
                padding:"5px 15px", borderRadius:"26px", border:"none",
                background:"transparent", fontSize:"12px",
                color: isActive ? "#fff" : "#6A8A6A",
                fontWeight: isActive ? "700" : "500",
                cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap",
                fontFamily:"'DM Sans', sans-serif",
              }}
            >{label}</button>
          );
        })}
      </nav>

      {/* Right */}
      <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:"10px", flexShrink:0 }}>

        {role === "ADMIN" && conflictCount > 0 && (
          <button
            className="tc-bell-btn"
            onClick={() => navigate("/admin/reports")}
            title={`${conflictCount} conflict${conflictCount !== 1 ? "s" : ""}`}
            style={{
              width:"32px", height:"32px", borderRadius:"8px",
              background:"#FFF5EC", border:"1px solid rgba(232,121,42,0.3)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"14px", cursor:"pointer", position:"relative",
              animation:"tc-notif-pulse 2s ease infinite",
            }}
          >
            🔔
            <span style={{
              position:"absolute", top:"5px", right:"5px",
              width:"6px", height:"6px", borderRadius:"50%",
              background:"#E8792A", border:"1.5px solid #fff",
            }} />
          </button>
        )}

        <div style={{ position:"relative" }} ref={dropdownRef}>
          <div
            className="tc-user-pill"
            onClick={() => setDropdownOpen(v => !v)}
            style={{
              display:"flex", alignItems:"center", gap:"8px", cursor:"pointer",
              padding:"4px 12px 4px 4px", borderRadius:"30px",
              border:"1px solid var(--border)", background:"#fff", transition:"border-color 0.15s",
            }}
          >
            <div style={{
              width:"28px", height:"28px", borderRadius:"50%",
              background:"var(--mid-green)", border:"1.5px solid rgba(52,196,124,0.4)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"10px", fontWeight:"700", color:"var(--green)",
            }}>{initials}</div>
            <div>
              <div style={{ fontSize:"11px", fontWeight:"600", color:"var(--text)" }}>{user?.fullName || "User"}</div>
              <div style={{ fontSize:"8.5px", color:"var(--muted)" }}>{role}</div>
            </div>
            <span style={{ fontSize:"9px", color:"#AAC8AA" }}>▾</span>
          </div>

          {dropdownOpen && (
            <div style={{
              position:"absolute", top:"calc(100% + 8px)", right:0,
              width:"220px", background:"#fff",
              border:"1px solid var(--border)", borderRadius:"12px",
              boxShadow:"0 8px 24px rgba(0,0,0,0.1)",
              overflow:"hidden", animation:"tc-dropdown-in 0.15s ease",
              zIndex:200,
            }}>
              <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)" }}>
                <div style={{ fontSize:"13px", fontWeight:"600", color:"var(--text)" }}>{user?.fullName || "User"}</div>
                <div style={{ fontSize:"11px", color:"var(--muted)", marginTop:"2px" }}>{user?.email || ""}</div>
              </div>
              <button
                className="tc-dropdown-item"
                onClick={() => { setDropdownOpen(false); navigate(links[0]?.path ?? "/"); }}
                style={{ width:"100%", padding:"10px 16px", border:"none", background:"transparent", textAlign:"left", fontSize:"12.5px", color:"var(--text)", cursor:"pointer", display:"flex", alignItems:"center", gap:"8px" }}
              >◈ &nbsp;Dashboard</button>
              <div style={{ height:"1px", background:"var(--border)" }} />
              <button
                className="tc-dropdown-item danger"
                onClick={handleLogout}
                style={{ width:"100%", padding:"10px 16px", border:"none", background:"transparent", textAlign:"left", fontSize:"12.5px", color:"#DC2626", cursor:"pointer", display:"flex", alignItems:"center", gap:"8px" }}
              >↩ &nbsp;Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
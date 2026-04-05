import { useState, useRef, useEffect } from "react";
import api from "../../services/api";
import useAuth from "../../hooks/useAuth";

const CURRENT_SEMESTER = "FIRST";
const CURRENT_YEAR     = "2024-2025";

export default function OllamaChat() {
  const { role } = useAuth();
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([
    { from: "ai", text: "Hi! I can answer questions about the current schedule. Try asking: 'Which rooms are used on Monday?' or 'How many subjects does Teacher Santos have?'" }
  ]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef(null);

  // Only show for ADMIN and TEACHER
  if (role !== "ADMIN" && role !== "TEACHER") return null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;

    setMessages(prev => [...prev, { from: "user", text: q }]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post(
        `/schedules/ask?semester=${CURRENT_SEMESTER}&schoolYear=${CURRENT_YEAR}`,
        { question: q }
      );
      const answer = res.data?.data?.answer ?? "No response.";
      setMessages(prev => [...prev, { from: "ai", text: answer }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        from: "ai",
        text: "⚠️ " + (e.response?.data?.message ?? "AI assistant unavailable.")
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const CSS = `
    @keyframes tc-chat-in { from{opacity:0;transform:translateY(10px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes tc-dot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
    .tc-fab:hover { transform: scale(1.08) !important; }
    .tc-send:hover:not(:disabled) { background: #1A6A2A !important; }
    .tc-chat-input:focus { border-color: #34C47C !important; outline: none; }
  `;

  return (
    <>
      <style>{CSS}</style>

      {/* FAB */}
      <button
        className="tc-fab"
        onClick={() => setOpen(o => !o)}
        title="Ask AI about the schedule"
        style={{
          position:"fixed", bottom:28, right:28, zIndex:1000,
          width:52, height:52, borderRadius:"50%",
          background:"#112A17", border:"2px solid rgba(52,196,124,0.35)",
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22, color:"#34C47C", transition:"transform 0.2s",
          fontFamily:"'DM Sans', sans-serif",
        }}
      >{open ? "✕" : "◈"}</button>

      {/* Window */}
      {open && (
        <div style={{
          position:"fixed", bottom:92, right:28, zIndex:999,
          width:360, height:490, background:"#fff",
          borderRadius:16, border:"1px solid #D8EAD8",
          boxShadow:"0 12px 40px rgba(17,42,23,0.15)",
          display:"flex", flexDirection:"column",
          fontFamily:"'DM Sans', sans-serif", overflow:"hidden",
          animation:"tc-chat-in 0.2s ease",
        }}>

          {/* Header */}
          <div style={{ background:"#112A17", padding:"14px 18px", color:"#fff", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:"9px", background:"rgba(52,196,124,0.15)", border:"1px solid rgba(52,196,124,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:"#34C47C", flexShrink:0 }}>◈</div>
            <div>
              <div style={{ fontFamily:"'Playfair Display', Georgia, serif", fontWeight:"700", fontSize:14, color:"#fff" }}>Schedule Assistant</div>
              <div style={{ fontSize:10, color:"rgba(52,196,124,0.6)", letterSpacing:"0.05em" }}>Powered by Ollama · {CURRENT_SEMESTER} {CURRENT_YEAR}</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"14px 14px 8px", background:"#FAFCFA" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display:"flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", marginBottom:10 }}>
                <div style={{
                  maxWidth:"80%", padding:"9px 13px", borderRadius:12,
                  fontSize:12.5, lineHeight:1.55,
                  background: m.from === "user" ? "#112A17" : "#fff",
                  color: m.from === "user" ? "#fff" : "#112A17",
                  border: m.from === "ai" ? "1px solid #E0EAE0" : "none",
                  borderBottomRightRadius: m.from === "user" ? 4 : 12,
                  borderBottomLeftRadius:  m.from === "ai"   ? 4 : 12,
                }}>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display:"flex", justifyContent:"flex-start", marginBottom:10 }}>
                <div style={{ background:"#fff", border:"1px solid #E0EAE0", borderRadius:12, borderBottomLeftRadius:4, padding:"10px 16px", display:"flex", gap:4, alignItems:"center" }}>
                  {[0,1,2].map(d => (
                    <span key={d} style={{ width:6, height:6, borderRadius:"50%", background:"#34C47C", display:"inline-block", animation:`tc-dot 1.2s ease ${d*0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding:"10px 12px", borderTop:"1px solid #E8EEE8", display:"flex", gap:8, alignItems:"flex-end", background:"#fff" }}>
            <textarea
              className="tc-chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about the schedule…"
              rows={1}
              style={{ flex:1, resize:"none", border:"1.5px solid #D8EAD8", borderRadius:10, padding:"8px 12px", fontSize:13, fontFamily:"'DM Sans', sans-serif", lineHeight:1.5, maxHeight:80, overflowY:"auto", transition:"border-color 0.15s" }}
            />
            <button
              className="tc-send"
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                width:36, height:36, borderRadius:"50%", border:"none",
                background: loading || !input.trim() ? "#E8EEE8" : "#1A6A2A",
                color:"#fff", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:16, flexShrink:0, transition:"background 0.15s",
              }}
            >↑</button>
          </div>
        </div>
      )}
    </>
  );
}
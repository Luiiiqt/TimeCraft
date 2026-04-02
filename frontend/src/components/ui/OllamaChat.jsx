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

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 1000,
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
          border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, color: "#fff", transition: "transform 0.2s",
        }}
        title="Ask AI about the schedule"
      >
        {open ? "✕" : "🤖"}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed", bottom: 92, right: 28, zIndex: 999,
          width: 360, height: 480, background: "#fff",
          borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          border: "1.5px solid #E8EBF2", display: "flex", flexDirection: "column",
          fontFamily: "'DM Sans', sans-serif", overflow: "hidden",
        }}>

          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
            padding: "14px 18px", color: "#fff",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>🤖</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Schedule Assistant</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Powered by Ollama · {CURRENT_SEMESTER} {CURRENT_YEAR}</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: m.from === "user" ? "flex-end" : "flex-start",
                marginBottom: 10,
              }}>
                <div style={{
                  maxWidth: "80%", padding: "9px 13px", borderRadius: 12,
                  fontSize: 13, lineHeight: 1.5,
                  background: m.from === "user" ? "#2D6A4F" : "#F3F4F6",
                  color: m.from === "user" ? "#fff" : "#111827",
                  borderBottomRightRadius: m.from === "user" ? 4 : 12,
                  borderBottomLeftRadius:  m.from === "ai"   ? 4 : 12,
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
                <div style={{ background: "#F3F4F6", borderRadius: 12, borderBottomLeftRadius: 4, padding: "9px 14px", fontSize: 13, color: "#6B7280" }}>
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "10px 12px", borderTop: "1px solid #F3F4F6",
            display: "flex", gap: 8, alignItems: "flex-end",
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about the schedule…"
              rows={1}
              style={{
                flex: 1, resize: "none", border: "1.5px solid #E8EBF2",
                borderRadius: 10, padding: "8px 12px", fontSize: 13,
                fontFamily: "'DM Sans', sans-serif", outline: "none",
                lineHeight: 1.5, maxHeight: 80, overflowY: "auto",
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                width: 36, height: 36, borderRadius: "50%", border: "none",
                background: loading || !input.trim() ? "#E8EBF2" : "#2D6A4F",
                color: "#fff", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, flexShrink: 0,
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}
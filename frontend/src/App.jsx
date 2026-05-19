import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, I can help you understand engineering standards and approved practices."
    }
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function askQuestion() {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed })
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.answer || "No response received." }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Unable to connect to the backend API." }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  }

  return (
    <div className="appShell">
      <header className="header">
        <div className="badge">Enterprise AI</div>
        <h1>Enterprise Engineering AI Assistant</h1>
        <p>Ask questions about engineering standards, approved patterns, controls, and governance.</p>
      </header>

      <main className="chatCard">
        <div className="messages">
          {messages.map((m, i) => (
            <div key={i} className={`messageRow ${m.role}`}>
              <div className="avatar">{m.role === "assistant" ? "AI" : "You"}</div>
              <div className="bubble">{m.text}</div>
            </div>
          ))}

          {loading && (
            <div className="messageRow assistant">
              <div className="avatar">AI</div>
              <div className="bubble muted">Thinking...</div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="composer">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about engineering standards..."
            rows="1"
          />
          <button onClick={askQuestion} disabled={loading || !question.trim()} aria-label="Send">
            <Send size={20} />
          </button>
        </div>
      </main>

      <div className="hint">Press Enter to send · Shift + Enter for a new line</div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);

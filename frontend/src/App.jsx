import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, ShieldCheck, BookOpen, Loader2 } from "lucide-react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, I can help you understand engineering standards, governance patterns, and approved design practices."
    }
  ]);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const askQuestion = async () => {
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
        {
          role: "assistant",
          text: data.answer || "No response received from the backend."
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Unable to connect to the backend API. Please check the Static Web App API link to the Container App."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      askQuestion();
    }
  };

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandIcon">
            <Sparkles size={20} />
          </div>
          <div>
            <h2>Standards AI</h2>
            <p>Enterprise Assistant</p>
          </div>
        </div>

        <div className="sideCard">
          <ShieldCheck size={18} />
          <div>
            <strong>Governed responses</strong>
            <span>Designed for enterprise engineering guidance.</span>
          </div>
        </div>

        <div className="sideCard">
          <BookOpen size={18} />
          <div>
            <strong>Knowledge ready</strong>
            <span>Prepared for Azure AI Search and RAG integration.</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="pill">Enterprise Engineering Assistant</div>
            <h1>Engineering Standards Chatbot</h1>
            <p>Ask questions about engineering standards, patterns, controls, and governance.</p>
          </div>
        </header>

        <section className="chatPanel">
          <div className="messages">
            {messages.map((message, index) => (
              <div key={index} className={`messageRow ${message.role}`}>
                <div className="avatar">
                  {message.role === "assistant" ? "AI" : "You"}
                </div>
                <div className="bubble">{message.text}</div>
              </div>
            ))}

            {loading && (
              <div className="messageRow assistant">
                <div className="avatar">AI</div>
                <div className="bubble loading">
                  <Loader2 size={16} className="spin" />
                  Thinking...
                </div>
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
            />
            <button onClick={askQuestion} disabled={loading || !question.trim()}>
              <Send size={20} />
            </button>
          </div>

          <div className="hint">Press Enter to send · Shift + Enter for a new line</div>
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);

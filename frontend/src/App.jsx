import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Send, FileText, Plus, Clock, Copy, ThumbsUp, ThumbsDown, PanelRight } from "lucide-react";
import "./styles.css";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, I can help you understand EWT engineering standards, GitHub controls, CI/CD practices, IaC governance, and deployment rules.",
      citations: []
    }
  ]);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSources, setActiveSources] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSources, setShowSources] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function askQuestion() {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed, citations: [] }]);
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
          text: data.answer || "No response received.",
          citations: data.citations || []
        }
      ]);

      setActiveSources(data.citations || []);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I could not reach the backend API. Please check the Container App revision and API link.",
          citations: []
        }
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

  function copyText(text) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className={`app ${showSources ? "withSources" : ""}`}>
      {showHistory && (
        <aside className="historyDrawer">
          <div className="drawerHeader">
            <h3>Chat history</h3>
            <button onClick={() => setShowHistory(false)}>×</button>
          </div>

          <div className="historyItem active">
            <Clock size={15} />
            Engineering standards Q&A
          </div>
          <div className="historyItem">
            <Clock size={15} />
            GitHub governance checks
          </div>
          <div className="historyItem">
            <Clock size={15} />
            Terraform repository standards
          </div>
        </aside>
      )}

      <main className="chatShell">
        <header className="topbar">
          <div className="leftActions">
            <button className="iconBtn" onClick={() => setShowHistory(true)}>
              <Clock size={18} />
            </button>
            <button className="newBtn">
              <Plus size={17} />
              New chat
            </button>
          </div>

          <div className="titleBlock">
            <h1>Enterprise Engineering AI Assistant</h1>
            <p>Grounded answers with enterprise citations</p>
          </div>

          <button className="iconBtn" onClick={() => setShowSources(!showSources)}>
            <PanelRight size={18} />
          </button>
        </header>

        <section className="conversation">
          {messages.map((m, index) => (
            <div key={index} className={`message ${m.role}`}>
              <div className="avatar">{m.role === "assistant" ? "AI" : "You"}</div>

              <div className="messageBody">
                <div className="messageText">{m.text}</div>

                {m.role === "assistant" && (
                  <div className="messageActions">
                    <button onClick={() => copyText(m.text)}><Copy size={14} /></button>
                    <button><ThumbsUp size={14} /></button>
                    <button><ThumbsDown size={14} /></button>
                  </div>
                )}

                {m.role === "assistant" && m.citations?.length > 0 && (
                  <div className="citationRow">
                    {m.citations.slice(0, 3).map((c, i) => (
                      <button
                        key={i}
                        className="citationChip"
                        onClick={() => setActiveSources(m.citations)}
                      >
                        <FileText size={13} />
                        {c.document || "Source"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="message assistant">
              <div className="avatar">AI</div>
              <div className="messageBody">
                <div className="typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </section>

        <div className="composerWrap">
          <div className="composer">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about engineering standards..."
            />
            <button className="sendBtn" onClick={askQuestion} disabled={loading || !question.trim()}>
              <Send size={18} />
            </button>
          </div>
          <div className="hint">AI-generated content may be incorrect. Verify important information.</div>
        </div>
      </main>

      {showSources && (
        <aside className="sourcesPanel">
          <div className="sourcesHeader">
            <FileText size={18} />
            <h2>Sources</h2>
          </div>

          {activeSources.length === 0 ? (
            <p className="empty">Sources will appear here after a grounded response.</p>
          ) : (
            <div className="sourceList">
              {activeSources.map((s, i) => (
                <div className="sourceCard" key={i}>
                  <div className="sourceLabel">Source {i + 1}</div>
                  <h3>{s.document || "Unknown document"}</h3>
                  <p>{s.section || "Engineering Standards"}</p>
                  {s.relevance_score && <small>Relevance: {s.relevance_score}</small>}
                </div>
              ))}
            </div>
          )}
        </aside>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);

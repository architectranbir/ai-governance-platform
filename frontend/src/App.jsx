import React, { useEffect, useRef, useState } from "react";
import {
  Send,
  FileText,
  Plus,
  ShieldCheck,
  Search,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { createRoot } from "react-dom/client";
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

  const suggestedPrompts = [
    "What is the EWT single-main-branch standard?",
    "What are the branch protection requirements?",
    "How should secrets be managed in Terraform repositories?"
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark"><Sparkles size={18} /></div>
          <div>
            <h2>Engineering AI</h2>
            <p>Enterprise RAG Assistant</p>
          </div>
        </div>

        <button className="newChat">
          <Plus size={16} />
          New chat
        </button>

        <div className="navSection">
          <div className="navTitle">Workspace</div>
          <div className="navItem active"><MessageSquare size={15} /> Standards Chat</div>
          <div className="navItem"><ShieldCheck size={15} /> Governance Q&A</div>
          <div className="navItem"><Search size={15} /> Knowledge Search</div>
        </div>

        <div className="sideFooter">
          <div className="statusDot"></div>
          Azure AI Search + Azure OpenAI
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>Enterprise Engineering AI Assistant</h1>
            <p>Grounded answers from engineering standards with traceable citations.</p>
          </div>
        </header>

        <section className="chatArea">
          <div className="messages">
            {messages.map((m, index) => (
              <div key={index} className={`message ${m.role}`}>
                <div className="messageAvatar">{m.role === "assistant" ? "AI" : "You"}</div>

                <div className="messageContent">
                  <div className="messageText">{m.text}</div>

                  {m.role === "assistant" && m.citations?.length > 0 && (
                    <div className="citationRow">
                      {m.citations.slice(0, 4).map((c, i) => (
                        <button
                          key={i}
                          className="citationPill"
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
                <div className="messageAvatar">AI</div>
                <div className="messageContent">
                  <div className="messageText thinking">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {messages.length === 1 && (
            <div className="suggestions">
              {suggestedPrompts.map((p, i) => (
                <button key={i} onClick={() => setQuestion(p)}>
                  {p}
                </button>
              ))}
            </div>
          )}

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

          <div className="hint">Press Enter to send · Shift + Enter for a new line</div>
        </section>
      </main>

      <aside className="sources">
        <div className="sourcesHeader">
          <FileText size={18} />
          <h2>Sources</h2>
        </div>

        {activeSources.length === 0 ? (
          <div className="emptySources">
            Grounding evidence will appear here after an answer is generated.
          </div>
        ) : (
          <div className="sourceList">
            {activeSources.map((s, i) => (
              <div className="sourceCard" key={i}>
                <div className="sourceTag">Source {i + 1}</div>
                <h3>{s.document || "Unknown Document"}</h3>
                <p>{s.section || "Engineering Standards"}</p>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);

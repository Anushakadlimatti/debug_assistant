import { type FormEvent, useEffect, useRef, useState } from "react";
import "./App.css";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

const EXAMPLE_QUESTIONS = [
  "Why is the checkout API failing?",
  "What deployment might have caused this?",
  "Are other services affected?",
  "What should we do first?",
];

function createSessionId(): string {
  return crypto.randomUUID();
}

export default function App() {
  const [sessionId, setSessionId] = useState(createSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, error]);

  async function sendMessage(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: trimmed }),
      });

      const data = (await response.json()) as {
        reply?: string;
        error?: string;
        sessionId?: string;
      };

      if (typeof data.sessionId === "string" && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
      }

      if (!response.ok || !data.reply) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: data.reply as string },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function startNewConversation() {
    if (loading) {
      return;
    }

    setSessionId(createSessionId());
    setMessages([]);
    setError(null);
    setInput("");
  }

  return (
    <div className="app">
      <header className="header">
        {/* <p className="eyebrow">Cloudflare Workers AI · Llama 3.3</p> */}
        <div className="title-row">
          <h1>Incident Investigation Assistant</h1>
          <button
            type="button"
            className="new-conversation"
            disabled={loading}
            onClick={startNewConversation}
          >
            New conversation
          </button>
        </div>
        <p className="subtitle">
          Ask about the mock production incident. The assistant uses logs, metrics, and
          deployments to explain what went wrong.
        </p>
      </header>

      <div className="transcript" ref={listRef}>
        {messages.length === 0 && !loading && (
          <div className="empty">
            <p>Start with a question, or try one of these:</p>
            <div className="examples">
              {EXAMPLE_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void sendMessage(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <article key={message.id} className={`bubble ${message.role}`}>
            <span className="label">{message.role === "user" ? "You" : "Assistant"}</span>
            <div className="content">
              {message.role === "assistant" ? (
                <Analysis text={message.content} />
              ) : (
                message.content
              )}
            </div>
          </article>
        ))}

        {loading && (
          <article className="bubble assistant loading">
            <span className="label">Assistant</span>
            <p>Analyzing incident data…</p>
          </article>
        )}

        {error && (
          <article className="bubble error" role="alert">
            <span className="label">Error</span>
            <p>{error}</p>
            <button type="button" onClick={() => setError(null)}>
              Dismiss
            </button>
          </article>
        )}
      </div>

      <form className="composer" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="question">
          Incident question
        </label>
        <textarea
          id="question"
          rows={2}
          value={input}
          disabled={loading}
          placeholder="Why is the checkout API failing?"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void sendMessage(input);
            }
          }}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? "Investigating…" : "Investigate"}
        </button>
      </form>
    </div>
  );
}

function Analysis({ text }: { text: string }) {
  return (
    <div className="analysis">
      {text.split("\n").map((line, index) => {
        if (line.startsWith("## ")) {
          return <h2 key={index}>{line.slice(3)}</h2>;
        }
        if (line.startsWith("# ")) {
          return <h2 key={index}>{line.slice(2)}</h2>;
        }
        if (line.startsWith("- ")) {
          return <li key={index}>{line.slice(2)}</li>;
        }
        if (line.trim() === "") {
          return <div key={index} className="break" />;
        }
        return <p key={index}>{line}</p>;
      })}
    </div>
  );
}

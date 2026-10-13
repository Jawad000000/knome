import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import {
  ArrowUp,
  BriefcaseBusiness,
  CircleHelp,
  Code2,
  Menu,
  MessageSquare,
  Plus,
  RotateCcw,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { sendChatMessage } from "./api";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  sessionId: string | null;
  messages: ChatMessage[];
};

const suggestions = [
  { icon: Code2, text: "What projects has the candidate built?" },
  { icon: BriefcaseBusiness, text: "Explain the WorkQueue project." },
  { icon: Sparkles, text: "What technologies does the candidate use?" },
  { icon: CircleHelp, text: "Tell me about the candidate's backend experience." },
];

function makeConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: "New conversation",
    sessionId: null,
    messages: [],
  };
}

function makeMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return { id: crypto.randomUUID(), role, content };
}

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([
    makeConversation(),
  ]);
  const [activeId, setActiveId] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeRequestRef = useRef(false);

  useEffect(() => {
    setActiveId((current) => current || conversations[0]?.id || "");
  }, [conversations]);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeId) ??
    conversations[0];
  const messages = activeConversation?.messages ?? [];
  const hasMessages = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  function updateConversation(
    conversationId: string,
    updater: (conversation: Conversation) => Conversation,
  ) {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId ? updater(conversation) : conversation,
      ),
    );
  }

  function newChat() {
    if (activeRequestRef.current) return;
    const conversation = makeConversation();
    setConversations((current) => [conversation, ...current]);
    setActiveId(conversation.id);
    setDraft("");
    setError("");
    setSidebarOpen(false);
    textareaRef.current?.focus();
  }

  function selectConversation(id: string) {
    if (activeRequestRef.current) return;
    setActiveId(id);
    setError("");
    setSidebarOpen(false);
  }

  async function sendMessage(contentOverride?: string) {
    const content = (contentOverride ?? draft).trim();
    if (!content || loading || !activeConversation || activeRequestRef.current) return;

    const conversationId = activeConversation.id;
    const isFirstMessage = activeConversation.messages.length === 0;
    activeRequestRef.current = true;
    setLoading(true);
    setError("");
    setDraft("");

    const userMessage = makeMessage("user", content);
    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      title: isFirstMessage
        ? content.length > 34
          ? `${content.slice(0, 34)}…`
          : content
        : conversation.title,
      messages: [...conversation.messages, userMessage],
    }));

    try {
      const result = await sendChatMessage({
        message: content,
        session_id: activeConversation.sessionId,
      });

      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        sessionId: result.session_id,
        messages: [...conversation.messages, makeMessage("assistant", result.reply)],
      }));
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Something went wrong. Please try again.";
      setError(message);
      setDraft(content);
    } finally {
      activeRequestRef.current = false;
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function renderContent(content: string) {
    // Render plain text safely; React escapes HTML. Preserve line breaks.
    return content;
  }

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          aria-label="Close sidebar overlay"
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-mark"><Sparkles size={17} /></div>
            <span>knome</span>
          </div>
          <button className="icon-button mobile-close" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
          <button className="new-chat-button" onClick={newChat}>
            <Plus size={17} />
            <span>New chat</span>
            <span className="shortcut">⌘ K</span>
          </button>
        </div>

        <div className="sidebar-section-label">YOUR CHATS</div>
        <nav className="conversation-list" aria-label="Conversations">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              className={`conversation-item ${conversation.id === activeConversation?.id ? "conversation-active" : ""}`}
              onClick={() => selectConversation(conversation.id)}
            >
              <MessageSquare size={16} />
              <span>{conversation.title}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-card">
            <div className="profile-avatar">P</div>
            <div className="profile-copy">
              <strong>AI Portfolio</strong>
              <span>Recruiter assistant</span>
            </div>
            <span className="status-dot" title="Portfolio assistant" />
          </div>
          <div className="sidebar-footnote">A conversational view of my work.</div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" aria-label="Open sidebar" onClick={() => setSidebarOpen(true)}>
              <Menu size={19} />
            </button>
            <span className="topbar-title">knome</span>
            <span className="topbar-divider">/</span>
            <span className="topbar-subtitle">AI portfolio assistant</span>
          </div>
          <div className="topbar-right">
            <span className="online-indicator"><span /> Ready to chat</span>
          </div>
        </header>

        <section className={`chat-scroll-area ${hasMessages ? "has-messages" : "welcome-mode"}`}>
          {!hasMessages ? (
            <div className="welcome-content">
              <div className="welcome-icon"><Sparkles size={24} /></div>
              <div className="eyebrow"><span /> YOUR NEXT CONVERSATION STARTS HERE</div>
              <h1>Explore my <span>AI portfolio.</span></h1>
              <p className="welcome-description">
                Curious about my projects, skills, or how I build things?
                <br className="desktop-break" /> Ask away — I'll help you explore.
              </p>

              <div className="suggestions-heading">START WITH A QUESTION</div>
              <div className="suggestion-grid">
                {suggestions.map(({ icon: Icon, text }) => (
                  <button key={text} className="suggestion-card" onClick={() => void sendMessage(text)}>
                    <span className="suggestion-icon"><Icon size={17} /></span>
                    <span>{text}</span>
                    <ArrowUp size={15} className="suggestion-arrow" />
                  </button>
                ))}
              </div>
              <div className="welcome-note"><span className="note-sparkle">✳</span> Powered by AI · Built to make the details easier to explore</div>
            </div>
          ) : (
            <div className="messages-container">
              <div className="conversation-date">THIS CONVERSATION</div>
              {messages.map((message) => (
                <article key={message.id} className={`message-row message-${message.role}`}>
                  <div className={`message-avatar avatar-${message.role}`}>
                    {message.role === "assistant" ? <Sparkles size={17} /> : <UserRound size={17} />}
                  </div>
                  <div className="message-body">
                    <div className="message-author">
                      {message.role === "assistant" ? (
                        <>knome <span className="message-author-badge">AI</span></>
                      ) : "You"}
                    </div>
                    <div className="message-text">{renderContent(message.content)}</div>
                  </div>
                </article>
              ))}
              {loading && (
                <article className="message-row message-assistant">
                  <div className="message-avatar avatar-assistant"><Sparkles size={17} /></div>
                  <div className="message-body">
                    <div className="message-author">knome <span className="message-author-badge">AI</span></div>
                    <div className="typing-indicator" aria-label="AI is responding"><span /><span /><span /></div>
                  </div>
                </article>
              )}
              <div ref={bottomRef} />
            </div>
          )}
          {!hasMessages && loading && (
            <div className="welcome-loading"><span /><span /><span /> Thinking...</div>
          )}
        </section>

        <footer className="composer-area">
          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button onClick={() => void sendMessage()} disabled={loading || !draft.trim()}>
                <RotateCcw size={14} /> Retry
              </button>
            </div>
          )}
          <form className="composer" onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about my projects, skills, experience..."
              rows={1}
              aria-label="Message"
              disabled={loading}
            />
            <div className="composer-actions">
              <span className="composer-hint">AI can make mistakes. Verify important details.</span>
              <button className="send-button" type="submit" disabled={!draft.trim() || loading} aria-label="Send message">
                <ArrowUp size={19} />
              </button>
            </div>
          </form>
          <div className="composer-caption">Press <kbd>Enter</kbd> to send · <kbd>Shift + Enter</kbd> for a new line</div>
        </footer>
      </main>
    </div>
  );
}

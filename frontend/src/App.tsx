import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowDown, Loader2 } from "lucide-react";
import { streamChatMessage } from "./api";
import { KnomeLogo } from "./components/KnomeLogo";
import { NeuralCanvas } from "./components/NeuralCanvas";
import { EmptyState } from "./components/EmptyState";
import { Sidebar } from "./components/Sidebar";
import { TopNav } from "./components/TopNav";
import { ChatMessageItem } from "./components/ChatMessageItem";
import type { ChatMessage } from "./components/ChatMessageItem";
import { ChatComposer } from "./components/ChatComposer";

interface Conversation {
  id: string;
  title: string;
  sessionId: string | null;
  messages: ChatMessage[];
}

function makeConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: "New conversation",
    sessionId: null,
    messages: [],
  };
}

function makeMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([
    makeConversation(),
  ]);
  const [activeId, setActiveId] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreamingTokens, setIsStreamingTokens] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Keep track of the last submitted user prompt for retry
  const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState<string>("");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeRequestRef = useRef(false);
  const userScrolledUpRef = useRef(false);

  // Keep activeId valid
  useEffect(() => {
    setActiveId((current) => current || conversations[0]?.id || "");
  }, [conversations]);

  const activeConversation =
    conversations.find((c) => c.id === activeId) ?? conversations[0];
  const messages = activeConversation?.messages ?? [];
  const hasMessages = messages.length > 0;

  // Track user scroll position in conversation area
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isScrolledUp = distanceToBottom > 260;
    userScrolledUpRef.current = isScrolledUp;
    setShowScrollBottom(isScrolledUp && hasMessages);
  };

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  // Auto-scroll when messages or loading changes ONLY IF user hasn't scrolled up
  useEffect(() => {
    if (!userScrolledUpRef.current) {
      scrollToBottom();
    }
  }, [messages, loading, scrollToBottom]);

  const updateConversation = (
    conversationId: string,
    updater: (conv: Conversation) => Conversation,
  ) => {
    setConversations((current) =>
      current.map((c) => (c.id === conversationId ? updater(c) : c)),
    );
  };

  const newChat = () => {
    if (activeRequestRef.current) return;
    const conversation = makeConversation();
    setConversations((current) => [conversation, ...current]);
    setActiveId(conversation.id);
    setDraft("");
    setError("");
    setIsStreamingTokens(false);
    setSidebarOpen(false);
    userScrolledUpRef.current = false;
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const selectConversation = (id: string) => {
    if (activeRequestRef.current) return;
    setActiveId(id);
    setError("");
    setIsStreamingTokens(false);
    setSidebarOpen(false);
    userScrolledUpRef.current = false;
  };

  const sendMessage = async (contentOverride?: string) => {
    const content = (contentOverride ?? draft).trim();
    if (!content || loading || !activeConversation || activeRequestRef.current) return;

    const conversationId = activeConversation.id;
    const isFirstMessage = activeConversation.messages.length === 0;

    activeRequestRef.current = true;
    setLoading(true);
    setIsStreamingTokens(false);
    setError("");
    setDraft("");
    setLastSubmittedPrompt(content);
    userScrolledUpRef.current = false;

    // Add user message to conversation
    const userMessage = makeMessage("user", content);
    updateConversation(conversationId, (conv) => ({
      ...conv,
      title: isFirstMessage
        ? content.length > 36
          ? `${content.slice(0, 36)}…`
          : content
        : conv.title,
      messages: [...conv.messages, userMessage],
    }));

    // Scroll to bottom as user message appears
    setTimeout(() => scrollToBottom("smooth"), 40);

    const assistantMessageId = crypto.randomUUID();
    let accumulatedContent = "";
    let hasCreatedAssistantMessage = false;

    try {
      await streamChatMessage(
        {
          message: content,
          session_id: activeConversation.sessionId,
        },
        {
          onSession: (newSessionId) => {
            updateConversation(conversationId, (conv) => ({
              ...conv,
              sessionId: newSessionId,
            }));
          },
          onDelta: (delta) => {
            accumulatedContent += delta;
            if (!hasCreatedAssistantMessage) {
              hasCreatedAssistantMessage = true;
              setIsStreamingTokens(true);
              updateConversation(conversationId, (conv) => ({
                ...conv,
                messages: [
                  ...conv.messages,
                  {
                    id: assistantMessageId,
                    role: "assistant",
                    content: accumulatedContent,
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  },
                ],
              }));
            } else {
              updateConversation(conversationId, (conv) => ({
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: accumulatedContent }
                    : m,
                ),
              }));
            }

            if (!userScrolledUpRef.current) {
              scrollToBottom();
            }
          },
          onDone: (finalSessionId) => {
            updateConversation(conversationId, (conv) => ({
              ...conv,
              sessionId: finalSessionId || conv.sessionId,
            }));
          },
          onError: (errMsg) => {
            setError(errMsg);
          },
        },
      );
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Communication failure with AI inference engine. Please retry.";
      setError(message);
    } finally {
      activeRequestRef.current = false;
      setLoading(false);
      setIsStreamingTokens(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  };

  const handleRetry = () => {
    if (lastSubmittedPrompt && !loading) {
      setError("");
      void sendMessage(lastSubmittedPrompt);
    }
  };

  return (
    <div className="knome-shell">
      {/* Left Navigation Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeConversation?.id ?? ""}
        onSelectConversation={selectConversation}
        onNewChat={newChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        disabled={loading}
      />

      {/* Main Intelligent Workspace */}
      <main className="main-workspace">
        <TopNav
          onOpenSidebar={() => setSidebarOpen(true)}
          sessionId={activeConversation?.sessionId ?? null}
        />

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className={`workspace-scroll-viewport ${
            hasMessages ? "viewport-has-chat" : "viewport-empty"
          }`}
        >
          {/* Background Procedural Neural Canvas (Prominent in empty state, subtle ambient in active chat) */}
          <div
            className={`canvas-container ${
              hasMessages ? "canvas-ambient" : "canvas-prominent"
            }`}
          >
            <NeuralCanvas />
          </div>

          <div className="reading-column">
            {!hasMessages ? (
              <EmptyState
                onSelectSuggestion={(prompt) => void sendMessage(prompt)}
                disabled={loading}
              />
            ) : (
              <div className="messages-stream" role="log" aria-live="polite">
                <div className="conversation-header-marker">
                  <span className="marker-line" />
                  <span className="marker-text">
                    SESSION ESTABLISHED // PERSISTED CONVERSATION
                  </span>
                  <span className="marker-line" />
                </div>

                {messages.map((message) => (
                  <ChatMessageItem key={message.id} message={message} />
                ))}

                {/* Loading Generation Indicator while waiting for first chunk */}
                {loading && !isStreamingTokens && (
                  <div
                    className="message-item assistant-message-item loading-skeleton-item"
                    aria-label="Generating response"
                  >
                    <div className="assistant-message-container">
                      <div className="assistant-header">
                        <div className="assistant-identity">
                          <div className="assistant-logo-wrapper">
                            <KnomeLogo size={18} />
                          </div>
                          <div className="assistant-name-group">
                            <span className="assistant-name">knome</span>
                            <span className="assistant-badge">PROCESSING</span>
                          </div>
                        </div>
                      </div>

                      <div className="assistant-generating-pulse">
                        <div className="generating-header-row">
                          <Loader2 size={14} className="spin-icon text-cyan" />
                          <span className="generating-label">
                            QUERYING PROFILE & SYNTHESIZING RESPONSE...
                          </span>
                        </div>
                        <div className="pulse-skeleton-lines">
                          <div className="pulse-line line-1" />
                          <div className="pulse-line line-2" />
                          <div className="pulse-line line-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} className="scroll-anchor" />
              </div>
            )}
          </div>

          {/* Jump to bottom button when user scrolled up */}
          {showScrollBottom && (
            <button
              type="button"
              className="scroll-to-bottom-btn"
              onClick={() => {
                userScrolledUpRef.current = false;
                setShowScrollBottom(false);
                scrollToBottom("smooth");
              }}
              aria-label="Scroll to newest messages"
            >
              <ArrowDown size={14} />
              <span>LATEST</span>
            </button>
          )}
        </div>

        {/* Bottom Chat Composer Area */}
        <ChatComposer
          draft={draft}
          setDraft={setDraft}
          onSubmit={() => void sendMessage()}
          loading={loading}
          error={error}
          onRetry={handleRetry}
          inputRef={textareaRef}
        />
      </main>
    </div>
  );
}

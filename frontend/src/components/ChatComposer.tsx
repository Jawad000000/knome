import React, { useEffect, useRef } from "react";
import { ArrowUp, RotateCcw, AlertTriangle, Loader2 } from "lucide-react";

interface ChatComposerProps {
  draft: string;
  setDraft: (val: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  draft,
  setDraft,
  onSubmit,
  loading,
  error,
  onRetry,
  inputRef,
}) => {
  const localTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync ref with parent ref
  const setRefs = (element: HTMLTextAreaElement | null) => {
    localTextareaRef.current = element;
    if (inputRef) {
      // @ts-expect-error - assigning to mutable ref object
      inputRef.current = element;
    }
  };

  // Auto-resize textarea height
  useEffect(() => {
    const textarea = localTextareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, 180);
    textarea.style.height = `${Math.max(44, nextHeight)}px`;
  }, [draft]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && draft.trim()) {
        onSubmit();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading && draft.trim()) {
      onSubmit();
    }
  };

  return (
    <footer className="composer-root">
      <div className="composer-inner-container">
        {/* Error notification banner with working retry */}
        {error && (
          <div className="error-alert-bar" role="alert">
            <div className="error-alert-left">
              <AlertTriangle size={15} className="error-alert-icon" />
              <span className="error-alert-text">{error}</span>
            </div>
            <button
              type="button"
              className="error-retry-btn"
              onClick={onRetry}
              disabled={loading}
            >
              <RotateCcw size={13} className={loading ? "spin-icon" : ""} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Input box */}
        <form
          className={`composer-box ${loading ? "is-loading" : ""} ${
            draft.trim() ? "has-text" : ""
          }`}
          onSubmit={handleSubmit}
        >
          <textarea
            ref={setRefs}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about projects, skills, or engineering decisions..."
            rows={1}
            disabled={loading}
            aria-label="Ask about candidate projects, skills, or engineering decisions"
            className="composer-textarea"
          />

          <div className="composer-actions-bar">
            <div className="composer-status-meta">
              {loading ? (
                <div className="generating-indicator">
                  <Loader2 size={13} className="spin-icon text-cyan" />
                  <span>ANALYZING & GENERATING...</span>
                </div>
              ) : (
                <span className="composer-guidance">
                  Ask about architecture, technical trade-offs, or experience
                </span>
              )}
            </div>

            <button
              type="submit"
              className="composer-send-btn"
              disabled={!draft.trim() || loading}
              aria-label="Send message"
              title="Send message (Enter)"
            >
              {loading ? (
                <Loader2 size={16} className="spin-icon" />
              ) : (
                <ArrowUp size={16} />
              )}
            </button>
          </div>
        </form>

        {/* Microcopy shortcuts */}
        <div className="composer-foot-hints">
          <span>
            Press <kbd>Enter</kbd> to submit · <kbd>Shift + Enter</kbd> for newline
          </span>
          <span className="foot-sep">·</span>
          <span>FastAPI · PostgreSQL · Groq Inference</span>
        </div>
      </div>
    </footer>
  );
};

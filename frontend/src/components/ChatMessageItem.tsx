import React, { useState } from "react";
import { Check, Copy, User } from "lucide-react";
import { KnomeLogo } from "./KnomeLogo";
import { MarkdownRenderer } from "./MarkdownRenderer";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface ChatMessageItemProps {
  message: ChatMessage;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const isAssistant = message.role === "assistant";
  const [copied, setCopied] = useState(false);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (!isAssistant) {
    return (
      <article className="message-item user-message-item" aria-label="Your message">
        <div className="user-message-card">
          <div className="message-meta-bar">
            <span className="meta-tag-user">USER // QUERY</span>
            <div className="meta-user-icon">
              <User size={13} />
            </div>
          </div>
          <div className="user-message-content">
            <p className="user-text-body">{message.content}</p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className="message-item assistant-message-item"
      aria-label="Assistant response"
    >
      <div className="assistant-message-container">
        {/* Author & Status Header */}
        <div className="assistant-header">
          <div className="assistant-identity">
            <div className="assistant-logo-wrapper">
              <KnomeLogo size={18} />
            </div>
            <div className="assistant-name-group">
              <span className="assistant-name">knome</span>
              <span className="assistant-badge">INTELLIGENCE</span>
            </div>
          </div>

          <div className="assistant-header-actions">
            <button
              type="button"
              className="copy-message-btn"
              onClick={handleCopyMessage}
              aria-label="Copy message text"
              title="Copy message"
            >
              {copied ? (
                <>
                  <Check size={12} className="copy-icon-success" />
                  <span>COPIED</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>COPY</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Formatted Markdown Content */}
        <div className="assistant-body">
          <MarkdownRenderer content={message.content} />
        </div>
      </div>
    </article>
  );
};

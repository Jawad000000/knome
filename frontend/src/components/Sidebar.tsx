import React, { useEffect } from "react";
import { Plus, MessageSquare, X, Terminal, Cpu } from "lucide-react";
import { KnomeLogo } from "./KnomeLogo";

export interface ConversationItem {
  id: string;
  title: string;
  sessionId: string | null;
}

interface SidebarProps {
  conversations: ConversationItem[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onClose: () => void;
  disabled?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  isOpen,
  onClose,
  disabled = false,
}) => {
  // Global shortcut: Cmd+K / Ctrl+K to start a new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!disabled) {
          onNewChat();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, onNewChat]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar ${isOpen ? "sidebar-mobile-open" : ""}`}
        aria-label="Application sidebar"
      >
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand-group">
            <KnomeLogo size={26} />
            <div className="brand-text">
              <span className="brand-name">knome</span>
              <span className="brand-tag">INTELLIGENCE</span>
            </div>
          </div>

          <button
            type="button"
            className="mobile-close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action: New Conversation */}
        <div className="sidebar-action-wrap">
          <button
            type="button"
            className="new-chat-btn"
            onClick={onNewChat}
            disabled={disabled}
            aria-label="Start new conversation (Ctrl+K or ⌘K)"
          >
            <div className="btn-inner-left">
              <Plus size={16} className="btn-plus-icon" />
              <span>New conversation</span>
            </div>
            <kbd className="kbd-shortcut" title="Press ⌘K or Ctrl+K">
              <span className="kbd-sym">⌘</span>K
            </kbd>
          </button>
        </div>

        <div className="sidebar-divider" />

        {/* Conversation Navigation */}
        <div className="sidebar-section-title">
          <span>// YOUR CONVERSATIONS</span>
          <span className="conversation-count">
            {conversations.length.toString().padStart(2, "0")}
          </span>
        </div>

        <nav className="sidebar-nav" aria-label="Conversation history">
          {conversations.map((conv) => {
            const isActive = conv.id === activeId;
            return (
              <button
                key={conv.id}
                type="button"
                className={`sidebar-nav-item ${isActive ? "is-active" : ""}`}
                onClick={() => {
                  onSelectConversation(conv.id);
                  onClose();
                }}
                disabled={disabled}
                aria-current={isActive ? "page" : undefined}
                title={conv.title}
              >
                <div className="nav-item-indicator" />
                <MessageSquare size={14} className="nav-item-icon" />
                <span className="nav-item-label">{conv.title}</span>
              </button>
            );
          })}
        </nav>

        {/* Technical Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-divider footer-divider" />

          <div className="footer-system-card">
            <div className="footer-status-row">
              <div className="status-live-dot" />
              <span className="status-label">AI PORTFOLIO ASSISTANT</span>
            </div>
            <div className="footer-candidate-meta">
              <div className="meta-row">
                <Terminal size={12} className="meta-icon" />
                <span>Mohd Jawwad Ahmed</span>
              </div>
              <div className="meta-row">
                <Cpu size={12} className="meta-icon" />
                <span>Backend & AI Systems</span>
              </div>
            </div>
          </div>

          <div className="sidebar-caption">
            <span>CLINICAL AI INTERFACE // V1.4</span>
          </div>
        </div>
      </aside>
    </>
  );
};

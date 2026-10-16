import React from "react";
import { Menu } from "lucide-react";
import { KnomeLogo } from "./KnomeLogo";

interface TopNavProps {
  onOpenSidebar: () => void;
  sessionId: string | null;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenSidebar,
  sessionId,
}) => {
  const shortSession = sessionId
    ? `${sessionId.slice(0, 8)}…`
    : null;

  return (
    <header className="app-topbar">
      <div className="topbar-left-zone">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onOpenSidebar}
          aria-label="Open navigation sidebar"
        >
          <Menu size={18} />
        </button>

        <div className="topbar-breadcrumb">
          <span className="breadcrumb-brand">
            <span className="mobile-only-logo">
              <KnomeLogo size={18} />
            </span>
            <span className="breadcrumb-name">knome</span>
          </span>
          <span className="breadcrumb-divider">/</span>
          <span className="breadcrumb-item">Portfolio intelligence</span>
        </div>
      </div>

      <div className="topbar-right-zone">
        {shortSession && (
          <div className="session-id-pill" title={`Session ID: ${sessionId}`}>
            <span className="pill-label">SESSION:</span>
            <span className="pill-val">{shortSession}</span>
          </div>
        )}

        <div className="topbar-status-badge">
          <span className="status-indicator-dot" />
          <span className="status-text">SYSTEM ONLINE</span>
        </div>
      </div>
    </header>
  );
};

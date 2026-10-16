import React from "react";

interface KnomeLogoProps {
  size?: number;
  className?: string;
}

export const KnomeLogo: React.FC<KnomeLogoProps> = ({ size = 28, className = "" }) => {
  return (
    <div
      className={`knome-logo-container ${className}`}
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="knome-logo-svg"
      >
        {/* Outer architectural frame */}
        <rect
          x="1.5"
          y="1.5"
          width="29"
          height="29"
          rx="5"
          stroke="currentColor"
          strokeWidth="1.5"
          className="logo-frame"
          strokeOpacity="0.85"
        />

        {/* Minimal grid crosshairs */}
        <line
          x1="16"
          y1="3"
          x2="16"
          y2="6"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.4"
        />
        <line
          x1="16"
          y1="26"
          x2="16"
          y2="29"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.4"
        />
        <line
          x1="3"
          y1="16"
          x2="6"
          y2="16"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.4"
        />
        <line
          x1="26"
          y1="16"
          x2="29"
          y2="16"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.4"
        />

        {/* Geometric 'k' glyph composed of crisp vector vectors */}
        {/* Vertical backbone */}
        <line
          x1="10"
          y1="8"
          x2="10"
          y2="24"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Upper diagonal arm */}
        <line
          x1="10.5"
          y1="16.5"
          x2="20"
          y2="9"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Lower diagonal arm */}
        <line
          x1="12"
          y1="15"
          x2="20.5"
          y2="23.5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Electric cyan quantum neural node */}
        <circle cx="20.5" cy="9" r="2.2" fill="#00E5FF" className="logo-accent-node" />
        <circle
          cx="20.5"
          cy="9"
          r="4.5"
          stroke="#00E5FF"
          strokeWidth="0.8"
          strokeOpacity="0.5"
        />
      </svg>
    </div>
  );
};

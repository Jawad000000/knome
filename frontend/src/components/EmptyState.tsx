import React from "react";
import { ArrowUpRight } from "lucide-react";

interface EmptyStateProps {
  onSelectSuggestion: (prompt: string) => void;
  disabled?: boolean;
}

interface SuggestionTile {
  index: string;
  title: string;
  description: string;
  prompt: string;
}

const SUGGESTIONS: SuggestionTile[] = [
  {
    index: "01",
    title: "Explore my projects",
    description: "Systems I've designed and built.",
    prompt: "What key engineering projects have you built? Give me an overview of their architecture and tech stack.",
  },
  {
    index: "02",
    title: "Technical capabilities",
    description: "Languages, frameworks, and tools.",
    prompt: "What are your core technical capabilities, languages, frameworks, and tools?",
  },
  {
    index: "03",
    title: "Engineering decisions",
    description: "Architecture, trade-offs, and implementation.",
    prompt: "Walk me through key engineering decisions, architecture trade-offs, and implementation details in your projects.",
  },
  {
    index: "04",
    title: "Professional background",
    description: "Experience, education, and career direction.",
    prompt: "Tell me about your professional background, experience, education, and career focus.",
  },
];

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSelectSuggestion,
  disabled = false,
}) => {
  return (
    <div className="empty-state-root">
      <div className="empty-state-header">
        <div className="empty-state-overline">
          <span className="overline-prefix">//</span> INTELLIGENCE INTERFACE
          <span className="overline-meta">SYS_V1.4 · READY</span>
        </div>

        <h1 className="empty-state-headline">
          Discover the mind <br className="headline-break" />
          behind the work.
        </h1>

        <p className="empty-state-subtext">
          Explore projects, technical decisions, engineering experience, and the
          thinking behind the systems I've built.
        </p>
      </div>

      <div className="empty-state-section-label">
        <span>// SUGGESTED INQUIRIES</span>
        <span className="label-line" />
      </div>

      <div className="suggestions-grid" role="group" aria-label="Suggested inquiries">
        {SUGGESTIONS.map((item) => (
          <button
            key={item.index}
            type="button"
            className="suggestion-tile"
            onClick={() => onSelectSuggestion(item.prompt)}
            disabled={disabled}
            aria-label={`${item.title}: ${item.description}`}
          >
            <div className="tile-top">
              <span className="tile-index">[{item.index}]</span>
              <span className="tile-arrow-icon" aria-hidden="true">
                <ArrowUpRight size={15} />
              </span>
            </div>
            <div className="tile-content">
              <h2 className="tile-title">{item.title}</h2>
              <p className="tile-desc">{item.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="empty-state-footer-note">
        <span className="meta-indicator" />
        <span>REPRESENTING CANDIDATE DATA & ARCHITECTURAL EXPERTISE · GROQ INFERENCE</span>
      </div>
    </div>
  );
};

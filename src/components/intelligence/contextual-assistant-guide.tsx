import { ReactNode } from "react";

type GuideTone = "info" | "highlight";

type Props = {
  eyebrow?: string;
  title: string;
  description: string;
  bullets?: string[];
  tone?: GuideTone;
  icon?: ReactNode;
  compact?: boolean;
};

function DefaultGuideIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M12 4.75a7.25 7.25 0 1 0 7.25 7.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8.5v4.25m0 2.25h.01" strokeLinecap="round" />
    </svg>
  );
}

export function ContextualAssistantGuide({
  eyebrow = "Guia del asistente",
  title,
  description,
  bullets,
  tone = "info",
  icon,
  compact = false
}: Props) {
  return (
    <aside className={`assistant-guide assistant-guide-${tone} ${compact ? "assistant-guide-compact" : ""}`.trim()}>
      <div className="assistant-guide-head">
        <span className="assistant-guide-icon">{icon ?? <DefaultGuideIcon />}</span>
        <div className="assistant-guide-copy">
          <p className="assistant-guide-eyebrow">{eyebrow}</p>
          <h3 className="assistant-guide-title">{title}</h3>
          <p className="assistant-guide-description">{description}</p>
        </div>
      </div>

      {bullets && bullets.length > 0 ? (
        <ul className="assistant-guide-list">
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}

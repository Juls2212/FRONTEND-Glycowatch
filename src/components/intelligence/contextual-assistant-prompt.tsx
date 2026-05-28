"use client";

import { ContextualAssistantPromptConfig } from "@/hooks/use-contextual-assistant-prompt";

type Props = {
  prompt: ContextualAssistantPromptConfig | null;
  onDismiss: () => void;
  className?: string;
};

export function ContextualAssistantPrompt({ prompt, onDismiss, className }: Props) {
  if (!prompt) return null;

  return (
    <div
      className={`assistant-prompt assistant-prompt-${prompt.tone ?? "info"}${className ? ` ${className}` : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="assistant-prompt-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 5a7 7 0 1 1-7 7 7 7 0 0 1 7-7Z" />
          <path d="M12 9.5v3.25" strokeLinecap="round" />
          <path d="M12 15.5h.01" strokeLinecap="round" />
        </svg>
      </div>
      <div className="assistant-prompt-copy">
        <strong>{prompt.title}</strong>
        <p>{prompt.message}</p>
      </div>
      <button
        type="button"
        className="assistant-prompt-close"
        onClick={onDismiss}
        aria-label="Cerrar ayuda del asistente"
      >
        ×
      </button>
    </div>
  );
}

import { ReactNode } from "react";

type StatePanelVariant = "loading" | "empty" | "error";

type Props = {
  variant: StatePanelVariant;
  title: string;
  message?: string;
  compact?: boolean;
  children?: ReactNode;
};

function StatePanelIcon({ variant }: { variant: StatePanelVariant }) {
  if (variant === "loading") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="state-panel-icon-svg">
        <path
          d="M12 4.75a7.25 7.25 0 1 0 7.25 7.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (variant === "error") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="state-panel-icon-svg">
        <path
          d="m12 4.5 7.25 12.5H4.75L12 4.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M12 9.75v3.6m0 2.15h.01" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="state-panel-icon-svg">
      <path
        d="M12 5.25c-3.35 0-6.2 2.14-7.25 5.13 1.05 2.98 3.9 5.12 7.25 5.12s6.2-2.14 7.25-5.12c-1.05-2.99-3.9-5.13-7.25-5.13Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10.38" r="2.15" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function StatePanel({ variant, title, message, compact = false, children }: Props) {
  const role = variant === "error" ? "alert" : "status";

  return (
    <div className={`state-panel ${variant} ${compact ? "compact" : ""}`.trim()} role={role} aria-live="polite">
      <div className="state-panel-header">
        <span className="state-panel-icon" aria-hidden="true">
          <StatePanelIcon variant={variant} />
        </span>
        <div className="state-panel-copy">
          <p className="state-panel-title">{title}</p>
          {message ? <p className="state-panel-message">{message}</p> : null}
        </div>
      </div>
      {children ? <div className="state-panel-body">{children}</div> : null}
    </div>
  );
}

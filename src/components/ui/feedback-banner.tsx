type Props = {
  type: "success" | "error" | "info";
  message: string;
};

function FeedbackIcon({ type }: { type: Props["type"] }) {
  if (type === "success") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="feedback-banner-icon-svg">
        <path
          d="m7.75 12.25 2.5 2.5 6-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }

  if (type === "error") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="feedback-banner-icon-svg">
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
    <svg viewBox="0 0 24 24" aria-hidden="true" className="feedback-banner-icon-svg">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 10v4m0-6h.01" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function FeedbackBanner({ type, message }: Props) {
  return (
    <div className={`feedback-banner ${type}`} role={type === "error" ? "alert" : "status"} aria-live="polite">
      <span className="feedback-banner-icon" aria-hidden="true">
        <FeedbackIcon type={type} />
      </span>
      <p className="feedback-banner-message">{message}</p>
    </div>
  );
}

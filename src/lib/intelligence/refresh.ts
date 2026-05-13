export type IntelligenceRefreshReason =
  | "manual-measurement-created"
  | "glucose-data-changed"
  | "analytics-range-changed";

const INTELLIGENCE_REFRESH_EVENT = "glycowatch:intelligence-refresh";

export function requestIntelligenceRefresh(reason: IntelligenceRefreshReason): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<IntelligenceRefreshReason>(INTELLIGENCE_REFRESH_EVENT, {
      detail: reason
    })
  );
}

export function subscribeToIntelligenceRefresh(
  listener: (reason: IntelligenceRefreshReason) => void
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleRefresh = (event: Event) => {
    const customEvent = event as CustomEvent<IntelligenceRefreshReason>;
    listener(customEvent.detail);
  };

  window.addEventListener(INTELLIGENCE_REFRESH_EVENT, handleRefresh);
  return () => {
    window.removeEventListener(INTELLIGENCE_REFRESH_EVENT, handleRefresh);
  };
}

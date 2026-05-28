import { useCallback, useEffect, useRef, useState } from "react";

export type ContextualAssistantPromptTone = "info" | "success";

export type ContextualAssistantPromptConfig = {
  id: string;
  title: string;
  message: string;
  tone?: ContextualAssistantPromptTone;
  autoHideMs?: number;
};

type ShowOptions = {
  persist?: boolean;
};

const STORAGE_KEY = "glycowatch.contextual-assistant-prompts";

function readSeenPromptIds(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function writeSeenPromptIds(ids: string[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore localStorage failures; the prompts still work without persistence.
  }
}

export function useContextualAssistantPrompt() {
  const [prompt, setPrompt] = useState<ContextualAssistantPromptConfig | null>(null);
  const timerRef = useRef<number | null>(null);
  const seenPromptIdsRef = useRef<string[]>([]);

  useEffect(() => {
    seenPromptIdsRef.current = readSeenPromptIds();
  }, []);

  const dismissPrompt = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPrompt(null);
  }, []);

  const markPromptSeen = useCallback((promptId: string) => {
    if (seenPromptIdsRef.current.includes(promptId)) return;
    seenPromptIdsRef.current = [...seenPromptIdsRef.current, promptId];
    writeSeenPromptIds(seenPromptIdsRef.current);
  }, []);

  const showPrompt = useCallback(
    (nextPrompt: ContextualAssistantPromptConfig, options?: ShowOptions): boolean => {
      const persist = options?.persist ?? false;

      if (persist && seenPromptIdsRef.current.includes(nextPrompt.id)) {
        return false;
      }

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (persist) {
        markPromptSeen(nextPrompt.id);
      }

      setPrompt(nextPrompt);

      const autoHideMs = nextPrompt.autoHideMs ?? 7000;
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        setPrompt((current) => (current?.id === nextPrompt.id ? null : current));
      }, autoHideMs);

      return true;
    },
    [markPromptSeen]
  );

  const showPromptOnce = useCallback(
    (nextPrompt: ContextualAssistantPromptConfig) => showPrompt(nextPrompt, { persist: true }),
    [showPrompt]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    prompt,
    dismissPrompt,
    showPrompt,
    showPromptOnce
  };
}

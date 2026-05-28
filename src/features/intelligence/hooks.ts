"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { getIntelligenceHistory, getIntelligenceSummary } from "./api";
import { IntelligenceHistoryItem, IntelligenceSummary } from "./types";

type RefreshOptions = {
  background?: boolean;
};

type RefreshResult<T> = {
  success: boolean;
  data?: T;
};

type IntelligenceHookResult<T> = {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: (options?: RefreshOptions) => Promise<RefreshResult<T>>;
  commitData: (nextData: T) => void;
};

type ResourceOptions<T> = {
  enabled?: boolean;
  retryOnce?: boolean;
  retryDelayMs?: number;
  errorMessage: string;
  fetcher: () => Promise<T>;
};

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

function useIntelligenceResource<T>({
  enabled = true,
  retryOnce = false,
  retryDelayMs = 600,
  errorMessage,
  fetcher
}: ResourceOptions<T>): IntelligenceHookResult<T> {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(false);
  const dataRef = useRef<T | null>(null);
  const inFlightRef = useRef<Promise<RefreshResult<T>> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const refresh = useCallback(
    async (options?: RefreshOptions): Promise<RefreshResult<T>> => {
      const background = options?.background ?? false;

      if (!isHydrated || !accessToken) {
        if (mountedRef.current && !background && !dataRef.current) {
          setIsLoading(false);
        }
        return { success: false, data: dataRef.current ?? undefined };
      }

      if (inFlightRef.current) {
        return inFlightRef.current;
      }

      const task = (async () => {
        if (mountedRef.current) {
          if (background && dataRef.current) {
            setIsRefreshing(true);
          } else {
            setIsLoading(true);
          }
        }

        try {
          try {
            const result = await fetcher();
            if (mountedRef.current) {
              setData(result);
              setError(null);
            }
            return { success: true, data: result };
          } catch (firstError) {
            if (!retryOnce) {
              throw firstError;
            }

            console.error("Intelligence request failed on first attempt.", firstError);
            await sleep(retryDelayMs);
            const retryResult = await fetcher();
            if (mountedRef.current) {
              setData(retryResult);
              setError(null);
            }
            return { success: true, data: retryResult };
          }
        } catch (error) {
          console.error("Intelligence request failed.", error);
          if (mountedRef.current && (!background || !dataRef.current)) {
            setError(errorMessage);
          }
          return { success: false, data: dataRef.current ?? undefined };
        } finally {
          inFlightRef.current = null;
          if (mountedRef.current) {
            setIsLoading(false);
            setIsRefreshing(false);
          }
        }
      })();

      inFlightRef.current = task;
      return task;
    },
    [accessToken, errorMessage, fetcher, isHydrated, retryDelayMs, retryOnce]
  );

  const commitData = useCallback((nextData: T) => {
    dataRef.current = nextData;

    if (mountedRef.current) {
      setData(nextData);
      setError(null);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !isHydrated || !accessToken) return;
    void refresh();
  }, [accessToken, enabled, isHydrated, refresh]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
    commitData
  };
}

export function useIntelligenceSummary(options?: {
  enabled?: boolean;
  retryDelayMs?: number;
}): IntelligenceHookResult<IntelligenceSummary> {
  return useIntelligenceResource<IntelligenceSummary>({
    enabled: options?.enabled,
    retryOnce: true,
    retryDelayMs: options?.retryDelayMs ?? 600,
    errorMessage: "No se pudo cargar el análisis inteligente.",
    fetcher: getIntelligenceSummary
  });
}

export function useIntelligenceHistory(options?: {
  enabled?: boolean;
}): IntelligenceHookResult<IntelligenceHistoryItem[]> {
  return useIntelligenceResource<IntelligenceHistoryItem[]>({
    enabled: options?.enabled,
    errorMessage: "No se pudo cargar el historial de análisis.",
    fetcher: getIntelligenceHistory
  });
}

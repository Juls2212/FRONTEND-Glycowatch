"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

export function useAuthBootstrap(): void {
  const hydrate = useAuthStore((state) => state.hydrate);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [hydrate, isHydrated]);
}


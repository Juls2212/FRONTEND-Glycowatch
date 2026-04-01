"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

// This hook is responsible for bootstrapping the authentication state when the app initializes.
export function useAuthBootstrap(): void {
  const hydrate = useAuthStore((state) => state.hydrate);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  
  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }

  }, [hydrate, isHydrated]);
}


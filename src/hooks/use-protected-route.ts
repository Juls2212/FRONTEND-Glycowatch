"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { onboardingStorage } from "@/lib/auth/onboarding";

export function useProtectedRoute(redirectTo = "/login"): { ready: boolean; authorized: boolean } {
  const router = useRouter();
  const pathname = usePathname();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!isHydrated) return;
    if (!accessToken) {
      router.replace(redirectTo);
      return;
    }
    if (onboardingStorage.isProfilePending() && pathname !== "/profile") {
      router.replace("/profile");
    }
  }, [isHydrated, accessToken, redirectTo, router, pathname]);

  return {
    ready: isHydrated,
    authorized: Boolean(accessToken)
  };
}

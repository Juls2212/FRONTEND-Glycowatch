"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { fetchProfile } from "@/features/profile/api";
import { onboardingStorage } from "@/lib/auth/onboarding";
import { isProfileComplete } from "@/lib/validation/profile";

export function useProtectedRoute(redirectTo = "/login"): { ready: boolean; authorized: boolean } {
  const router = useRouter();
  const pathname = usePathname();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;

    if (!accessToken) {
      router.replace(redirectTo);
      return;
    }

    let cancelled = false;

    async function verifyProfileState() {
      if (onboardingStorage.isProfilePending()) {
        if (!cancelled && pathname !== "/onboarding") {
          router.replace("/onboarding");
        }
        return;
      }

      setIsCheckingProfile(true);
      try {
        const profile = await fetchProfile();
        if (cancelled) return;

        const complete = isProfileComplete(profile, onboardingStorage.getDiabetesType());
        if (!complete) {
          onboardingStorage.markProfilePending();
          if (pathname !== "/onboarding") {
            router.replace("/onboarding");
          }
          return;
        }

        onboardingStorage.clearProfilePending();
        if (pathname === "/onboarding") {
          router.replace("/dashboard");
        }
      } catch {
        if (cancelled) return;
      } finally {
        if (!cancelled) {
          setIsCheckingProfile(false);
        }
      }
    }

    void verifyProfileState();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, accessToken, redirectTo, router, pathname]);

  return {
    ready: isHydrated && !isCheckingProfile,
    authorized: Boolean(accessToken)
  };
}

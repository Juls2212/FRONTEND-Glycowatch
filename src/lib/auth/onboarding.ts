const ONBOARDING_PENDING_KEY = "gw_onboarding_profile_pending";

function safeRead(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function safeWrite(key: string, value: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

export const onboardingStorage = {
  markProfilePending: () => safeWrite(ONBOARDING_PENDING_KEY, "1"),
  isProfilePending: () => safeRead(ONBOARDING_PENDING_KEY) === "1",
  clearProfilePending: () => safeRemove(ONBOARDING_PENDING_KEY)
};


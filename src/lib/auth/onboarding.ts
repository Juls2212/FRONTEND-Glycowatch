const ONBOARDING_PENDING_KEY = "gw_onboarding_profile_pending";
const ONBOARDING_DIABETES_TYPE_KEY = "gw_onboarding_diabetes_type";

export type DiabetesType = "TYPE_1" | "TYPE_2" | "GESTATIONAL" | "OTHER";

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
  clearProfilePending: () => safeRemove(ONBOARDING_PENDING_KEY),
  setDiabetesType: (value: DiabetesType) => safeWrite(ONBOARDING_DIABETES_TYPE_KEY, value),
  getDiabetesType: (): DiabetesType | null => {
    const value = safeRead(ONBOARDING_DIABETES_TYPE_KEY);
    if (value === "TYPE_1" || value === "TYPE_2" || value === "GESTATIONAL" || value === "OTHER") {
      return value;
    }
    return null;
  },
  clearDiabetesType: () => safeRemove(ONBOARDING_DIABETES_TYPE_KEY)
};

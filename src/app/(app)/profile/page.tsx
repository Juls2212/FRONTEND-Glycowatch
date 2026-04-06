"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { fetchProfile, updateProfile } from "@/features/profile/api";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { ProfileData, UpdateProfilePayload } from "@/features/profile/types";
import { DiabetesType, onboardingStorage } from "@/lib/auth/onboarding";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [diabetesType, setDiabetesType] = useState<DiabetesType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadProfile = async (mountedRef?: { current: boolean }) => {
    setError(null);
    try {
      const data = await fetchProfile();
      if (mountedRef && !mountedRef.current) return;
      setProfile(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No fue posible cargar el perfil";
      if (mountedRef && !mountedRef.current) return;
      setError(message);
    }
  };

  useEffect(() => {
    const mounted = { current: true };
    setDiabetesType(onboardingStorage.getDiabetesType());

    if (onboardingStorage.isProfilePending()) {
      router.replace("/onboarding");
      return () => {
        mounted.current = false;
      };
    }

    async function initialize() {
      setIsLoading(true);
      await loadProfile(mounted);
      if (mounted.current) setIsLoading(false);
    }

    void initialize();
    return () => {
      mounted.current = false;
    };
  }, [router]);

  const onSubmit = async (payload: UpdateProfilePayload, nextDiabetesType: DiabetesType) => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      const updated = await updateProfile(payload);
      setProfile(updated);
      onboardingStorage.setDiabetesType(nextDiabetesType);
      setDiabetesType(nextDiabetesType);

      const wasPendingOnboarding = onboardingStorage.isProfilePending();
      if (wasPendingOnboarding) {
        onboardingStorage.clearProfilePending();
        setSuccess("Perfil inicial guardado correctamente.");
        router.replace("/dashboard");
        return;
      }

      setSuccess("Perfil actualizado correctamente.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar el perfil.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-page-feedback">
        {success ? <FeedbackBanner type="success" message={success} /> : null}
        {error ? <FeedbackBanner type="error" message={error} /> : null}
      </div>

      <section className="profile-page-shell">
        <ProfileForm
          profile={profile}
          diabetesType={diabetesType}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          error={null}
          success={null}
          onSubmit={onSubmit}
        />
      </section>
    </div>
  );
}

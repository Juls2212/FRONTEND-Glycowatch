"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ContextualAssistantPrompt } from "@/components/intelligence/contextual-assistant-prompt";
import { ContextualAssistantGuide } from "@/components/intelligence/contextual-assistant-guide";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { fetchProfile, updateProfile } from "@/features/profile/api";
import { ProfileData } from "@/features/profile/types";
import { useContextualAssistantPrompt } from "@/hooks/use-contextual-assistant-prompt";
import { onboardingStorage, DiabetesType } from "@/lib/auth/onboarding";
import { normalizeRestrictedDecimalInput, trimInputValue } from "@/lib/forms/input-normalizers";
import { getBrowserTimezoneOrDefault } from "@/lib/timezones";
import {
  buildOnboardingProfilePayload,
  DIABETES_TYPE_OPTIONS,
  isProfileComplete,
  onboardingProfileSchema
} from "@/lib/validation/profile";

type OnboardingFormValues = {
  fullName: string;
  birthDate: string;
  timezone: string;
  diabetesType: DiabetesType;
  hypoglycemiaThreshold: string;
  hyperglycemiaThreshold: string;
  weightKg: string;
  heightCm: string;
};

function FieldInfoTip({ summary, children }: { summary: string; children: string }) {
  return (
    <details className="onboarding-inline-guide">
      <summary>{summary}</summary>
      <p>{children}</p>
    </details>
  );
}

function toDefaultValues(profile: ProfileData | null): OnboardingFormValues {
  return {
    fullName: profile?.fullName ?? "",
    birthDate: profile?.birthDate ?? "",
    timezone: profile?.timezone ?? getBrowserTimezoneOrDefault(),
    diabetesType: profile?.diabetesType ?? onboardingStorage.getDiabetesType() ?? "TYPE_2",
    hypoglycemiaThreshold: profile?.hypoglycemiaThreshold != null ? String(profile.hypoglycemiaThreshold) : "70",
    hyperglycemiaThreshold: profile?.hyperglycemiaThreshold != null ? String(profile.hyperglycemiaThreshold) : "180",
    weightKg: profile?.weightKg != null ? String(profile.weightKg) : "",
    heightCm: profile?.heightCm != null ? String(profile.heightCm) : ""
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    prompt: assistantPrompt,
    dismissPrompt: dismissAssistantPrompt,
    showPromptOnce
  } = useContextualAssistantPrompt();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isValid }
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingProfileSchema),
    mode: "onChange",
    defaultValues: toDefaultValues(null)
  });

  const fullNameRegistration = register("fullName");
  const birthDateRegistration = register("birthDate");
  const timezoneRegistration = register("timezone");
  const diabetesTypeRegistration = register("diabetesType");
  const hypoglycemiaRegistration = register("hypoglycemiaThreshold");
  const hyperglycemiaRegistration = register("hyperglycemiaThreshold");
  const weightRegistration = register("weightKg");
  const heightRegistration = register("heightCm");

  useEffect(() => {
    const mounted = { current: true };

    async function initialize() {
      setIsLoading(true);
      setSubmitError(null);
      try {
        const currentProfile = await fetchProfile();
        if (!mounted.current) return;

        const storedDiabetesType = onboardingStorage.getDiabetesType();
        if (isProfileComplete(currentProfile, storedDiabetesType)) {
          onboardingStorage.clearProfilePending();
          router.replace("/dashboard");
          return;
        }

        onboardingStorage.markProfilePending();
        reset(toDefaultValues(currentProfile));
      } catch (err) {
        if (!mounted.current) return;
        const message = err instanceof Error ? err.message : "No se pudo preparar el onboarding.";
        setSubmitError(message);
      } finally {
        if (mounted.current) setIsLoading(false);
      }
    }

    void initialize();
    return () => {
      mounted.current = false;
    };
  }, [reset, router]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await updateProfile(buildOnboardingProfilePayload(values));
      onboardingStorage.setDiabetesType(values.diabetesType);
      onboardingStorage.clearProfilePending();
      router.replace("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo completar el perfil inicial.";
      setSubmitError(message);
    }
  });

  const applyRestrictedDecimal =
    (field: keyof Pick<OnboardingFormValues, "hypoglycemiaThreshold" | "hyperglycemiaThreshold" | "weightKg" | "heightCm">) =>
    (value: string) => {
      setValue(field, normalizeRestrictedDecimalInput(value, { maxIntegerDigits: 3, maxFractionDigits: 1 }), {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true
      });
    };

  useEffect(() => {
    if (isLoading) return;

    showPromptOnce({
      id: "assistant-onboarding-guidance",
      title: "Configuración guiada",
      message: "Estos datos ayudan a personalizar alertas, rangos y explicaciones futuras sin cambiar tu flujo de seguimiento."
    });
  }, [isLoading, showPromptOnce]);

  return (
    <ProtectedRoute>
      <div className="onboarding-shell">
        <div className="onboarding-card onboarding-card-assisted">
          <div className="onboarding-layout">
            <div className="onboarding-main">
              <ContextualAssistantPrompt prompt={assistantPrompt} onDismiss={dismissAssistantPrompt} />
              <div className="onboarding-copy">
                <p className="auth-eyebrow">Primeros pasos</p>
                <h1 className="onboarding-title">Bienvenido a GlycoWatch</h1>
                <p className="onboarding-subtitle">
                  Completa tu perfil inicial para personalizar alertas, rangos y futuras interpretaciones de monitoreo.
                </p>
              </div>

              {submitError ? <FeedbackBanner type="error" message={submitError} /> : null}

              {isLoading ? (
                <div className="page-center">
                  <div className="loader" />
                </div>
              ) : (
                <form className="onboarding-form" onSubmit={onSubmit}>
                  <section className="onboarding-section">
                    <div className="onboarding-section-header">
                      <h2>Informacion personal</h2>
                      <p>Estos datos nos ayudan a contextualizar tu seguimiento diario.</p>
                    </div>

                    <input type="hidden" {...timezoneRegistration} />

                    <div className="onboarding-grid">
                      <label className={`field ${errors.fullName ? "has-error" : ""}`}>
                        <span>Nombre completo</span>
                        <input
                          type="text"
                          maxLength={100}
                          disabled={isSubmitting}
                          aria-invalid={errors.fullName ? "true" : "false"}
                          aria-describedby={errors.fullName ? "onboarding-full-name-error" : undefined}
                          {...fullNameRegistration}
                          onBlur={(event) => {
                            event.currentTarget.value = trimInputValue(event.currentTarget.value);
                            fullNameRegistration.onBlur(event);
                          }}
                        />
                        <small className="field-helper">Se mostrara en tu perfil y resúmenes personales.</small>
                        {errors.fullName ? <small id="onboarding-full-name-error">{errors.fullName.message}</small> : null}
                      </label>

                      <label className={`field ${errors.birthDate ? "has-error" : ""}`}>
                        <span>Fecha de nacimiento</span>
                        <input
                          type="date"
                          disabled={isSubmitting}
                          aria-invalid={errors.birthDate ? "true" : "false"}
                          aria-describedby={errors.birthDate ? "onboarding-birth-date-error" : undefined}
                          {...birthDateRegistration}
                        />
                        <small className="field-helper">Se usa para interpretar mejor tus referencias de seguimiento.</small>
                        {errors.birthDate ? <small id="onboarding-birth-date-error">{errors.birthDate.message}</small> : null}
                      </label>

                      <label className={`field ${errors.diabetesType ? "has-error" : ""}`}>
                        <span>Tipo de diabetes</span>
                        <select
                          disabled={isSubmitting}
                          aria-invalid={errors.diabetesType ? "true" : "false"}
                          aria-describedby={errors.diabetesType ? "onboarding-diabetes-type-error" : undefined}
                          {...diabetesTypeRegistration}
                        >
                          <option value="">Selecciona una opcion</option>
                          {DIABETES_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <small className="field-helper">Esto ayuda a personalizar alertas y analisis.</small>
                        <FieldInfoTip summary="Glyco Assistant: como interpretar estas opciones">
                          Tipo 1 suele referirse a una condicion autoinmune con poca o ninguna produccion de insulina. Tipo 2 se relaciona con resistencia a la insulina o menor efectividad. Prediabetes indica glucosa por encima de lo normal sin llegar aun a diabetes. Otro sirve para contextos que no encajan en las opciones anteriores.
                        </FieldInfoTip>
                        {errors.diabetesType ? <small id="onboarding-diabetes-type-error">{errors.diabetesType.message}</small> : null}
                      </label>
                    </div>
                  </section>

                  <section className="onboarding-section">
                    <div className="onboarding-section-header">
                      <h2>Datos de salud</h2>
                      <p>Estos parametros sirven para interpretar tus mediciones y definir alertas utiles.</p>
                    </div>

                    <div className="onboarding-grid">
                      <label className={`field ${errors.hypoglycemiaThreshold ? "has-error" : ""}`}>
                        <span>Umbral minimo de glucosa (mg/dL)</span>
                        <input
                          type="number"
                          step="0.1"
                          min="20"
                          max="600"
                          disabled={isSubmitting}
                          aria-invalid={errors.hypoglycemiaThreshold ? "true" : "false"}
                          aria-describedby={errors.hypoglycemiaThreshold ? "onboarding-hypo-error" : undefined}
                          {...hypoglycemiaRegistration}
                          onChange={(event) => applyRestrictedDecimal("hypoglycemiaThreshold")(event.target.value)}
                        />
                        <small className="field-helper">Define cuando una lectura debe tratarse como baja.</small>
                        <FieldInfoTip summary="Glyco Assistant: umbral minimo">
                          Valores por debajo de 70 mg/dL suelen usarse como referencia educativa de hipoglucemia. Este umbral debe personalizarse con orientacion medica para que tus alertas sean mas utiles para ti.
                        </FieldInfoTip>
                        {errors.hypoglycemiaThreshold ? <small id="onboarding-hypo-error">{errors.hypoglycemiaThreshold.message}</small> : null}
                      </label>

                      <label className={`field ${errors.hyperglycemiaThreshold ? "has-error" : ""}`}>
                        <span>Umbral maximo de glucosa (mg/dL)</span>
                        <input
                          type="number"
                          step="0.1"
                          min="20"
                          max="600"
                          disabled={isSubmitting}
                          aria-invalid={errors.hyperglycemiaThreshold ? "true" : "false"}
                          aria-describedby={errors.hyperglycemiaThreshold ? "onboarding-hyper-error" : undefined}
                          {...hyperglycemiaRegistration}
                          onChange={(event) => applyRestrictedDecimal("hyperglycemiaThreshold")(event.target.value)}
                        />
                        <small className="field-helper">Define cuando una lectura debe tratarse como alta.</small>
                        <FieldInfoTip summary="Glyco Assistant: umbral maximo">
                          Valores por encima de 180 mg/dL suelen usarse como referencia educativa de hiperglucemia. Conviene ajustarlo con orientacion medica para reflejar mejor tu rango personalizado.
                        </FieldInfoTip>
                        {errors.hyperglycemiaThreshold ? <small id="onboarding-hyper-error">{errors.hyperglycemiaThreshold.message}</small> : null}
                      </label>

                      <label className={`field ${errors.weightKg ? "has-error" : ""}`}>
                        <span>Peso (kg)</span>
                        <input
                          type="number"
                          step="0.1"
                          min="2"
                          max="350"
                          disabled={isSubmitting}
                          aria-invalid={errors.weightKg ? "true" : "false"}
                          aria-describedby={errors.weightKg ? "onboarding-weight-error" : undefined}
                          {...weightRegistration}
                          onChange={(event) => applyRestrictedDecimal("weightKg")(event.target.value)}
                        />
                        <small className="field-helper">Se usa para personalizar referencias y contexto clinico.</small>
                        <FieldInfoTip summary="Glyco Assistant: para que sirve el peso">
                          Puede ayudar a enriquecer el contexto de salud y futuras referencias personalizadas dentro del seguimiento.
                        </FieldInfoTip>
                        {errors.weightKg ? <small id="onboarding-weight-error">{errors.weightKg.message}</small> : null}
                      </label>

                      <label className={`field ${errors.heightCm ? "has-error" : ""}`}>
                        <span>Altura (cm)</span>
                        <input
                          type="number"
                          step="0.1"
                          min="30"
                          max="250"
                          disabled={isSubmitting}
                          aria-invalid={errors.heightCm ? "true" : "false"}
                          aria-describedby={errors.heightCm ? "onboarding-height-error" : undefined}
                          {...heightRegistration}
                          onChange={(event) => applyRestrictedDecimal("heightCm")(event.target.value)}
                        />
                        <small className="field-helper">Ayuda a completar tu configuracion inicial de salud.</small>
                        <FieldInfoTip summary="Glyco Assistant: para que sirve la altura">
                          Se usa junto con otros datos de perfil para ofrecer un contexto de monitoreo mas completo y menos generico.
                        </FieldInfoTip>
                        {errors.heightCm ? <small id="onboarding-height-error">{errors.heightCm.message}</small> : null}
                      </label>
                    </div>
                  </section>

                  <div className="onboarding-actions">
                    <div className="onboarding-progress">
                      <span className={`metric-chip ${isValid ? "ready" : ""}`}>
                        {isValid ? "Formulario listo" : "Completa todos los campos requeridos"}
                      </span>
                    </div>
                    <button type="submit" className="primary-button" disabled={!isValid || isSubmitting}>
                      {isSubmitting ? "Guardando..." : "Completar perfil y continuar"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <aside className="onboarding-assistant-panel">
              <div className="onboarding-assistant-hero">
                <p className="auth-eyebrow">Glyco Assistant</p>
                <h2 className="onboarding-assistant-title">Te acompaño mientras configuras tu perfil clínico.</h2>
                <p className="onboarding-assistant-subtitle">
                  Esta configuración inicial ayuda a personalizar monitoreo de glucosa, alertas, rangos y futuras explicaciones dentro de GlycoWatch.
                </p>
              </div>

              <ContextualAssistantGuide
                tone="highlight"
                title="Por que este perfil importa"
                description="Tus datos iniciales ayudan a que GlycoWatch adapte mejor alertas, rangos y futuras explicaciones de monitoreo sin cambiar tu flujo clinico."
                bullets={[
                  "Tipo 1: condicion autoinmune en la que el cuerpo produce poca o ninguna insulina.",
                  "Tipo 2: resistencia a la insulina o menor efectividad, a veces manejada con habitos, medicacion o insulina segun el caso.",
                  "Prediabetes: niveles de glucosa por encima de lo normal, pero aun fuera de rango diagnostico de diabetes.",
                  "Otro: util cuando tu situacion clinica no encaja en las opciones anteriores."
                ]}
              />

              <ContextualAssistantGuide
                compact
                title="Personalizacion del monitoreo"
                description="Los umbrales de glucosa son referencias educativas iniciales y conviene personalizarlos con orientacion medica."
                bullets={[
                  "Menos de 70 mg/dL suele usarse como referencia comun para glucosa baja.",
                  "Mas de 180 mg/dL suele usarse como referencia comun para glucosa alta.",
                  "Peso y altura pueden ayudar a personalizar mejor el contexto de salud en el tiempo."
                ]}
              />

              <div className="onboarding-assistant-note">
                <strong>Nota importante</strong>
                <p>
                  Glyco Assistant ayuda a explicar tus datos y su contexto, pero no reemplaza la valoración ni las recomendaciones de un profesional de salud.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { ProfileData, UpdateProfilePayload } from "@/features/profile/types";
import { DiabetesType } from "@/lib/auth/onboarding";
import { normalizeRestrictedDecimalInput, trimInputValue } from "@/lib/forms/input-normalizers";
import { formatTimezoneLabel, getBrowserTimezoneOrDefault, getTimezoneOptions } from "@/lib/timezones";
import { mapZodIssuesToFieldErrors } from "@/lib/validation/errors";
import { buildProfilePayload, DIABETES_TYPE_OPTIONS, profileViewSchema } from "@/lib/validation/profile";

type Props = {
  profile: ProfileData | null;
  diabetesType: DiabetesType | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  success: string | null;
  onSubmit: (payload: UpdateProfilePayload, diabetesType: DiabetesType) => Promise<void>;
};

type FormState = {
  fullName: string;
  email: string;
  birthDate: string;
  timezone: string;
  diabetesType: "" | DiabetesType;
  hypoglycemiaThreshold: string;
  hyperglycemiaThreshold: string;
  weightKg: string;
  heightCm: string;
};

type FieldName = keyof FormState;

const INITIAL_STATE: FormState = {
  fullName: "",
  email: "",
  birthDate: "",
  timezone: "",
  diabetesType: "",
  hypoglycemiaThreshold: "",
  hyperglycemiaThreshold: "",
  weightKg: "",
  heightCm: ""
};

function toFormState(profile: ProfileData, diabetesType: DiabetesType | null): FormState {
  return {
    fullName: profile.fullName ?? "",
    email: profile.email ?? "",
    birthDate: profile.birthDate ?? "",
    timezone: profile.timezone ?? "",
    diabetesType: profile.diabetesType ?? diabetesType ?? "",
    hypoglycemiaThreshold: String(profile.hypoglycemiaThreshold ?? ""),
    hyperglycemiaThreshold: String(profile.hyperglycemiaThreshold ?? ""),
    weightKg: profile.weightKg == null ? "" : String(profile.weightKg),
    heightCm: profile.heightCm == null ? "" : String(profile.heightCm)
  };
}

function buildInitials(fullName: string, email: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length > 0) {
    return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  }

  return (email.trim()[0] ?? "G").toUpperCase();
}

function getDiabetesLabel(value: "" | DiabetesType): string {
  return DIABETES_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? "Sin definir";
}

function ProfileGlyph({ children }: { children: ReactNode }) {
  return <span className="profile-section-icon">{children}</span>;
}

function ProfileSectionTitle({
  icon,
  title,
  description
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="profile-section-header">
      <div className="profile-section-heading">
        <ProfileGlyph>{icon}</ProfileGlyph>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}

export function ProfileForm({
  profile,
  diabetesType,
  isLoading,
  isSubmitting,
  error,
  success,
  onSubmit
}: Props) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const timezoneOptions = useMemo(() => getTimezoneOptions(), []);

  useEffect(() => {
    if (!profile) return;
    const mapped = toFormState(profile, diabetesType);
    if (!mapped.timezone) {
      mapped.timezone = getBrowserTimezoneOrDefault();
    }
    setForm(mapped);
  }, [profile, diabetesType]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});

    const result = profileViewSchema.safeParse({
      fullName: form.fullName,
      birthDate: form.birthDate,
      timezone: form.timezone,
      diabetesType: form.diabetesType,
      hypoglycemiaThreshold: form.hypoglycemiaThreshold,
      hyperglycemiaThreshold: form.hyperglycemiaThreshold,
      weightKg: form.weightKg,
      heightCm: form.heightCm
    });

    if (!result.success) {
      setFieldErrors(mapZodIssuesToFieldErrors<FieldName>(result.error.issues));
      return;
    }

    await onSubmit(buildProfilePayload(result.data), result.data.diabetesType);
  };

  const setField =
    (field: FieldName) =>
    (value: string): void =>
      setForm((current) => ({ ...current, [field]: value as FormState[FieldName] }));

  const updateField =
    (field: FieldName) =>
    (value: string): void => {
      setFieldErrors((current) => {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
      setField(field)(value);
    };

  const updateRestrictedDecimalField =
    (field: FieldName) =>
    (value: string): void =>
      updateField(field)(normalizeRestrictedDecimalInput(value, { maxIntegerDigits: 3, maxFractionDigits: 1 }));

  if (isLoading) {
    return <Card className="profile-state-card"><p className="soft-text">Cargando perfil...</p></Card>;
  }

  if (!profile) {
    return <Card className="profile-state-card"><p className="soft-text">No se encontro informacion del perfil.</p></Card>;
  }

  const initials = buildInitials(form.fullName, form.email);

  return (
    <div className="profile-experience">
      <Card className="profile-hero-card">
        <div className="profile-hero-content">
          <div className="profile-hero-copy">
            <span className="profile-hero-eyebrow">Tu espacio personal</span>
            <h2 className="profile-hero-title">User Profile</h2>
            <p className="profile-hero-subtitle">
              Mantén tus datos personales y parámetros clínicos actualizados para personalizar el seguimiento y las
              alertas de glucosa.
            </p>
            <div className="profile-hero-meta">
              <span className="profile-chip profile-chip-accent">Correo protegido</span>
              <span className="profile-chip">Monitoreo personalizado</span>
            </div>
          </div>

          <div className="profile-overview-panel">
            <div className="profile-avatar" aria-hidden="true">
              {initials}
            </div>
            <div className="profile-overview-copy">
              <strong>{form.fullName || "Completa tu nombre"}</strong>
              <span>{form.email}</span>
            </div>
            <div className="profile-overview-stats">
              <div className="profile-stat">
                <span>Tipo</span>
                <strong>{getDiabetesLabel(form.diabetesType)}</strong>
              </div>
              <div className="profile-stat">
                <span>Rango objetivo</span>
                <strong>
                  {form.hypoglycemiaThreshold || "--"} - {form.hyperglycemiaThreshold || "--"} mg/dL
                </strong>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <form className="profile-form profile-form-shell" onSubmit={(event) => void handleSubmit(event)}>
        <div className="profile-sections-grid">
          <Card className="profile-section-card">
            <ProfileSectionTitle
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
                  <path d="M5 19a7 7 0 0 1 14 0" />
                </svg>
              }
              title="Informacion personal"
              description="Estos datos ayudan a identificar tu cuenta y ajustar horarios, edad y contexto de seguimiento."
            />

            <div className="profile-section-grid">
              <label className={`field ${fieldErrors.fullName ? "has-error" : ""}`}>
                <span>Nombre completo</span>
                <input
                  type="text"
                  value={form.fullName}
                  maxLength={100}
                  placeholder="Ej. Ana Maria Torres"
                  disabled={isSubmitting}
                  aria-invalid={fieldErrors.fullName ? "true" : "false"}
                  aria-describedby={fieldErrors.fullName ? "profile-full-name-error" : "profile-full-name-help"}
                  onBlur={(event) => updateField("fullName")(trimInputValue(event.target.value))}
                  onChange={(event) => updateField("fullName")(event.target.value)}
                />
                <small className="field-helper" id="profile-full-name-help">
                  Usa tu nombre real para reconocer fácilmente tu perfil.
                </small>
                {fieldErrors.fullName ? <small id="profile-full-name-error">{fieldErrors.fullName}</small> : null}
              </label>

              <label className="field">
                <span>Correo electronico</span>
                <input type="email" value={form.email} disabled aria-readonly="true" />
                <small className="field-helper">Este correo viene de tu cuenta y no se puede editar aquí.</small>
              </label>

              <label className={`field ${fieldErrors.birthDate ? "has-error" : ""}`}>
                <span>Fecha de nacimiento</span>
                <input
                  type="date"
                  value={form.birthDate}
                  disabled={isSubmitting}
                  aria-invalid={fieldErrors.birthDate ? "true" : "false"}
                  aria-describedby={fieldErrors.birthDate ? "profile-birth-date-error" : "profile-birth-date-help"}
                  onChange={(event) => updateField("birthDate")(event.target.value)}
                />
                <small className="field-helper" id="profile-birth-date-help">
                  Nos ayuda a contextualizar tus métricas y recomendaciones.
                </small>
                {fieldErrors.birthDate ? <small id="profile-birth-date-error">{fieldErrors.birthDate}</small> : null}
              </label>

              <label className={`field ${fieldErrors.timezone ? "has-error" : ""}`}>
                <span>Zona horaria</span>
                <select
                  value={form.timezone}
                  disabled={isSubmitting}
                  aria-invalid={fieldErrors.timezone ? "true" : "false"}
                  aria-describedby={fieldErrors.timezone ? "profile-timezone-error" : "profile-timezone-help"}
                  onChange={(event) => updateField("timezone")(event.target.value)}
                >
                  <option value="">Selecciona una zona horaria</option>
                  {!timezoneOptions.includes(form.timezone) && form.timezone ? (
                    <option value={form.timezone}>{formatTimezoneLabel(form.timezone)}</option>
                  ) : null}
                  {timezoneOptions.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {formatTimezoneLabel(timezone)}
                    </option>
                  ))}
                </select>
                <small className="field-helper" id="profile-timezone-help">
                  Se usa para mostrar horarios y registros en tu hora local.
                </small>
                {fieldErrors.timezone ? <small id="profile-timezone-error">{fieldErrors.timezone}</small> : null}
              </label>
            </div>
          </Card>

          <Card className="profile-section-card profile-section-card-health">
            <ProfileSectionTitle
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.69A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z" />
                </svg>
              }
              title="Salud y monitoreo"
              description="Configura el tipo de diabetes y los valores que guían tus alertas y análisis diarios."
            />

            <div className="profile-threshold-highlight">
              <div className="profile-threshold-pill profile-threshold-pill-min">
                <span>Umbral minimo</span>
                <strong>{form.hypoglycemiaThreshold || "--"} mg/dL</strong>
              </div>
              <div className="profile-threshold-pill profile-threshold-pill-max">
                <span>Umbral maximo</span>
                <strong>{form.hyperglycemiaThreshold || "--"} mg/dL</strong>
              </div>
            </div>

            <div className="profile-section-grid">
              <label className={`field ${fieldErrors.diabetesType ? "has-error" : ""}`}>
                <span>Tipo de diabetes</span>
                <select
                  value={form.diabetesType}
                  disabled={isSubmitting}
                  aria-invalid={fieldErrors.diabetesType ? "true" : "false"}
                  aria-describedby={fieldErrors.diabetesType ? "profile-diabetes-type-error" : "profile-diabetes-type-help"}
                  onChange={(event) => updateField("diabetesType")(event.target.value)}
                >
                  <option value="">Selecciona una opcion</option>
                  {DIABETES_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <small className="field-helper" id="profile-diabetes-type-help">
                  Esto ayuda a personalizar alertas y analisis.
                </small>
                {fieldErrors.diabetesType ? (
                  <small id="profile-diabetes-type-error">{fieldErrors.diabetesType}</small>
                ) : null}
              </label>

              <label className={`field ${fieldErrors.hypoglycemiaThreshold ? "has-error" : ""}`}>
                <span>Umbral minimo (mg/dL)</span>
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="600"
                  value={form.hypoglycemiaThreshold}
                  placeholder="70"
                  disabled={isSubmitting}
                  aria-invalid={fieldErrors.hypoglycemiaThreshold ? "true" : "false"}
                  aria-describedby={fieldErrors.hypoglycemiaThreshold ? "profile-hypo-error" : "profile-hypo-help"}
                  onChange={(event) => updateRestrictedDecimalField("hypoglycemiaThreshold")(event.target.value)}
                />
                <small className="field-helper" id="profile-hypo-help">
                  Valor a partir del cual quieres detectar hipoglucemia.
                </small>
                {fieldErrors.hypoglycemiaThreshold ? (
                  <small id="profile-hypo-error">{fieldErrors.hypoglycemiaThreshold}</small>
                ) : null}
              </label>

              <label className={`field ${fieldErrors.hyperglycemiaThreshold ? "has-error" : ""}`}>
                <span>Umbral maximo (mg/dL)</span>
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="600"
                  value={form.hyperglycemiaThreshold}
                  placeholder="180"
                  disabled={isSubmitting}
                  aria-invalid={fieldErrors.hyperglycemiaThreshold ? "true" : "false"}
                  aria-describedby={fieldErrors.hyperglycemiaThreshold ? "profile-hyper-error" : "profile-hyper-help"}
                  onChange={(event) => updateRestrictedDecimalField("hyperglycemiaThreshold")(event.target.value)}
                />
                <small className="field-helper" id="profile-hyper-help">
                  Valor a partir del cual quieres detectar hiperglucemia.
                </small>
                {fieldErrors.hyperglycemiaThreshold ? (
                  <small id="profile-hyper-error">{fieldErrors.hyperglycemiaThreshold}</small>
                ) : null}
              </label>

              <label className={`field ${fieldErrors.weightKg ? "has-error" : ""}`}>
                <span>Peso (kg)</span>
                <input
                  type="number"
                  step="0.1"
                  min="2"
                  max="350"
                  value={form.weightKg}
                  placeholder="70.0"
                  disabled={isSubmitting}
                  aria-invalid={fieldErrors.weightKg ? "true" : "false"}
                  aria-describedby={fieldErrors.weightKg ? "profile-weight-error" : "profile-weight-help"}
                  onChange={(event) => updateRestrictedDecimalField("weightKg")(event.target.value)}
                />
                <small className="field-helper" id="profile-weight-help">
                  Dato opcional, útil para futuras referencias clínicas y analíticas.
                </small>
                {fieldErrors.weightKg ? <small id="profile-weight-error">{fieldErrors.weightKg}</small> : null}
              </label>

              <label className={`field ${fieldErrors.heightCm ? "has-error" : ""}`}>
                <span>Altura (cm)</span>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="250"
                  value={form.heightCm}
                  placeholder="170"
                  disabled={isSubmitting}
                  aria-invalid={fieldErrors.heightCm ? "true" : "false"}
                  aria-describedby={fieldErrors.heightCm ? "profile-height-error" : "profile-height-help"}
                  onChange={(event) => updateRestrictedDecimalField("heightCm")(event.target.value)}
                />
                <small className="field-helper" id="profile-height-help">
                  Dato opcional para completar tu contexto de monitoreo.
                </small>
                {fieldErrors.heightCm ? <small id="profile-height-error">{fieldErrors.heightCm}</small> : null}
              </label>
            </div>
          </Card>
        </div>

        {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}
        {success ? <p className="form-feedback form-feedback-success">{success}</p> : null}

        <div className="profile-actions">
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

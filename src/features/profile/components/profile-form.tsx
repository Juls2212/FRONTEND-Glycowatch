import { FormEvent, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { ProfileData, UpdateProfilePayload } from "@/features/profile/types";
import { normalizeRestrictedDecimalInput } from "@/lib/forms/input-normalizers";
import { formatTimezoneLabel, getBrowserTimezoneOrDefault, getTimezoneOptions } from "@/lib/timezones";
import { mapZodIssuesToFieldErrors } from "@/lib/validation/errors";
import { buildProfilePayload, profileFormSchema } from "@/lib/validation/profile";

type Props = {
  profile: ProfileData | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  success: string | null;
  onSubmit: (payload: UpdateProfilePayload) => Promise<void>;
};

type FormState = {
  fullName: string;
  email: string;
  birthDate: string;
  hypoglycemiaThreshold: string;
  hyperglycemiaThreshold: string;
  timezone: string;
  weightKg: string;
  heightCm: string;
};

const INITIAL_STATE: FormState = {
  fullName: "",
  email: "",
  birthDate: "",
  hypoglycemiaThreshold: "",
  hyperglycemiaThreshold: "",
  timezone: "",
  weightKg: "",
  heightCm: ""
};

function toFormState(profile: ProfileData): FormState {
  return {
    fullName: profile.fullName ?? "",
    email: profile.email ?? "",
    birthDate: profile.birthDate ?? "",
    hypoglycemiaThreshold: String(profile.hypoglycemiaThreshold ?? ""),
    hyperglycemiaThreshold: String(profile.hyperglycemiaThreshold ?? ""),
    timezone: profile.timezone ?? "",
    weightKg: profile.weightKg == null ? "" : String(profile.weightKg),
    heightCm: profile.heightCm == null ? "" : String(profile.heightCm)
  };
}

export function ProfileForm({ profile, isLoading, isSubmitting, error, success, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const timezoneOptions = useMemo(() => getTimezoneOptions(), []);

  useEffect(() => {
    if (profile) {
      const mapped = toFormState(profile);
      if (!mapped.timezone) {
        mapped.timezone = getBrowserTimezoneOrDefault();
      }
      setForm(mapped);
    }
  }, [profile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});

    const result = profileFormSchema.safeParse({
      fullName: form.fullName,
      birthDate: form.birthDate,
      hypoglycemiaThreshold: form.hypoglycemiaThreshold,
      hyperglycemiaThreshold: form.hyperglycemiaThreshold,
      timezone: form.timezone,
      weightKg: form.weightKg,
      heightCm: form.heightCm
    });

    if (!result.success) {
      setFieldErrors(mapZodIssuesToFieldErrors<keyof FormState>(result.error.issues));
      return;
    }

    await onSubmit(buildProfilePayload(result.data));
  };

  const setField =
    (field: keyof FormState) =>
    (value: string): void =>
      setForm((current) => ({ ...current, [field]: value }));

  const updateField =
    (field: keyof FormState) =>
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
    (field: keyof FormState) =>
    (value: string): void =>
      updateField(field)(normalizeRestrictedDecimalInput(value, { maxIntegerDigits: 3, maxFractionDigits: 1 }));

  return (
    <Card>
      {isLoading ? <p className="soft-text">Cargando perfil...</p> : null}
      {!isLoading && !profile ? <p className="soft-text">No se encontro informacion del perfil.</p> : null}

      {profile ? (
        <form className="profile-form" onSubmit={(event) => void handleSubmit(event)}>
          <label className={`field ${fieldErrors.fullName ? "has-error" : ""}`}>
            <span>Nombre completo</span>
            <input
              type="text"
              value={form.fullName}
              maxLength={100}
              disabled={isSubmitting}
              aria-invalid={fieldErrors.fullName ? "true" : "false"}
              aria-describedby={fieldErrors.fullName ? "profile-full-name-error" : undefined}
              onChange={(event) => updateField("fullName")(event.target.value)}
            />
            {fieldErrors.fullName ? <small id="profile-full-name-error">{fieldErrors.fullName}</small> : null}
          </label>

          <label className="field">
            <span>Correo electronico</span>
            <input type="email" value={form.email} disabled />
          </label>

          <label className={`field ${fieldErrors.birthDate ? "has-error" : ""}`}>
            <span>Fecha de nacimiento</span>
            <input
              type="date"
              value={form.birthDate}
              disabled={isSubmitting}
              aria-invalid={fieldErrors.birthDate ? "true" : "false"}
              aria-describedby={fieldErrors.birthDate ? "profile-birth-date-error" : undefined}
              onChange={(event) => updateField("birthDate")(event.target.value)}
            />
            {fieldErrors.birthDate ? <small id="profile-birth-date-error">{fieldErrors.birthDate}</small> : null}
          </label>

          <label className={`field ${fieldErrors.timezone ? "has-error" : ""}`}>
            <span>Zona horaria</span>
            <select
              value={form.timezone}
              disabled={isSubmitting}
              aria-invalid={fieldErrors.timezone ? "true" : "false"}
              aria-describedby={fieldErrors.timezone ? "profile-timezone-error" : undefined}
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
            {fieldErrors.timezone ? <small id="profile-timezone-error">{fieldErrors.timezone}</small> : null}
          </label>

          <label className={`field ${fieldErrors.hypoglycemiaThreshold ? "has-error" : ""}`}>
            <span>Umbral minimo (mg/dL)</span>
            <input
              type="number"
              step="0.1"
              min="20"
              max="600"
              value={form.hypoglycemiaThreshold}
              disabled={isSubmitting}
              aria-invalid={fieldErrors.hypoglycemiaThreshold ? "true" : "false"}
              aria-describedby={fieldErrors.hypoglycemiaThreshold ? "profile-hypo-error" : undefined}
              onChange={(event) => updateRestrictedDecimalField("hypoglycemiaThreshold")(event.target.value)}
            />
            {fieldErrors.hypoglycemiaThreshold ? <small id="profile-hypo-error">{fieldErrors.hypoglycemiaThreshold}</small> : null}
          </label>

          <label className={`field ${fieldErrors.hyperglycemiaThreshold ? "has-error" : ""}`}>
            <span>Umbral maximo (mg/dL)</span>
            <input
              type="number"
              step="0.1"
              min="20"
              max="600"
              value={form.hyperglycemiaThreshold}
              disabled={isSubmitting}
              aria-invalid={fieldErrors.hyperglycemiaThreshold ? "true" : "false"}
              aria-describedby={fieldErrors.hyperglycemiaThreshold ? "profile-hyper-error" : undefined}
              onChange={(event) => updateRestrictedDecimalField("hyperglycemiaThreshold")(event.target.value)}
            />
            {fieldErrors.hyperglycemiaThreshold ? <small id="profile-hyper-error">{fieldErrors.hyperglycemiaThreshold}</small> : null}
          </label>

          <label className={`field ${fieldErrors.weightKg ? "has-error" : ""}`}>
            <span>Peso (kg)</span>
            <input
              type="number"
              step="0.1"
              min="2"
              max="350"
              value={form.weightKg}
              disabled={isSubmitting}
              aria-invalid={fieldErrors.weightKg ? "true" : "false"}
              aria-describedby={fieldErrors.weightKg ? "profile-weight-error" : undefined}
              onChange={(event) => updateRestrictedDecimalField("weightKg")(event.target.value)}
            />
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
              disabled={isSubmitting}
              aria-invalid={fieldErrors.heightCm ? "true" : "false"}
              aria-describedby={fieldErrors.heightCm ? "profile-height-error" : undefined}
              onChange={(event) => updateRestrictedDecimalField("heightCm")(event.target.value)}
            />
            {fieldErrors.heightCm ? <small id="profile-height-error">{fieldErrors.heightCm}</small> : null}
          </label>

          {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}
          {success ? <p className="form-feedback form-feedback-success">{success}</p> : null}

          <div className="profile-actions">
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      ) : null}
    </Card>
  );
}

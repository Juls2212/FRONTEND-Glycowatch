import { FormEvent, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { ProfileData, UpdateProfilePayload } from "@/features/profile/types";
import { formatTimezoneLabel, getBrowserTimezoneOrDefault, getTimezoneOptions } from "@/lib/timezones";

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

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? Number.NaN : numeric;
}

export function ProfileForm({ profile, isLoading, isSubmitting, error, success, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [validationError, setValidationError] = useState<string | null>(null);
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
    setValidationError(null);

    const hypo = Number(form.hypoglycemiaThreshold);
    const hyper = Number(form.hyperglycemiaThreshold);
    const weight = parseOptionalNumber(form.weightKg);
    const height = parseOptionalNumber(form.heightCm);

    if (!hypo || hypo <= 0 || !hyper || hyper <= 0) {
      setValidationError("Los umbrales de glucosa deben ser mayores a 0.");
      return;
    }
    if (hyper <= hypo) {
      setValidationError("El umbral máximo debe ser mayor que el mínimo.");
      return;
    }
    if (Number.isNaN(weight) || (weight !== null && (weight < 1 || weight > 500))) {
      setValidationError("El peso debe estar entre 1 y 500 kg.");
      return;
    }
    if (Number.isNaN(height) || (height !== null && (height < 30 || height > 300))) {
      setValidationError("La altura debe estar entre 30 y 300 cm.");
      return;
    }

    await onSubmit({
      fullName: form.fullName.trim() ? form.fullName.trim() : null,
      birthDate: form.birthDate || null,
      hypoglycemiaThreshold: hypo,
      hyperglycemiaThreshold: hyper,
      timezone: form.timezone.trim() ? form.timezone.trim() : null,
      weightKg: weight,
      heightCm: height
    });
  };

  const setField =
    (field: keyof FormState) =>
    (value: string): void =>
      setForm((current) => ({ ...current, [field]: value }));

  return (
    <Card>
      {isLoading ? <p className="soft-text">Cargando perfil...</p> : null}
      {!isLoading && !profile ? <p className="soft-text">No se encontró información del perfil.</p> : null}

      {profile ? (
        <form className="profile-form" onSubmit={(event) => void handleSubmit(event)}>
          <label className="field">
            <span>Nombre completo</span>
            <input type="text" value={form.fullName} onChange={(event) => setField("fullName")(event.target.value)} />
          </label>

          <label className="field">
            <span>Correo electrónico</span>
            <input type="email" value={form.email} disabled />
          </label>

          <label className="field">
            <span>Fecha de nacimiento</span>
            <input type="date" value={form.birthDate} onChange={(event) => setField("birthDate")(event.target.value)} />
          </label>

          <label className="field">
            <span>Zona horaria</span>
            <select value={form.timezone} onChange={(event) => setField("timezone")(event.target.value)}>
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
          </label>

          <label className="field">
            <span>Umbral mínimo (mg/dL)</span>
            <input
              type="number"
              step="0.1"
              min="1"
              value={form.hypoglycemiaThreshold}
              onChange={(event) => setField("hypoglycemiaThreshold")(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Umbral máximo (mg/dL)</span>
            <input
              type="number"
              step="0.1"
              min="1"
              value={form.hyperglycemiaThreshold}
              onChange={(event) => setField("hyperglycemiaThreshold")(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Peso (kg)</span>
            <input type="number" step="0.1" min="1" value={form.weightKg} onChange={(event) => setField("weightKg")(event.target.value)} />
          </label>

          <label className="field">
            <span>Altura (cm)</span>
            <input type="number" step="0.1" min="30" value={form.heightCm} onChange={(event) => setField("heightCm")(event.target.value)} />
          </label>

          {validationError ? <p className="error-text">{validationError}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          {success ? <p className="success-text">{success}</p> : null}

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

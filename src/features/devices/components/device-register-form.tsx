import { FormEvent, KeyboardEvent, useState } from "react";
import { Card } from "@/components/ui/card";
import { RegisterDeviceResult } from "@/features/devices/types";
import { normalizeDeviceNameInput, normalizeDeviceNameOnBlur } from "@/lib/forms/input-normalizers";
import { mapZodIssuesToFieldErrors } from "@/lib/validation/errors";
import {
  deviceRegisterSchema,
  ESP32_IDENTIFIER_MAX_LENGTH,
  ESP32_IDENTIFIER_PREFIX,
  formatEsp32IdentifierInput,
  getEsp32IdentifierInputError
} from "@/lib/validation/devices";

type Props = {
  isSubmitting: boolean;
  isLinking: boolean;
  success: string | null;
  error: string | null;
  createdDevice: RegisterDeviceResult | null;
  onRegister: (name: string, identifier: string) => Promise<void>;
  onLinkCreated: (deviceId: number) => Promise<void>;
};

export function DeviceRegisterForm({
  isSubmitting,
  isLinking,
  success,
  error,
  createdDevice,
  onRegister,
  onLinkCreated
}: Props) {
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState(ESP32_IDENTIFIER_PREFIX);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"name" | "identifier", string>>>({});

  const updateIdentifier = (value: string) => {
    const nextValue = formatEsp32IdentifierInput(value);
    const inputError = getEsp32IdentifierInputError(value, nextValue);

    setIdentifier(nextValue);
    setFieldErrors((current) => {
      const next = { ...current };
      if (inputError) next.identifier = inputError;
      else delete next.identifier;
      return next;
    });
  };

  const protectIdentifierMask = (event: KeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const selectionStart = input.selectionStart ?? ESP32_IDENTIFIER_PREFIX.length;
    const selectionEnd = input.selectionEnd ?? ESP32_IDENTIFIER_PREFIX.length;
    const suffixLength = identifier.slice(ESP32_IDENTIFIER_PREFIX.length).length;
    const selectedSuffixLength = Math.max(0, selectionEnd - Math.max(selectionStart, ESP32_IDENTIFIER_PREFIX.length));
    const isControlKey = event.ctrlKey || event.metaKey || event.altKey;

    if (isControlKey || ["Tab", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
      return;
    }

    if ((event.key === "Backspace" && selectionStart <= ESP32_IDENTIFIER_PREFIX.length) || selectionStart < ESP32_IDENTIFIER_PREFIX.length) {
      event.preventDefault();
      return;
    }

    if (event.key === "Delete" && selectionStart < ESP32_IDENTIFIER_PREFIX.length) {
      event.preventDefault();
      return;
    }

    if (event.key.length === 1) {
      if (!/^\d$/.test(event.key) || suffixLength - selectedSuffixLength >= 3) {
        event.preventDefault();
      }
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});

    const result = deviceRegisterSchema.safeParse({
      name,
      identifier
    });

    if (!result.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues));
      return;
    }

    await onRegister(result.data.name, result.data.identifier);
    setName("");
    setIdentifier(ESP32_IDENTIFIER_PREFIX);
  };

  return (
    <Card>
      <form className="devices-form" onSubmit={(event) => void handleSubmit(event)}>
        <label className={`field ${fieldErrors.name ? "has-error" : ""}`}>
          <span>Nombre del dispositivo</span>
          <input
            type="text"
            value={name}
            maxLength={80}
            disabled={isSubmitting}
            aria-invalid={fieldErrors.name ? "true" : "false"}
            aria-describedby={fieldErrors.name ? "device-name-error" : undefined}
            onChange={(event) => {
              setFieldErrors((current) => {
                if (!current.name) return current;
                const next = { ...current };
                delete next.name;
                return next;
              });
              setName(normalizeDeviceNameInput(event.target.value));
            }}
            onBlur={(event) => setName(normalizeDeviceNameOnBlur(event.target.value))}
            placeholder="Ej. Sensor 1"
          />
          {fieldErrors.name ? <small id="device-name-error">{fieldErrors.name}</small> : null}
        </label>

        <label className={`field ${fieldErrors.identifier ? "has-error" : ""}`}>
          <span>Identificador</span>
          <input
            type="text"
            value={identifier}
            maxLength={ESP32_IDENTIFIER_MAX_LENGTH}
            disabled={isSubmitting}
            aria-invalid={fieldErrors.identifier ? "true" : "false"}
            aria-describedby={fieldErrors.identifier ? "device-identifier-error" : "device-identifier-help"}
            onKeyDown={protectIdentifierMask}
            onChange={(event) => updateIdentifier(event.target.value)}
            placeholder="Ej. ESP32-003"
          />
          <small className="field-helper" id="device-identifier-help">
            Escribe solo los 3 numeros finales del ESP32.
          </small>
          {fieldErrors.identifier ? <small id="device-identifier-error">{fieldErrors.identifier}</small> : null}
        </label>

        {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}
        {success ? <p className="form-feedback form-feedback-success">{success}</p> : null}

        <div className="devices-actions">
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Registrando..." : "Registrar dispositivo"}
          </button>
        </div>
      </form>

      {createdDevice ? (
        <div className="device-created-card">
          <p className="metric-label">Nuevo dispositivo</p>
          <p className="soft-text">ID: {createdDevice.deviceId}</p>
          <p className="soft-text">API Key: {createdDevice.apiKey}</p>
          <div className="devices-actions">
            <button
              type="button"
              className="ghost-button"
              disabled={isLinking}
              onClick={() => void onLinkCreated(createdDevice.deviceId)}
            >
              {isLinking ? "Vinculando..." : "Vincular dispositivo creado"}
            </button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

import { FormEvent, useState } from "react";
import { Card } from "@/components/ui/card";
import { RegisterDeviceResult } from "@/features/devices/types";
import { mapZodIssuesToFieldErrors } from "@/lib/validation/errors";
import { deviceRegisterSchema } from "@/lib/validation/devices";

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
  const [identifier, setIdentifier] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"name" | "identifier", string>>>({});

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
    setIdentifier("");
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
              setName(event.target.value);
            }}
            placeholder="Ej. Sensor 1"
          />
          {fieldErrors.name ? <small id="device-name-error">{fieldErrors.name}</small> : null}
        </label>

        <label className={`field ${fieldErrors.identifier ? "has-error" : ""}`}>
          <span>Identificador</span>
          <input
            type="text"
            value={identifier}
            maxLength={120}
            disabled={isSubmitting}
            aria-invalid={fieldErrors.identifier ? "true" : "false"}
            aria-describedby={fieldErrors.identifier ? "device-identifier-error" : undefined}
            onChange={(event) => {
              setFieldErrors((current) => {
                if (!current.identifier) return current;
                const next = { ...current };
                delete next.identifier;
                return next;
              });
              setIdentifier(event.target.value);
            }}
            placeholder="Ej. ESP32-003"
          />
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

import { FormEvent, useState } from "react";
import { Card } from "@/components/ui/card";
import { RegisterDeviceResult } from "@/features/devices/types";

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
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);

    const nextName = name.trim();
    const nextIdentifier = identifier.trim();
    if (!nextName || !nextIdentifier) {
      setValidationError("Completa nombre e identificador.");
      return;
    }
    if (nextName.length > 255 || nextIdentifier.length > 255) {
      setValidationError("Nombre e identificador no pueden superar 255 caracteres.");
      return;
    }

    await onRegister(nextName, nextIdentifier);
    setName("");
    setIdentifier("");
  };

  return (
    <Card>
      <form className="devices-form" onSubmit={(event) => void handleSubmit(event)}>
        <label className="field">
          <span>Nombre del dispositivo</span>
          <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Sensor 1" />
        </label>

        <label className="field">
          <span>Identificador</span>
          <input
            type="text"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="Ej. ESP32-003"
          />
        </label>

        {validationError ? <p className="error-text">{validationError}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {success ? <p className="success-text">{success}</p> : null}

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

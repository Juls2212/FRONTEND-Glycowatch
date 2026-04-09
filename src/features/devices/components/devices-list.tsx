import { Card } from "@/components/ui/card";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
import { DeviceRowActions } from "@/features/devices/components/device-row-actions";
import { DeviceItem } from "@/features/devices/types";

type Props = {
  devices: DeviceItem[];
  isLoading: boolean;
  error: string | null;
  togglingId: number | null;
  onToggle: (deviceId: number) => Promise<void>;
  onRequestDelete: (deviceId: number, deviceName: string) => void;
};

function resolveStatusLabel(status: DeviceItem["status"]): string {
  if (status === "ACTIVE") return "Activo";
  if (status === "DISABLED") return "Deshabilitado";
  return "Registrado";
}

function resolveStatusClass(status: DeviceItem["status"]): string {
  if (status === "ACTIVE") return "status-active";
  if (status === "DISABLED") return "status-disabled";
  return "status-registered";
}

export function DevicesList({ devices, isLoading, error, togglingId, onToggle, onRequestDelete }: Props) {
  return (
    <Card>
      {isLoading ? (
        <div className="skeleton-stack">
          <SkeletonBlock className="skeleton-line w-50" />
          <SkeletonBlock className="skeleton-line w-100" />
          <SkeletonBlock className="skeleton-line w-90" />
        </div>
      ) : null}
      {error ? <FeedbackBanner type="error" message={error} /> : null}

      {!isLoading && !error && devices.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">No hay dispositivos vinculados</p>
          <p className="soft-text">Registra y vincula un dispositivo para comenzar a recibir datos.</p>
        </div>
      ) : null}

      {!isLoading && !error && devices.length > 0 ? (
        <div className="table-wrap">
          <table className="measurements-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Identificador</th>
                <th>Estado</th>
                <th>Activo</th>
                <th>Accion</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id}>
                  <td data-label="Nombre">{device.name}</td>
                  <td data-label="Identificador">{device.identifier}</td>
                  <td data-label="Estado">
                    <span className={`status-pill ${resolveStatusClass(device.status)}`}>{resolveStatusLabel(device.status)}</span>
                  </td>
                  <td data-label="Activo">{device.active ? "Si" : "No"}</td>
                  <td data-label="Accion">
                    <DeviceRowActions
                      deviceId={device.id}
                      deviceName={device.name}
                      active={device.active}
                      isLoading={togglingId === device.id}
                      onToggle={onToggle}
                      onRequestDelete={onRequestDelete}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Card>
  );
}

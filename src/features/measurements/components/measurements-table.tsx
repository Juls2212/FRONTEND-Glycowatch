import { Card } from "@/components/ui/card";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
import { StatePanel } from "@/components/ui/state-panel";
import { MeasurementRowActions } from "@/features/measurements/components/measurement-row-actions";
import { MeasurementItem } from "@/features/measurements/types";

type Props = {
  measurements: MeasurementItem[];
  isLoading: boolean;
  error: string | null;
  deletingId: number | null;
  totalElements: number;
  onDelete: (measurementId: number) => Promise<void>;
};

function resolveOrigin(item: MeasurementItem): string {
  if (item.origin) return item.origin;
  return item.deviceId ? "IOT" : "MANUAL";
}

function resolveOriginLabel(item: MeasurementItem): string {
  return resolveOrigin(item) === "IOT" ? "Dispositivo" : "Manual";
}

export function MeasurementsTable({ measurements, isLoading, error, deletingId, totalElements, onDelete }: Props) {
  return (
    <Card className="measurements-history-card">
      <div className="measurements-table-header">
        <div>
          <p className="measurements-card-eyebrow">Lecturas registradas</p>
          <h3 className="measurements-table-title">Últimos resultados disponibles</h3>
        </div>
        <span className="status-pill status-registered">
          {totalElements > 0 ? `${totalElements} totales` : "Sin registros"}
        </span>
      </div>

      {isLoading ? (
        <StatePanel
          variant="loading"
          title="Cargando mediciones"
          message="Estamos preparando tu historial para que puedas revisarlo con calma."
        >
          <div className="skeleton-stack">
            <SkeletonBlock className="skeleton-line w-40" />
            <SkeletonBlock className="skeleton-line w-100" />
            <SkeletonBlock className="skeleton-line w-100" />
            <SkeletonBlock className="skeleton-line w-80" />
          </div>
        </StatePanel>
      ) : null}
      {error ? <FeedbackBanner type="error" message={error} /> : null}

      {!isLoading && !error && measurements.length === 0 ? (
        <StatePanel
          variant="empty"
          title="Aún no hay mediciones para mostrar"
          message="Cuando registres una lectura o ajustes los filtros, los resultados aparecerán aquí."
        />
      ) : null}

      {!isLoading && !error && measurements.length > 0 ? (
        <div className="table-wrap">
          <table className="measurements-table">
            <thead>
              <tr>
                <th>Lectura</th>
                <th>Fecha</th>
                <th>Origen</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((item) => (
                <tr key={item.id}>
                  <td data-label="Lectura">
                    <div className="measurements-cell-reading">
                      <strong>{item.glucoseValue}</strong>
                      <span>{item.unit}</span>
                    </div>
                  </td>
                  <td data-label="Fecha">
                    <div className="measurements-cell-meta">
                      <strong>{new Date(item.measuredAt).toLocaleDateString("es-CO", { dateStyle: "medium" })}</strong>
                      <span>{new Date(item.measuredAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </td>
                  <td data-label="Origen">
                    <span className={`status-pill ${resolveOrigin(item) === "IOT" ? "status-active" : "status-registered"}`}>
                      {resolveOriginLabel(item)}
                    </span>
                  </td>
                  <td data-label="Estado">
                    <div className="measurements-cell-meta">
                      <strong>{item.isValid ? "Válida" : "Revisar"}</strong>
                      <span>{item.invalidReason ?? "Lectura disponible para seguimiento."}</span>
                    </div>
                  </td>
                  <td data-label="Acción">
                    <MeasurementRowActions
                      measurementId={item.id}
                      isDeleting={deletingId === item.id}
                      onDelete={onDelete}
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

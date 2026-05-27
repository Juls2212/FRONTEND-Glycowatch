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
  onDelete: (measurementId: number) => Promise<void>;
};

function resolveOrigin(item: MeasurementItem): string {
  if (item.origin) return item.origin;
  return item.deviceId ? "IOT" : "MANUAL";
}

export function MeasurementsTable({ measurements, isLoading, error, deletingId, onDelete }: Props) {
  return (
    <Card>
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
                <th>Glucosa</th>
                <th>Unidad</th>
                <th>Fecha</th>
                <th>Origen</th>
                <th>Accion</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((item) => (
                <tr key={item.id}>
                  <td data-label="Glucosa">{item.glucoseValue}</td>
                  <td data-label="Unidad">{item.unit}</td>
                  <td data-label="Fecha">{new Date(item.measuredAt).toLocaleString("es-CO")}</td>
                  <td data-label="Origen">{resolveOrigin(item)}</td>
                  <td data-label="Accion">
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

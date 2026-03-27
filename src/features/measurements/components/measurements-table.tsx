import { Card } from "@/components/ui/card";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
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
        <div className="skeleton-stack">
          <SkeletonBlock className="skeleton-line w-40" />
          <SkeletonBlock className="skeleton-line w-100" />
          <SkeletonBlock className="skeleton-line w-100" />
          <SkeletonBlock className="skeleton-line w-80" />
        </div>
      ) : null}
      {error ? <FeedbackBanner type="error" message={error} /> : null}

      {!isLoading && !error && measurements.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">Sin mediciones disponibles</p>
          <p className="soft-text">Aún no hay resultados para los filtros seleccionados.</p>
        </div>
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
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((item) => (
                <tr key={item.id}>
                  <td>{item.glucoseValue}</td>
                  <td>{item.unit}</td>
                  <td>{new Date(item.measuredAt).toLocaleString("es-CO")}</td>
                  <td>{resolveOrigin(item)}</td>
                  <td>
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

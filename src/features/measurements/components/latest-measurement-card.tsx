import { Card } from "@/components/ui/card";
import { LatestMeasurement, MeasurementItem } from "@/features/measurements/types";

type Props = {
  latestMeasurement: LatestMeasurement | null;
  recentMeasurements: MeasurementItem[];
};

function formatDelta(delta: number | null): string {
  if (delta == null) return "Sin comparación";
  if (Math.abs(delta) < 5) return "Cambio estable";
  return delta > 0 ? `+${delta.toFixed(1)} mg/dL` : `${delta.toFixed(1)} mg/dL`;
}

function resolveTrendLabel(delta: number | null): string {
  if (delta == null) return "Sin tendencia";
  if (Math.abs(delta) < 5) return "Estable";
  return delta > 0 ? "En aumento" : "En descenso";
}

function buildSparklinePoints(values: number[]): string {
  if (values.length === 0) return "";

  const width = 360;
  const height = 120;
  const padding = 10;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);

  return values
    .map((value, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

export function LatestMeasurementCard({ latestMeasurement, recentMeasurements }: Props) {
  const formattedDate = latestMeasurement ? new Date(latestMeasurement.measuredAt).toLocaleString("es-CO") : "Sin registros";
  const recentValues = recentMeasurements.slice(0, 6).map((item) => item.glucoseValue).reverse();
  const previousMeasurement = recentMeasurements[1];
  const delta = latestMeasurement && previousMeasurement ? latestMeasurement.glucoseValue - previousMeasurement.glucoseValue : null;
  const average =
    recentMeasurements.length > 0
      ? recentMeasurements.slice(0, 5).reduce((sum, item) => sum + item.glucoseValue, 0) / Math.min(recentMeasurements.length, 5)
      : null;
  const sparklinePoints = buildSparklinePoints(recentValues);

  return (
    <Card className="measurements-hero-card">
      <div className="measurements-hero-main">
        <div className="measurements-hero-copy">
          <p className="measurements-card-eyebrow">Estado actual</p>
          <h2 className="measurements-hero-title">Última medición registrada</h2>
          <p className="measurements-hero-value">
            {latestMeasurement ? `${latestMeasurement.glucoseValue} ${latestMeasurement.unit}` : "--"}
          </p>
          <div className="measurements-hero-badges">
            <span className="status-pill status-registered">{resolveTrendLabel(delta)}</span>
            <span className="status-pill status-active">{formatDelta(delta)}</span>
          </div>
          <p className="measurements-hero-meta">{formattedDate}</p>
        </div>

        <div className="measurements-hero-visual">
          <div className="measurements-sparkline-head">
            <span className="measurements-sparkline-label">Evolución reciente</span>
            <span className="measurements-sparkline-caption">
              {recentMeasurements.length > 0 ? `${recentMeasurements.length} lecturas cargadas` : "Sin lecturas recientes"}
            </span>
          </div>
          <div className="measurements-sparkline-surface">
            {sparklinePoints ? (
              <svg viewBox="0 0 360 120" className="measurements-sparkline" aria-hidden="true" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="measurements-sparkline-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(var(--accent-rgb), 0.22)" />
                    <stop offset="100%" stopColor="rgba(var(--accent-rgb), 0.02)" />
                  </linearGradient>
                </defs>
                <polyline points={sparklinePoints} fill="none" stroke="rgba(var(--accent-rgb), 0.72)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <polygon
                  points={`10,110 ${sparklinePoints} 350,110`}
                  fill="url(#measurements-sparkline-fill)"
                  opacity="0.95"
                />
              </svg>
            ) : (
              <div className="measurements-sparkline-empty">Aún no hay datos suficientes para mostrar la evolución.</div>
            )}
          </div>
        </div>
      </div>

      <div className="measurements-hero-stats">
        <div className="measurements-hero-stat">
          <span>Promedio visible</span>
          <strong>{average != null ? `${average.toFixed(1)} mg/dL` : "--"}</strong>
        </div>
        <div className="measurements-hero-stat">
          <span>Lectura previa</span>
          <strong>{previousMeasurement ? `${previousMeasurement.glucoseValue} ${previousMeasurement.unit}` : "--"}</strong>
        </div>
        <div className="measurements-hero-stat">
          <span>Lecturas recientes</span>
          <strong>{recentMeasurements.length}</strong>
        </div>
      </div>
    </Card>
  );
}

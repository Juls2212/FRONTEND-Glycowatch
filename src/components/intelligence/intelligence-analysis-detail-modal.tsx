"use client";

import { GlucoseChart } from "@/components/charts/glucose-chart";
import { StatePanel } from "@/components/ui/state-panel";
import {
  formatIntelligenceConfidence,
  formatIntelligenceGeneratedAt,
  getRiskThemeClass,
  translateAgreementStatus,
  translateAssistantMood,
  translateIntelligenceRiskLevel,
  translateIntelligenceTrend,
  translateMeasurementOrigin
} from "@/features/intelligence/display";
import {
  IntelligenceAnalysisDetail,
  IntelligenceDetailMetricValue,
  IntelligenceMeasurementSnapshot
} from "@/features/intelligence/types";
import { ChartPoint } from "@/features/dashboard/types";

type Props = {
  open: boolean;
  detail: IntelligenceAnalysisDetail | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
};

function formatMetricLabel(key: string): string {
  const labels: Record<string, string> = {
    latestValue: "Último valor",
    averageLast24h: "Promedio 24 h",
    averageLast7d: "Promedio 7 días",
    minLast7d: "Mínimo 7 días",
    maxLast7d: "Máximo 7 días",
    variability: "Variabilidad",
    countLast24h: "Lecturas 24 h",
    countLast7d: "Lecturas 7 días",
    manualReadingsCount: "Lecturas manuales",
    hardwareReadingsCount: "Lecturas de dispositivo",
    highReadingsCount: "Lecturas altas",
    lowReadingsCount: "Lecturas bajas",
    recentWindowHours: "Ventana reciente",
    trendWindowDays: "Ventana de tendencia"
  };

  return labels[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function formatMetricValue(value: IntelligenceDetailMetricValue): string {
  if (value == null) return "Sin datos";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "number") return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return String(value);
}

function normalizeMeasurements(measurements: IntelligenceMeasurementSnapshot[]): ChartPoint[] {
  return measurements
    .filter((item) => item.measuredAt && item.glucoseValue != null)
    .map((item) => ({
      measuredAt: item.measuredAt as string,
      glucoseValue: Number(item.glucoseValue)
    }))
    .sort((left, right) => new Date(left.measuredAt).getTime() - new Date(right.measuredAt).getTime());
}

function SnapshotSection({
  title,
  data
}: {
  title: string;
  data: Record<string, unknown>;
}) {
  const entries = Object.entries(data ?? {}).filter(([, value]) => value != null && value !== "");

  return (
    <section className="analysis-detail-section">
      <div className="analysis-detail-section-head">
        <h4 className="analysis-detail-section-title">{title}</h4>
      </div>
      {entries.length === 0 ? (
        <p className="soft-text">No hay datos disponibles para esta sección.</p>
      ) : (
        <div className="analysis-detail-kv-grid">
          {entries.map(([key, value]) => (
            <div key={key} className="analysis-detail-kv-item">
              <span className="metric-label">{formatMetricLabel(key)}</span>
              <strong>
                {Array.isArray(value)
                  ? value.join(", ")
                  : typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value)}
              </strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function IntelligenceAnalysisDetailModal({ open, detail, isLoading, error, onClose }: Props) {
  if (!open) return null;

  const measurementSeries = detail ? normalizeMeasurements(detail.measurements) : [];
  const detailThemeClass = getRiskThemeClass(detail?.finalRiskLevel, detail?.assistantMood);

  return (
    <div className="analysis-detail-overlay" role="dialog" aria-modal="true" aria-label="Detalle de análisis inteligente">
      <div className={`analysis-detail-dialog risk-theme-card ${detailThemeClass}`}>
        <div className="analysis-detail-header">
          <div>
            <p className="hero-eyebrow">Reporte clínico de IA</p>
            <h3 className="analysis-detail-title">Detalle del análisis inteligente</h3>
            <p className="analysis-detail-subtitle">
              Revisión completa del análisis almacenado con contexto de mediciones, interpretación y recomendaciones.
            </p>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {isLoading ? (
          <StatePanel
            variant="loading"
            title="Cargando reporte"
            message="Estamos consultando el análisis completo guardado para esta lectura."
          />
        ) : null}

        {!isLoading && error ? (
          <StatePanel variant="error" title="No se pudo cargar el reporte" message={error} />
        ) : null}

        {!isLoading && !error && detail ? (
          <div className="analysis-detail-body">
            <section className="analysis-detail-overview">
              <div className="analysis-detail-overview-copy">
                <div className="analysis-detail-chip-row">
                  <span className={`metric-chip risk-theme-badge ${detailThemeClass}`}>
                    {translateIntelligenceRiskLevel(detail.finalRiskLevel)}
                  </span>
                  <span className="metric-chip">{translateIntelligenceTrend(detail.trend)}</span>
                  <span className="metric-chip">{translateAssistantMood(detail.assistantMood)}</span>
                </div>
                <p className="analysis-detail-primary-message">{detail.assistantMessage}</p>
                <p className="analysis-detail-explanation">{detail.aiExplanation}</p>
              </div>

              <div className="analysis-detail-overview-panel">
                <div className="analysis-detail-kv-item">
                  <span className="metric-label">Generado</span>
                  <strong>{formatIntelligenceGeneratedAt(detail.generatedAt)}</strong>
                </div>
                <div className="analysis-detail-kv-item">
                  <span className="metric-label">Nivel de acuerdo</span>
                  <strong>{translateAgreementStatus(detail.agreementStatus)}</strong>
                </div>
                <div className="analysis-detail-kv-item">
                  <span className="metric-label">Confianza</span>
                  <strong>{formatIntelligenceConfidence(detail.confidence)}</strong>
                </div>
                <div className="analysis-detail-kv-item">
                  <span className="metric-label">Rango glucémico usado</span>
                  <strong>
                    {detail.hypoglycemiaThreshold ?? "--"} a {detail.hyperglycemiaThreshold ?? "--"} mg/dL
                  </strong>
                </div>
              </div>
            </section>

            <section className="analysis-detail-section">
              <div className="analysis-detail-section-head">
                <h4 className="analysis-detail-section-title">Mediciones utilizadas</h4>
                <p className="analysis-detail-section-copy">
                  {measurementSeries.length > 0
                    ? `${measurementSeries.length} mediciones participaron en este análisis.`
                    : "No hay mediciones almacenadas en este reporte."}
                </p>
              </div>

              {measurementSeries.length > 0 ? (
                <div className="analysis-detail-measurements">
                  <GlucoseChart data={measurementSeries} />
                  <div className="analysis-detail-measurement-list">
                    {detail.measurements.slice(0, 8).map((measurement, index) => (
                      <div key={`${measurement.id ?? "measurement"}-${index}`} className="analysis-detail-measurement-item">
                        <div>
                          <strong>
                            {measurement.glucoseValue ?? "--"} {measurement.unit ?? "mg/dL"}
                          </strong>
                          <span>{measurement.measuredAt ? formatIntelligenceGeneratedAt(measurement.measuredAt) : "Sin fecha"}</span>
                        </div>
                        <div className="analysis-detail-measurement-meta">
                          <span>{translateMeasurementOrigin(measurement.origin)}</span>
                          <span>{measurement.deviceId != null ? `Dispositivo ${measurement.deviceId}` : "Sin dispositivo"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="soft-text">No se registraron mediciones para visualizar en este reporte.</p>
              )}
            </section>

            <section className="analysis-detail-section">
              <div className="analysis-detail-section-head">
                <h4 className="analysis-detail-section-title">Factores detectados y recomendaciones</h4>
              </div>
              <div className="analysis-detail-list-grid">
                <div className="analytics-intelligence-card">
                  <p className="metric-label">Factores detectados</p>
                  {detail.detectedFactors.length > 0 ? (
                    <ul className="analytics-intelligence-list">
                      {detail.detectedFactors.map((factor) => (
                        <li key={factor}>{factor}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="soft-text">No hay factores adicionales registrados.</p>
                  )}
                </div>
                <div className="analytics-intelligence-card">
                  <p className="metric-label">Recomendaciones</p>
                  {detail.recommendations.length > 0 ? (
                    <ul className="analytics-intelligence-list">
                      {detail.recommendations.map((recommendation) => (
                        <li key={recommendation}>{recommendation}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="soft-text">No hay recomendaciones adicionales registradas.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="analysis-detail-section">
              <div className="analysis-detail-section-head">
                <h4 className="analysis-detail-section-title">Métricas del análisis</h4>
              </div>
              <div className="analysis-detail-kv-grid">
                {Object.entries(detail.metrics ?? {}).map(([key, value]) => (
                  <div key={key} className="analysis-detail-kv-item">
                    <span className="metric-label">{formatMetricLabel(key)}</span>
                    <strong>{formatMetricValue(value as IntelligenceDetailMetricValue)}</strong>
                  </div>
                ))}
              </div>
            </section>

            <div className="analysis-detail-report-grid">
              <SnapshotSection title="Motor basado en reglas" data={detail.ruleBasedAnalysis} />
              <SnapshotSection title="IA externa" data={detail.externalAiAnalysis} />
              <SnapshotSection title="Resultado final combinado" data={detail.finalMergedAnalysis} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

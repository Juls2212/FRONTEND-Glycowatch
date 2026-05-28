"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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

type ComparisonItem = {
  key: string;
  title: string;
  badge: string;
  entries: Array<{ label: string; value: string }>;
};

function normalizeMeasurements(measurements: IntelligenceMeasurementSnapshot[]): ChartPoint[] {
  return measurements
    .filter((item) => item.measuredAt && item.glucoseValue != null)
    .map((item) => ({
      measuredAt: item.measuredAt as string,
      glucoseValue: Number(item.glucoseValue)
    }))
    .sort((left, right) => new Date(left.measuredAt).getTime() - new Date(right.measuredAt).getTime());
}

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

function toSnapshotEntries(data: Record<string, unknown> | null | undefined): Array<{ label: string; value: string }> {
  if (!data) return [];

  return Object.entries(data)
    .filter(([, value]) => {
      if (value == null || value === "") return false;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    })
    .map(([key, value]) => ({
      label: formatMetricLabel(key),
      value: Array.isArray(value)
        ? value.join(", ")
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value)
    }));
}

function buildComparisonItems(detail: IntelligenceAnalysisDetail): ComparisonItem[] {
  return [
    {
      key: "rule-based",
      title: "Motor basado en reglas",
      badge: translateIntelligenceRiskLevel(detail.ruleBasedRiskLevel),
      entries: toSnapshotEntries(detail.ruleBasedAnalysis)
    },
    {
      key: "external-ai",
      title: "IA externa",
      badge: translateIntelligenceRiskLevel(detail.externalAiRiskLevel),
      entries: toSnapshotEntries(detail.externalAiAnalysis)
    },
    {
      key: "final-result",
      title: "Resultado final",
      badge: translateIntelligenceRiskLevel(detail.finalRiskLevel),
      entries: toSnapshotEntries(detail.finalMergedAnalysis)
    }
  ].filter((item) => item.entries.length > 0);
}

function buildMetricSummary(metrics: Record<string, IntelligenceDetailMetricValue>) {
  return [
    { key: "latest", label: "Último", value: metrics.latestValue },
    { key: "average", label: "Promedio", value: metrics.averageLast24h ?? metrics.averageLast7d },
    { key: "min", label: "Mínimo", value: metrics.minLast7d },
    { key: "max", label: "Máximo", value: metrics.maxLast7d },
    { key: "count", label: "Lecturas", value: metrics.countLast24h ?? metrics.countLast7d }
  ]
    .filter((item) => item.value != null && item.value !== "")
    .map((item) => ({
      ...item,
      value: formatMetricValue(item.value as IntelligenceDetailMetricValue)
    }));
}

function CompactEmptyState({ message }: { message: string }) {
  return <p className="analysis-detail-empty">{message}</p>;
}

function SectionCard({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="analysis-detail-section">
      <div className="analysis-detail-section-head">
        <h4 className="analysis-detail-section-title">{title}</h4>
        {subtitle ? <p className="analysis-detail-section-copy">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function IntelligenceAnalysisDetailModal({ open, detail, isLoading, error, onClose }: Props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const measurementSeries = useMemo(() => (detail ? normalizeMeasurements(detail.measurements) : []), [detail]);
  const detailThemeClass = getRiskThemeClass(detail?.finalRiskLevel, detail?.assistantMood);
  const metricSummary = useMemo(() => (detail ? buildMetricSummary(detail.metrics ?? {}) : []), [detail]);
  const comparisonItems = useMemo(() => (detail ? buildComparisonItems(detail) : []), [detail]);
  const measurementRows = detail?.measurements.slice(0, 10) ?? [];

  if (!open || !isMounted) return null;

  return createPortal(
    <div
      className="analysis-detail-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Detalle de análisis inteligente"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        padding: "20px",
        overflow: "hidden"
      }}
    >
      <button
        type="button"
        className="analysis-detail-backdrop"
        aria-label="Cerrar reporte"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 9998
        }}
      />
      <div
        className={`analysis-detail-dialog risk-theme-card ${detailThemeClass}`}
        style={{
          position: "relative",
          zIndex: 9999,
          width: "min(1120px, calc(100vw - 40px))",
          maxWidth: "100%",
          maxHeight: "92vh",
          overflow: "hidden",
          background: "var(--surface-panel)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-floating)"
        }}
      >
        <div className="analysis-detail-header">
          <div className="analysis-detail-header-copy">
            <p className="hero-eyebrow">Reporte clínico de IA</p>
            <h3 className="analysis-detail-title">Reporte completo del análisis</h3>
            <p className="analysis-detail-subtitle">
              Consulta la interpretación, los datos utilizados y la comparación final del análisis guardado.
            </p>
          </div>
          {detail ? (
            <div className="analysis-detail-header-meta">
              <span className={`metric-card-badge risk-theme-badge ${detailThemeClass}`}>
                {translateIntelligenceRiskLevel(detail.finalRiskLevel)}
              </span>
              <span className="analysis-detail-generated-at">{formatIntelligenceGeneratedAt(detail.generatedAt)}</span>
            </div>
          ) : null}
          <button type="button" className="ghost-button analysis-detail-close" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {isLoading ? (
          <StatePanel
            variant="loading"
            title="Cargando reporte"
            message="Estamos preparando el análisis completo guardado para esta lectura."
          />
        ) : null}

        {!isLoading && error ? (
          <StatePanel variant="error" title="No se pudo cargar el reporte" message={error} />
        ) : null}

        {!isLoading && !error && detail ? (
          <div className="analysis-detail-body">
            <div className="analysis-detail-report-summary">
              <div className="analysis-detail-report-summary-copy">
                <p className="metric-label">Lectura ejecutiva</p>
                <p className="analysis-detail-primary-message">{detail.assistantMessage}</p>
              </div>
              <div className="analysis-detail-report-summary-grid">
                <div className="analysis-detail-kv-item">
                  <span className="metric-label">Riesgo final</span>
                  <strong>{translateIntelligenceRiskLevel(detail.finalRiskLevel)}</strong>
                </div>
                <div className="analysis-detail-kv-item">
                  <span className="metric-label">Tendencia</span>
                  <strong>{translateIntelligenceTrend(detail.trend)}</strong>
                </div>
                <div className="analysis-detail-kv-item">
                  <span className="metric-label">Confianza</span>
                  <strong>{formatIntelligenceConfidence(detail.confidence)}</strong>
                </div>
              </div>
            </div>

            <div className="analysis-detail-report-layout">
              <div className="analysis-detail-main-stack">
                <SectionCard title="Resumen clínico">
                  <div className="analysis-detail-hero-grid">
                    <div className="analysis-detail-hero-message">
                      <p className="analysis-detail-section-kicker">Interpretación de IA</p>
                      {detail.aiExplanation ? <p className="analysis-detail-explanation">{detail.aiExplanation}</p> : null}
                    </div>
                    <div className="analysis-detail-overview-panel">
                      <div className="analysis-detail-kv-item">
                        <span className="metric-label">Generado</span>
                        <strong>{formatIntelligenceGeneratedAt(detail.generatedAt)}</strong>
                      </div>
                      <div className="analysis-detail-kv-item">
                        <span className="metric-label">Riesgo</span>
                        <strong>{translateIntelligenceRiskLevel(detail.finalRiskLevel)}</strong>
                      </div>
                      <div className="analysis-detail-kv-item">
                        <span className="metric-label">Tendencia</span>
                        <strong>{translateIntelligenceTrend(detail.trend)}</strong>
                      </div>
                      <div className="analysis-detail-kv-item">
                        <span className="metric-label">Confianza</span>
                        <strong>{formatIntelligenceConfidence(detail.confidence)}</strong>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Interpretación principal" subtitle="Lectura clínica general y estado de acuerdo del análisis.">
                  <div className="analysis-detail-interpretation-grid">
                    <div className="analysis-detail-kv-item analysis-detail-kv-wide">
                      <span className="metric-label">Resumen</span>
                      <strong>{detail.summary || "Sin resumen disponible"}</strong>
                    </div>
                    <div className="analysis-detail-kv-item">
                      <span className="metric-label">Nivel de acuerdo</span>
                      <strong>{translateAgreementStatus(detail.agreementStatus)}</strong>
                    </div>
                    <div className="analysis-detail-kv-item">
                      <span className="metric-label">Asistente</span>
                      <strong>{translateAssistantMood(detail.assistantMood)}</strong>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Rango de glucosa usado">
                  <div className="analysis-detail-range-grid">
                    <div className="analysis-detail-range-card">
                      <span className="metric-label">Umbral bajo</span>
                      <strong>{detail.hypoglycemiaThreshold ?? "--"} mg/dL</strong>
                    </div>
                    <div className="analysis-detail-range-card">
                      <span className="metric-label">Umbral alto</span>
                      <strong>{detail.hyperglycemiaThreshold ?? "--"} mg/dL</strong>
                    </div>
                  </div>
                </SectionCard>

                {metricSummary.length > 0 ? (
                  <SectionCard title="Resumen de métricas">
                    <div className="analysis-detail-metric-cards">
                      {metricSummary.map((item) => (
                        <div key={item.key} className="analysis-detail-metric-card">
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                ) : null}

                <SectionCard
                  title="Mediciones usadas"
                  subtitle={
                    measurementSeries.length > 0
                      ? `${measurementSeries.length} mediciones participaron en este análisis.`
                      : "No se guardaron mediciones detalladas en este reporte."
                  }
                >
                  {measurementSeries.length > 0 ? (
                    <div className="analysis-detail-measurements-layout">
                      <div className="analysis-detail-chart-card">
                        <GlucoseChart data={measurementSeries} />
                      </div>
                      <div className="analysis-detail-measurement-table">
                        {measurementRows.map((measurement, index) => (
                          <div key={`${measurement.id ?? "measurement"}-${index}`} className="analysis-detail-measurement-row">
                            <div className="analysis-detail-measurement-cell">
                              <span className="metric-label">Valor</span>
                              <strong>
                                {measurement.glucoseValue ?? "--"} {measurement.unit ?? "mg/dL"}
                              </strong>
                            </div>
                            <div className="analysis-detail-measurement-cell">
                              <span className="metric-label">Fecha</span>
                              <strong>
                                {measurement.measuredAt ? formatIntelligenceGeneratedAt(measurement.measuredAt) : "Sin fecha"}
                              </strong>
                            </div>
                            <div className="analysis-detail-measurement-cell">
                              <span className="metric-label">Origen</span>
                              <strong>{translateMeasurementOrigin(measurement.origin)}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <CompactEmptyState message="No se registraron mediciones detalladas para visualizar en este análisis." />
                  )}
                </SectionCard>

                {detail.detectedFactors.length > 0 ? (
                  <SectionCard title="Factores detectados">
                    <div className="analysis-detail-bullet-grid">
                      {detail.detectedFactors.map((factor, index) => (
                        <div key={factor} className="analysis-detail-bullet-card">
                          <span className="analysis-detail-bullet-index">{index + 1}</span>
                          {factor}
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                ) : null}

                {detail.recommendations.length > 0 ? (
                  <SectionCard title="Recomendaciones">
                    <div className="analysis-detail-bullet-grid">
                      {detail.recommendations.map((recommendation, index) => (
                        <div key={recommendation} className="analysis-detail-bullet-card">
                          <span className="analysis-detail-bullet-index">{index + 1}</span>
                          {recommendation}
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                ) : null}
              </div>

              <aside className="analysis-detail-side-stack">
                {comparisonItems.length > 0 ? (
                  <SectionCard
                    title="Comparación de resultados"
                    subtitle="Vista compacta del análisis interno, la IA externa y el resultado final combinado."
                  >
                    <div className="analysis-detail-comparison-stack">
                      {comparisonItems.map((item) => (
                        <div key={item.key} className="analysis-detail-comparison-card">
                          <div className="analysis-detail-comparison-head">
                            <span className="metric-label">{item.title}</span>
                            <span className={`metric-card-badge risk-theme-badge ${detailThemeClass}`}>{item.badge}</span>
                          </div>
                          <div className="analysis-detail-comparison-grid">
                            {item.entries.map((entry) => (
                              <div key={`${item.key}-${entry.label}`} className="analysis-detail-kv-item">
                                <span className="metric-label">{entry.label}</span>
                                <strong>{entry.value}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                ) : null}

                {Object.keys(detail.metrics ?? {}).length > metricSummary.length ? (
                  <SectionCard title="Métricas adicionales">
                    <div className="analysis-detail-comparison-grid">
                      {Object.entries(detail.metrics ?? {})
                        .filter(([key]) => !["latestValue", "averageLast24h", "averageLast7d", "minLast7d", "maxLast7d", "countLast24h", "countLast7d"].includes(key))
                        .map(([key, value]) => (
                          <div key={key} className="analysis-detail-kv-item">
                            <span className="metric-label">{formatMetricLabel(key)}</span>
                            <strong>{formatMetricValue(value as IntelligenceDetailMetricValue)}</strong>
                          </div>
                        ))}
                    </div>
                  </SectionCard>
                ) : null}
              </aside>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

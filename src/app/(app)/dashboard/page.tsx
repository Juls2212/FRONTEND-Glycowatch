"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  createManualMeasurement,
  fetchAlerts,
  fetchChartData,
  fetchDashboardMetrics,
  fetchRiskAnalysis
} from "@/features/dashboard/api";
import { AlertItem, ChartPoint, DashboardMetrics, RiskAnalysis } from "@/features/dashboard/types";
import { useIntelligenceSummary } from "@/features/intelligence/hooks";
import {
  getIntelligenceAnalysisLabel,
  getIntelligenceAnalysisState,
  getIntelligenceAnalysisStatusLabel,
  getIntelligenceAnalysisStatusMessage,
  getRiskBadgeLabel,
  getRiskThemeClass,
  translateMeasurementOrigin
} from "@/features/intelligence/display";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { GlucoseVisualization } from "@/components/charts/glucose-visualization";
import { IntelligenceAssistantRobot } from "@/components/intelligence/IntelligenceAssistantRobot";
import { ChartRangeFilter } from "@/features/dashboard/components/chart-range-filter";
import { buildChartRangeParams, ChartRange, filterChartByRange } from "@/features/dashboard/chart-range";
import { normalizeRestrictedDecimalInput } from "@/lib/forms/input-normalizers";
import {
  dashboardManualMeasurementSchema,
  toDashboardMeasuredAtISOString
} from "@/lib/validation/measurements";
import { mapZodIssuesToFieldErrors } from "@/lib/validation/errors";
import { fetchLatestMeasurementContext } from "@/features/measurements/api";
import {
  buildSpanishRiskMessage,
  translateRiskLevel,
  translateStatus,
  translateTrend
} from "@/features/dashboard/risk-text";

const RECENT_ALERT_WINDOW_HOURS = 76;
const DASHBOARD_POLLING_INTERVAL_MS = 10_000;

function formatMetric(value: number): string {
  return value.toLocaleString("es-CO", { maximumFractionDigits: 1 });
}

function formatWholeMetric(value: number): string {
  return value.toLocaleString("es-CO", { maximumFractionDigits: 0 });
}

function translateAssistantRiskLevel(value: string): string {
  if (value === "LOW") return "Bajo";
  if (value === "MODERATE") return "Moderado";
  if (value === "HIGH") return "Alto";
  if (value === "CRITICAL") return "Critico";
  if (value === "INSUFFICIENT_DATA") return "Datos insuficientes";
  return "Datos insuficientes";
}

function translateAssistantTrend(value: string): string {
  if (value === "STABLE") return "Estable";
  if (value === "RISING") return "En aumento";
  if (value === "FALLING") return "En descenso";
  if (value === "VARIABLE") return "Variable";
  if (value === "UNKNOWN") return "Sin datos suficientes";
  return "Sin datos suficientes";
}

function translateAgreementStatus(value: string): string {
  if (value === "FULL_AGREEMENT") return "Coincidencia completa";
  if (value === "PARTIAL_AGREEMENT") return "Coincidencia parcial";
  if (value === "DISAGREEMENT") return "Diferencia detectada";
  if (value === "GEMINI_UNAVAILABLE") return "IA externa no disponible";
  if (value === "NOT_APPLICABLE") return "No aplica";
  return "No aplica";
}

type BannerData = {
  variant: "critical" | "warning";
  message: string;
  key: string;
} | null;

function isRecentAlert(alert: AlertItem): boolean {
  const createdAt = new Date(alert.createdAt).getTime();
  if (Number.isNaN(createdAt)) return false;
  const windowMs = RECENT_ALERT_WINDOW_HOURS * 60 * 60 * 1000;
  return Date.now() - createdAt <= windowMs;
}

function resolveBannerData(risk: RiskAnalysis | null, alerts: AlertItem[]): BannerData {
  if (alerts.length === 0) return null;

  const unreadAlerts = alerts.filter((alert) => !alert.isRead);
  const recentAlerts = alerts.filter(isRecentAlert);
  const shouldShow = unreadAlerts.length > 0 || recentAlerts.length > 0;
  if (!shouldShow) return null;

  const hasHighSignals =
    risk?.riskLevel === "HIGH" ||
    risk?.currentStatus === "HIGH" ||
    unreadAlerts.some((alert) => alert.type === "HIGH_GLUCOSE");

  const latestAlertTimestamp = alerts
    .map((alert) => new Date(alert.createdAt).getTime())
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => b - a)[0] ?? 0;

  const key = `${latestAlertTimestamp}|${unreadAlerts.length}|${recentAlerts.length}`;

  if (hasHighSignals) {
    return {
      variant: "critical",
      message: "Riesgo detectado. Tienes alertas activas que requieren atencion.",
      key
    };
  }

  return {
    variant: "warning",
    message: "Tienes alertas recientes. Revisa tu estado para mantener control.",
    key
  };
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos dias";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

function resolveMonitoringToneClass(risk: RiskAnalysis | null): string {
  if (!risk) return "dashboard-tone-neutral";
  if (risk.riskLevel === "HIGH" || risk.currentStatus === "HIGH") return "dashboard-tone-danger";
  if (risk.currentStatus === "LOW") return "dashboard-tone-warning";
  return "dashboard-tone-success";
}

function DashboardSparkline({ data }: { data: ChartPoint[] }) {
  const recentPoints = data.slice(-12);

  const chart = useMemo(() => {
    if (recentPoints.length < 2) return null;

    const width = 240;
    const height = 92;
    const padding = 8;
    const values = recentPoints.map((point) => point.glucoseValue);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, 1);

    const coordinates = recentPoints.map((point, index) => {
      const x = padding + (index / (recentPoints.length - 1)) * (width - padding * 2);
      const y = height - padding - ((point.glucoseValue - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    });

    const linePath = coordinates
      .map((coordinate, index) => `${index === 0 ? "M" : "L"} ${coordinate}`)
      .join(" ");

    const areaPath = `${linePath} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

    return { width, height, linePath, areaPath };
  }, [recentPoints]);

  if (!chart) {
    return (
      <div className="dashboard-mini-graph dashboard-mini-graph-empty">
        <p className="soft-text">Sin suficientes puntos para la vista rapida.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-mini-graph" aria-hidden="true">
      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="dashboard-mini-graph-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="dashboardMiniGraphFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(122, 184, 245, 0.28)" />
            <stop offset="100%" stopColor="rgba(122, 184, 245, 0.02)" />
          </linearGradient>
          <linearGradient id="dashboardMiniGraphLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-strong)" />
          </linearGradient>
        </defs>
        <path d={chart.areaPath} fill="url(#dashboardMiniGraphFill)" />
        <path d={chart.linePath} fill="none" stroke="url(#dashboardMiniGraphLine)" strokeWidth="2.75" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [risk, setRisk] = useState<RiskAnalysis | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartRefreshing, setIsChartRefreshing] = useState(false);
  const [isManualAssistantRefreshing, setIsManualAssistantRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intelligenceRefreshError, setIntelligenceRefreshError] = useState<string | null>(null);
  const [formFieldErrors, setFormFieldErrors] = useState<Partial<Record<"glucoseValue" | "measuredAt", string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [glucoseValueInput, setGlucoseValueInput] = useState("");
  const [measuredAtInput, setMeasuredAtInput] = useState("");
  const [chartRange, setChartRange] = useState<ChartRange>("WEEK");
  const [dismissedBannerKey, setDismissedBannerKey] = useState<string | null>(null);
  const [latestMeasurementOrigin, setLatestMeasurementOrigin] = useState<string | null>(null);
  const isRefreshInFlightRef = useRef(false);
  const chartRangeRef = useRef<ChartRange>("WEEK");
  const hasMountedChartRangeEffectRef = useRef(false);
  const {
    data: intelligenceSummary,
    isLoading: isIntelligenceLoading,
    isRefreshing: isAssistantBackgroundRefreshing,
    error: intelligenceError,
    refresh: refreshAssistantSummary
  } = useIntelligenceSummary({ enabled: false });
  const isAssistantRefreshBusy =
    isManualAssistantRefreshing || isAssistantBackgroundRefreshing || isIntelligenceLoading;
  const isAssistantInitialLoading = isIntelligenceLoading && !intelligenceSummary;

  const loadDashboardData = async (options?: { mountedRef?: { current: boolean }; silent?: boolean }) => {
    const mountedRef = options?.mountedRef;
    const silent = options?.silent ?? false;
    const { from, to } = buildChartRangeParams(chartRangeRef.current);

    if (!silent) {
      setError(null);
    }

    try {
      const [metricsData, chartPoints, riskData, alertsData, latestMeasurementContext] = await Promise.all([
        fetchDashboardMetrics(),
        fetchChartData(from, to),
        fetchRiskAnalysis(),
        fetchAlerts(),
        fetchLatestMeasurementContext()
      ]);

      if (mountedRef && !mountedRef.current) return;
      setMetrics(metricsData);
      setChartData(chartPoints);
      setRisk(riskData);
      setAlerts(alertsData);
      setLatestMeasurementOrigin(latestMeasurementContext?.origin ?? null);
      setError(null);
    } catch (err) {
      if (silent) return;
      const message = err instanceof Error ? err.message : "No se pudieron cargar los datos.";
      if (mountedRef && !mountedRef.current) return;
      setError(message);
    }
  };

  const handleManualAssistantRefresh = async () => {
    if (isAssistantRefreshBusy) return;

    setIsManualAssistantRefreshing(true);
    setIntelligenceRefreshError(null);
    const refreshed = await refreshAssistantSummary({ background: true });
    if (!refreshed.success) {
      setIntelligenceRefreshError("No se pudo actualizar el analisis.");
    }
    setIsManualAssistantRefreshing(false);
  };

  useEffect(() => {
    const mounted = { current: true };

    async function runDashboardRefresh({ silent, withInitialLoading }: { silent: boolean; withInitialLoading?: boolean }) {
      if (isRefreshInFlightRef.current) return;
      isRefreshInFlightRef.current = true;

      if (withInitialLoading) {
        setIsLoading(true);
      }

      try {
        await loadDashboardData({ mountedRef: mounted, silent });
      } finally {
        isRefreshInFlightRef.current = false;
        if (withInitialLoading && mounted.current) {
          setIsLoading(false);
        }
      }
    }

    void runDashboardRefresh({ silent: false, withInitialLoading: true });

    const intervalId = window.setInterval(() => {
      if (!mounted.current) return;
      void runDashboardRefresh({ silent: true });
    }, DASHBOARD_POLLING_INTERVAL_MS);

    return () => {
      mounted.current = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    void refreshAssistantSummary();
  }, [refreshAssistantSummary]);

  useEffect(() => {
    chartRangeRef.current = chartRange;
  }, [chartRange]);

  useEffect(() => {
    if (!hasMountedChartRangeEffectRef.current) {
      hasMountedChartRangeEffectRef.current = true;
      return;
    }

    let mounted = true;

    async function refreshChartForRange() {
      setIsChartRefreshing(true);
      try {
        const { from, to } = buildChartRangeParams(chartRange);
        const chartPoints = await fetchChartData(from, to);
        if (!mounted) return;
        setChartData(chartPoints);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudieron cargar los datos.";
        if (!mounted) return;
        setError(message);
      } finally {
        if (mounted) setIsChartRefreshing(false);
      }
    }

    void refreshChartForRange();
    return () => {
      mounted = false;
    };
  }, [chartRange]);

  const onManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormFieldErrors({});
    setFormError(null);
    setFormSuccess(null);

    const result = dashboardManualMeasurementSchema.safeParse({
      glucoseValue: glucoseValueInput,
      measuredAt: measuredAtInput
    });

    if (!result.success) {
      setFormFieldErrors(mapZodIssuesToFieldErrors(result.error.issues));
      return;
    }

    setIsSubmitting(true);
    try {
      await createManualMeasurement({
        glucoseValue: Number(result.data.glucoseValue),
        unit: "mg/dL",
        measuredAt: toDashboardMeasuredAtISOString(result.data.measuredAt)
      });
      setGlucoseValueInput("");
      setMeasuredAtInput("");
      setFormSuccess("Medicion registrada correctamente.");

      isRefreshInFlightRef.current = true;
      await loadDashboardData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar la medicion.";
      setFormError(message);
    } finally {
      isRefreshInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  const formattedLatest = useMemo(() => {
    if (!metrics?.latestMeasurement) return "Sin datos recientes";
    return new Date(metrics.latestMeasurement.measuredAt).toLocaleString("es-CO");
  }, [metrics?.latestMeasurement]);

  const riskMessage = useMemo(() => {
    if (!risk) return "Sin analisis disponible por el momento.";
    return buildSpanishRiskMessage(risk);
  }, [risk]);

  const filteredChartData = useMemo(() => filterChartByRange(chartData, chartRange), [chartData, chartRange]);
  const bannerData = useMemo(() => resolveBannerData(risk, alerts), [risk, alerts]);
  const unreadAlertsCount = useMemo(() => alerts.filter((alert) => !alert.isRead).length, [alerts]);
  const recentAlerts = useMemo(
    () =>
      [...alerts]
        .filter(isRecentAlert)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3),
    [alerts]
  );
  const latestMeasurementLabel = metrics?.latestMeasurement
    ? `${formatMetric(metrics.latestMeasurement.glucoseValue)} ${metrics.latestMeasurement.unit}`
    : "--";
  const averageLabel = metrics ? `${formatMetric(metrics.averageGlucose)} mg/dL` : "--";
  const rangeSummary = useMemo(() => {
    if (!metrics) return "--";
    return `${formatMetric(metrics.minGlucose)} - ${formatMetric(metrics.maxGlucose)} mg/dL`;
  }, [metrics]);
  const monitoringToneClass = resolveMonitoringToneClass(risk);
  const assistantRiskLabel = intelligenceSummary ? translateAssistantRiskLevel(intelligenceSummary.finalRiskLevel) : "Datos insuficientes";
  const assistantTrendLabel = intelligenceSummary ? translateAssistantTrend(intelligenceSummary.trend) : "Sin datos suficientes";
  const assistantAgreementLabel = intelligenceSummary
    ? translateAgreementStatus(intelligenceSummary.agreementStatus)
    : "No aplica";
  const assistantThemeClass = getRiskThemeClass(
    intelligenceSummary?.finalRiskLevel,
    intelligenceSummary?.assistantMood
  );
  const assistantAnalysisState = getIntelligenceAnalysisState(
    intelligenceSummary?.generatedAt,
    metrics?.latestMeasurement?.measuredAt
  );
  const assistantActionLabel = getIntelligenceAnalysisLabel(assistantAnalysisState);
  const assistantStatusLabel = getIntelligenceAnalysisStatusLabel(assistantAnalysisState);
  const assistantStatusMessage = getIntelligenceAnalysisStatusMessage(assistantAnalysisState);
  const latestMeasurementOriginLabel = translateMeasurementOrigin(latestMeasurementOrigin);
  const primaryInsight = intelligenceSummary?.assistantMessage ?? riskMessage;

  useEffect(() => {
    if (!bannerData) {
      setDismissedBannerKey(null);
      return;
    }
    if (dismissedBannerKey && dismissedBannerKey !== bannerData.key) {
      setDismissedBannerKey(null);
    }
  }, [bannerData, dismissedBannerKey]);

  const isBannerVisible = bannerData != null && dismissedBannerKey !== bannerData.key;

  return (
    <div className="dashboard-grid app-page dashboard-page dashboard-phase-three">
      {isBannerVisible && bannerData ? (
        <div className={`dashboard-alert-banner ${bannerData.variant}`} role="status" aria-live="polite">
          <p className="dashboard-alert-text">{bannerData.message}</p>
          <button
            type="button"
            className="dashboard-alert-close"
            aria-label="Cerrar alerta"
            onClick={() => setDismissedBannerKey(bannerData.key)}
          >
            x
          </button>
        </div>
      ) : null}

      <div className="dashboard-shell-header">
        <div className="dashboard-shell-copy">
          <p className="hero-eyebrow">Monitoreo diario</p>
          <h2 className="dashboard-shell-title">{getGreeting()}, este es tu control de hoy.</h2>
          <p className="dashboard-shell-subtitle">
            Una vista mas calmada para revisar glucosa, tendencia y apoyo inteligente sin fragmentacion innecesaria.
          </p>
        </div>
        <div className="dashboard-shell-actions">
          <span className={`metric-chip ${monitoringToneClass}`}>{risk ? translateStatus(risk.currentStatus) : "Sin lectura"}</span>
          <span className="metric-chip">Alertas activas {formatWholeMetric(unreadAlertsCount)}</span>
          <span className={`metric-chip ${intelligenceSummary?.geminiAvailable ? "ready" : ""}`}>
            {intelligenceSummary?.geminiAvailable ? "IA disponible" : "IA limitada"}
          </span>
        </div>
      </div>

      <div className="dashboard-clinical-hero">
        <Card className={`dashboard-clinical-card risk-theme-card ${assistantThemeClass}`}>
          <div className="dashboard-clinical-top">
            <div className="dashboard-clinical-reading">
              <p className="dashboard-clinical-label">Glucosa actual</p>
              <p className="dashboard-clinical-value">{latestMeasurementLabel}</p>
              <div className="dashboard-clinical-badges">
                <span className={`metric-chip ${monitoringToneClass}`}>Estado {risk ? translateStatus(risk.currentStatus) : "Sin datos"}</span>
                <span className="metric-chip">Tendencia {risk ? translateTrend(risk.trend) : "Sin datos"}</span>
              </div>
              <p className="dashboard-clinical-meta">{formattedLatest}</p>
            </div>

            <div className="dashboard-clinical-graph">
              <div className="dashboard-clinical-graph-head">
                <p className="dashboard-clinical-graph-label">Mini tendencia</p>
                <span className="dashboard-clinical-graph-range">{rangeSummary}</span>
              </div>
              <DashboardSparkline data={filteredChartData} />
            </div>
          </div>

          <div className="dashboard-primary-insight">
            <div>
              <p className="dashboard-primary-insight-label">Insight principal</p>
              <p className="dashboard-primary-insight-copy">{primaryInsight}</p>
            </div>
            <div className="dashboard-primary-insight-summary">
              <span className="dashboard-primary-insight-stat">
                <strong>{averageLabel}</strong>
                <span>Promedio reciente</span>
              </span>
              <span className="dashboard-primary-insight-stat">
                <strong>{formatWholeMetric(metrics?.alertsCount ?? 0)}</strong>
                <span>Eventos totales</span>
              </span>
            </div>
          </div>
        </Card>

        <Card className={`dashboard-assistant-preview risk-theme-card ${assistantThemeClass}`}>
          <div className="dashboard-assistant-preview-head">
            <IntelligenceAssistantRobot
              assistantMood={intelligenceSummary?.assistantMood}
              finalRiskLevel={intelligenceSummary?.finalRiskLevel}
              trend={intelligenceSummary?.trend}
              isLoading={isAssistantInitialLoading}
              className="dashboard-assistant-preview-robot"
            />
            <div className="dashboard-assistant-preview-copy">
              <p className="hero-eyebrow">Glyco Assistant</p>
              <h3 className="dashboard-assistant-preview-title">Resumen inteligente</h3>
              <p className="dashboard-assistant-preview-message">
                {isAssistantInitialLoading
                  ? "Cargando analisis inteligente..."
                  : intelligenceError
                    ? intelligenceError
                    : intelligenceSummary?.assistantMessage ?? "Todavia no hay un analisis generado para tus mediciones."}
              </p>
            </div>
          </div>

          <div className="dashboard-assistant-preview-badges">
            <span className={`metric-chip intelligence-state-badge intelligence-state-${assistantAnalysisState}`}>
              {assistantStatusLabel}
            </span>
            <span className={`metric-chip risk-theme-badge ${assistantThemeClass}`}>
              {intelligenceSummary ? getRiskBadgeLabel(intelligenceSummary.finalRiskLevel) : "Sin datos"}
            </span>
            <span className="metric-chip">Tendencia {assistantTrendLabel}</span>
          </div>

          <div className="dashboard-assistant-preview-panel">
            <p className="dashboard-assistant-preview-panel-title">Contexto del analisis</p>
            <p className="dashboard-assistant-preview-panel-copy">
              {assistantStatusMessage}
            </p>
            <div className="assistant-context-list">
              <span className="assistant-context-item">Origen reciente: {latestMeasurementOriginLabel}</span>
              <span className="assistant-context-item">
                {intelligenceSummary ? `Generado: ${new Date(intelligenceSummary.generatedAt).toLocaleString("es-CO")}` : "Sin analisis previo"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="ghost-button intelligence-refresh-button"
            onClick={handleManualAssistantRefresh}
            disabled={isAssistantRefreshBusy}
          >
            {isManualAssistantRefreshing
              ? assistantAnalysisState === "missing"
                ? "Generando..."
                : "Actualizando..."
              : assistantActionLabel}
          </button>

          {!isAssistantInitialLoading && intelligenceRefreshError ? <p className="soft-text">{intelligenceRefreshError}</p> : null}
          {isManualAssistantRefreshing ? <p className="soft-text intelligence-refresh-status">Actualizando solo el analisis...</p> : null}
        </Card>
      </div>

      <div className="dashboard-monitoring-layout">
        <Section
          title="Monitoreo de glucosa"
          subtitle="Una sola vista principal para explorar el rango seleccionado con mejor contexto clinico."
          action={
            <div className="section-actions">
              <ChartRangeFilter value={chartRange} onChange={setChartRange} />
              {isLoading || isChartRefreshing ? <span className="soft-text">Actualizando...</span> : null}
            </div>
          }
        >
          <Card className="dashboard-monitoring-card">
            <div className="dashboard-monitoring-header">
              <div>
                <p className="chart-card-kicker">Seguimiento principal</p>
                <p className="chart-card-summary">
                  {filteredChartData.length > 0 ? `${filteredChartData.length} mediciones visibles en el periodo actual.` : "No hay datos visibles en el rango seleccionado."}
                </p>
              </div>
              <div className="dashboard-monitoring-summary">
                <span>
                  <strong>{latestMeasurementLabel}</strong>
                  <span>Lectura actual</span>
                </span>
                <span>
                  <strong>{averageLabel}</strong>
                  <span>Promedio</span>
                </span>
                <span>
                  <strong>{rangeSummary}</strong>
                  <span>Rango visible</span>
                </span>
              </div>
            </div>

            {error ? <p className="error-text">{error}</p> : null}
            {!error && filteredChartData.length > 0 ? <GlucoseVisualization data={filteredChartData} defaultView="TREND" /> : null}
            {!error && filteredChartData.length === 0 ? <p className="soft-text">No hay datos en el rango seleccionado.</p> : null}

            <div className="dashboard-monitoring-footer">
              <div className="dashboard-monitoring-footer-stat">
                <strong>{risk ? translateRiskLevel(risk.riskLevel) : "Sin datos"}</strong>
                <span>Riesgo actual</span>
              </div>
              <div className="dashboard-monitoring-footer-stat">
                <strong>{formatWholeMetric(unreadAlertsCount)}</strong>
                <span>Alertas sin leer</span>
              </div>
              <div className="dashboard-monitoring-footer-stat">
                <strong>{assistantAgreementLabel}</strong>
                <span>Estado de IA</span>
              </div>
            </div>
          </Card>
        </Section>

        <div className="dashboard-support-stack">
          <Card className="dashboard-support-card">
            <div className="dashboard-support-card-header">
              <div>
                <p className="metric-label">Lectura clinica</p>
                <p className="metric-card-caption">Sintesis compacta para interpretar el momento actual.</p>
              </div>
              <span className={`metric-chip ${monitoringToneClass}`}>{risk ? translateStatus(risk.currentStatus) : "Sin datos"}</span>
            </div>

            <p className="dashboard-support-card-message">{riskMessage}</p>

            <div className="dashboard-support-stat-list">
              <div className="dashboard-support-stat-row">
                <span>Nivel de riesgo</span>
                <strong>{risk ? translateRiskLevel(risk.riskLevel) : "Sin datos"}</strong>
              </div>
              <div className="dashboard-support-stat-row">
                <span>Tendencia</span>
                <strong>{risk ? translateTrend(risk.trend) : "Sin datos"}</strong>
              </div>
              <div className="dashboard-support-stat-row">
                <span>Riesgo IA</span>
                <strong>{assistantRiskLabel}</strong>
              </div>
            </div>
          </Card>

          <Card className="dashboard-support-card">
            <div className="dashboard-support-card-header">
              <div>
                <p className="metric-label">Alertas recientes</p>
                <p className="metric-card-caption">Eventos mas relevantes para mantener seguimiento inmediato.</p>
              </div>
              <span className="metric-chip">Activas {formatWholeMetric(unreadAlertsCount)}</span>
            </div>

            {recentAlerts.length > 0 ? (
              <div className="dashboard-alert-preview-list">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className={`dashboard-alert-preview-item ${alert.type === "HIGH_GLUCOSE" ? "high" : "low"}`}>
                    <div>
                      <p className="dashboard-alert-preview-title">
                        {alert.type === "HIGH_GLUCOSE" ? "Glucosa alta" : "Glucosa baja"}
                      </p>
                      <p className="dashboard-alert-preview-copy">{alert.message}</p>
                    </div>
                    <span className="dashboard-alert-preview-time">
                      {new Date(alert.createdAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="soft-text">No hay alertas recientes visibles en este momento.</p>
            )}
          </Card>

          <Card className="manual-entry-card dashboard-manual-card">
            <div className="dashboard-support-card-header">
              <div>
                <p className="metric-label">Registro manual</p>
                <p className="metric-card-caption">Agrega una medicion sin salir del panel.</p>
              </div>
            </div>

            <form className="manual-form" onSubmit={onManualSubmit}>
              <label className={`field ${formFieldErrors.glucoseValue ? "has-error" : ""}`}>
                <span>Valor de glucosa (mg/dL)</span>
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="600"
                  value={glucoseValueInput}
                  disabled={isSubmitting}
                  aria-invalid={formFieldErrors.glucoseValue ? "true" : "false"}
                  aria-describedby={formFieldErrors.glucoseValue ? "dashboard-glucose-error" : undefined}
                  onChange={(event) => {
                    setFormFieldErrors((current) => {
                      if (!current.glucoseValue) return current;
                      const next = { ...current };
                      delete next.glucoseValue;
                      return next;
                    });
                    setGlucoseValueInput(normalizeRestrictedDecimalInput(event.target.value, { maxIntegerDigits: 3, maxFractionDigits: 1 }));
                  }}
                  placeholder="Ej. 112.5"
                />
                {formFieldErrors.glucoseValue ? <small id="dashboard-glucose-error">{formFieldErrors.glucoseValue}</small> : null}
              </label>

              <label className={`field ${formFieldErrors.measuredAt ? "has-error" : ""}`}>
                <span>Fecha y hora de medicion</span>
                <input
                  type="datetime-local"
                  max={new Date().toISOString().slice(0, 16)}
                  value={measuredAtInput}
                  disabled={isSubmitting}
                  aria-invalid={formFieldErrors.measuredAt ? "true" : "false"}
                  aria-describedby={formFieldErrors.measuredAt ? "dashboard-measured-at-error" : undefined}
                  onChange={(event) => {
                    setFormFieldErrors((current) => {
                      if (!current.measuredAt) return current;
                      const next = { ...current };
                      delete next.measuredAt;
                      return next;
                    });
                    setMeasuredAtInput(event.target.value);
                  }}
                />
                {formFieldErrors.measuredAt ? <small id="dashboard-measured-at-error">{formFieldErrors.measuredAt}</small> : null}
              </label>

              {formError ? <p className="form-feedback form-feedback-error">{formError}</p> : null}
              {formSuccess ? <p className="form-feedback form-feedback-success">{formSuccess}</p> : null}

              <div className="manual-actions">
                <p className="manual-helper-text">La medicion se agrega al historial y refresca el panel al guardarse.</p>
                <button type="submit" className="primary-button" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar medicion"}
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

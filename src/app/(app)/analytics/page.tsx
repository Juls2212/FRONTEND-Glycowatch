"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { GlucoseVisualization } from "@/components/charts/glucose-visualization";
import { IntelligenceAssistantRobot } from "@/components/intelligence/IntelligenceAssistantRobot";
import { IntelligenceAnalysisDetailModal } from "@/components/intelligence/intelligence-analysis-detail-modal";
import { ContextualAssistantPrompt } from "@/components/intelligence/contextual-assistant-prompt";
import { fetchChartData, fetchDashboardMetrics, fetchRiskAnalysis } from "@/features/dashboard/api";
import { ChartPoint, DashboardMetrics, RiskAnalysis } from "@/features/dashboard/types";
import { ChartRangeFilter } from "@/features/dashboard/components/chart-range-filter";
import { buildChartRangeParams, ChartRange, filterChartByRange } from "@/features/dashboard/chart-range";
import {
  buildSpanishRiskMessage,
  translateRiskLevel,
  translateStatus,
  translateTrend
} from "@/features/dashboard/risk-text";
import {
  formatIntelligenceConfidence,
  formatIntelligenceGeneratedAt,
  getAgreementExplanation,
  getIntelligenceAnalysisLabel,
  getIntelligenceAnalysisState,
  getIntelligenceAnalysisStatusLabel,
  getIntelligenceAnalysisStatusMessage,
  getRiskBadgeLabel,
  getRiskThemeClass,
  translateAgreementStatus,
  translateAssistantMood,
  translateIntelligenceRiskLevel,
  translateIntelligenceTrend,
  translateMeasurementOrigin
} from "@/features/intelligence/display";
import { useIntelligenceHistory, useIntelligenceSummary } from "@/features/intelligence/hooks";
import { generateIntelligenceSummary, getIntelligenceHistoryDetail } from "@/features/intelligence/api";
import { fetchLatestMeasurementContext } from "@/features/measurements/api";
import { useAuthStore } from "@/stores/auth-store";
import { IntelligenceAnalysisDetail } from "@/features/intelligence/types";
import { useContextualAssistantPrompt } from "@/hooks/use-contextual-assistant-prompt";

type InsightKey = "trend" | "predominance" | "stability";
type HistoryLimit = 5 | 10 | "ALL";

function formatMetric(value: number): string {
  return value.toLocaleString("es-CO", { maximumFractionDigits: 1 });
}

function resolveGeneralTrend(filteredData: ChartPoint[]): string {
  if (filteredData.length < 2) return "Sin tendencia concluyente";
  const first = filteredData[0].glucoseValue;
  const last = filteredData[filteredData.length - 1].glucoseValue;
  if (last - first > 8) return "Predominio ascendente";
  if (first - last > 8) return "Predominio descendente";
  return "Comportamiento estable";
}

function resolvePredominance(filteredData: ChartPoint[], average: number): string {
  if (filteredData.length === 0) return "Sin datos suficientes";
  const above = filteredData.filter((point) => point.glucoseValue > average).length;
  const below = filteredData.filter((point) => point.glucoseValue < average).length;
  if (above > below) return "Predominan valores altos frente al promedio";
  if (below > above) return "Predominan valores bajos frente al promedio";
  return "Distribucion equilibrada entre altos y bajos";
}

function resolveStability(filteredData: ChartPoint[]): string {
  const recent = filteredData.slice(-5);
  if (recent.length < 3) return "Estabilidad no concluyente";
  const values = recent.map((point) => point.glucoseValue);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min;
  if (spread <= 20) return "Alta estabilidad reciente";
  if (spread <= 45) return "Estabilidad moderada reciente";
  return "Variabilidad reciente elevada";
}

function buildRecommendations(
  risk: RiskAnalysis | null,
  filteredData: ChartPoint[],
  average: number
): string[] {
  const recommendations: string[] = [];

  if (risk?.riskLevel === "HIGH" || risk?.currentStatus === "HIGH") {
    recommendations.push("Prioriza una revision rapida de tus ultimas mediciones y tu plan de alimentacion.");
  }
  if (risk?.currentStatus === "LOW") {
    recommendations.push("Manten una colacion de seguridad disponible y monitorea de nuevo en breve.");
  }

  if (filteredData.length > 0 && average > 0) {
    const predominance = resolvePredominance(filteredData, average);
    if (predominance.includes("altos")) {
      recommendations.push("Refuerza hidratacion y seguimiento postprandial para reducir picos altos.");
    }
    if (predominance.includes("bajos")) {
      recommendations.push("Evita periodos largos sin ingesta y valida tus horarios de medicion.");
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("Continua con tu rutina actual y manten controles periodicos para sostener estabilidad.");
  }

  return recommendations.slice(0, 3);
}

function InsightIcon({ name }: { name: InsightKey | "risk" | "status" | "latest" }) {
  if (name === "latest") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-svg">
        <path
          d="M12 3.75c-2.95 3.3-5.25 6.34-5.25 9.08A5.25 5.25 0 0 0 12 18.08a5.25 5.25 0 0 0 5.25-5.25C17.25 10.09 14.95 7.05 12 3.75Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "risk") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-svg">
        <path
          d="m12 4 7 13H5L12 4Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M12 9.5v3.5m0 2.5h.01" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "status") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-svg">
        <path
          d="M4.75 12h3.2l2.1-4.2 4.05 8.4 2.05-4.2h3.1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "predominance") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-svg">
        <path
          d="M6 16.75h3.5V9.5H6v7.25Zm4.75 0h3.5V6.75h-3.5v10Zm4.75 0H19v-4.5h-3.5v4.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "stability") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-svg">
        <path
          d="M5 12c2.25-3 4.5-3 7 0s4.75 3 7 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-svg">
      <path
        d="M6 16.5 10 12l2.75 2.75L18 8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14.5 8.5H18v3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default function AnalyticsPage() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [risk, setRisk] = useState<RiskAnalysis | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartRange, setChartRange] = useState<ChartRange>("MONTH");
  const [activeInsight, setActiveInsight] = useState<InsightKey>("trend");
  const [historyLimit, setHistoryLimit] = useState<HistoryLimit>(5);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartRefreshing, setIsChartRefreshing] = useState(false);
  const [isManualIntelligenceRefreshing, setIsManualIntelligenceRefreshing] = useState(false);
  const [latestMeasurementOrigin, setLatestMeasurementOrigin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intelligenceRefreshError, setIntelligenceRefreshError] = useState<string | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  const [historyDetail, setHistoryDetail] = useState<IntelligenceAnalysisDetail | null>(null);
  const [isHistoryDetailLoading, setIsHistoryDetailLoading] = useState(false);
  const [historyDetailError, setHistoryDetailError] = useState<string | null>(null);
  const chartRangeRef = useRef<ChartRange>("MONTH");
  const hasMountedChartRangeEffectRef = useRef(false);
  const isMountedRef = useRef(false);
  const {
    data: intelligenceSummary,
    isLoading: isIntelligenceLoading,
    error: intelligenceError,
    refresh: refreshIntelligenceSummary,
    commitData: commitIntelligenceSummary
  } = useIntelligenceSummary({ enabled: false });
  const {
    data: intelligenceHistoryData,
    isLoading: isIntelligenceHistoryLoading,
    error: intelligenceHistoryError,
    refresh: refreshIntelligenceHistory
  } = useIntelligenceHistory({ enabled: false });
  const intelligenceHistory = useMemo(() => intelligenceHistoryData ?? [], [intelligenceHistoryData]);
  const isIntelligenceInitialLoading = isIntelligenceLoading && !intelligenceSummary;
  const isIntelligenceHistoryInitialLoading =
    isIntelligenceHistoryLoading && intelligenceHistory.length === 0;
  const {
    prompt: assistantPrompt,
    dismissPrompt: dismissAssistantPrompt,
    showPrompt,
    showPromptOnce
  } = useContextualAssistantPrompt();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    chartRangeRef.current = chartRange;
  }, [chartRange]);

  const refreshAnalyticsMeasurements = useCallback(
    async (options?: { mountedRef?: { current: boolean } }) => {
      const mountedRef = options?.mountedRef;
      const { from, to } = buildChartRangeParams(chartRangeRef.current);
      const [metricsResult, riskResult, chartPoints, latestMeasurementContext] = await Promise.all([
        fetchDashboardMetrics(),
        fetchRiskAnalysis(),
        fetchChartData(from, to),
        fetchLatestMeasurementContext().catch(() => null)
      ]);

      if (mountedRef && !mountedRef.current) return;

      setMetrics(metricsResult);
      setRisk(riskResult);
      setChartData(chartPoints);
      setLatestMeasurementOrigin(latestMeasurementContext?.origin ?? null);
      setError(null);
    },
    []
  );

  const refreshIntelligenceData = useCallback(
    async (options?: { background?: boolean }) => {
      const background = options?.background ?? false;
      const [summaryResult, historyResult] = await Promise.all([
        refreshIntelligenceSummary({ background }),
        refreshIntelligenceHistory({ background })
      ]);

      return {
        summarySuccess: summaryResult.success,
        historySuccess: historyResult.success
      };
    },
    [refreshIntelligenceHistory, refreshIntelligenceSummary]
  );

  useEffect(() => {
    if (!isHydrated || !accessToken) {
      return;
    }

    const mounted = { current: true };

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        await refreshAnalyticsMeasurements({ mountedRef: mounted });
        await refreshIntelligenceData();
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo cargar el analisis.";
        if (!mounted.current) return;
        setError(message);
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      mounted.current = false;
    };
  }, [accessToken, isHydrated, refreshAnalyticsMeasurements, refreshIntelligenceData]);

  useEffect(() => {
    if (!hasMountedChartRangeEffectRef.current) {
      hasMountedChartRangeEffectRef.current = true;
      return;
    }

    const mountedRef = { current: true };

    async function refreshChartForRange() {
      setIsChartRefreshing(true);
      try {
        await refreshAnalyticsMeasurements({ mountedRef });
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo cargar el analisis.";
        if (!mountedRef.current) return;
        setError(message);
      } finally {
        if (mountedRef.current) setIsChartRefreshing(false);
      }
    }

    void refreshChartForRange();
    return () => {
      mountedRef.current = false;
    };
  }, [chartRange, refreshAnalyticsMeasurements]);

  const filteredChartData = useMemo(() => filterChartByRange(chartData, chartRange), [chartData, chartRange]);
  const riskMessage = useMemo(() => (risk ? buildSpanishRiskMessage(risk) : "Sin analisis disponible por el momento."), [risk]);
  const latestMeasurementLabel = useMemo(() => {
    if (!metrics?.latestMeasurement) return "Sin datos";
    return `${formatMetric(metrics.latestMeasurement.glucoseValue)} ${metrics.latestMeasurement.unit}`;
  }, [metrics?.latestMeasurement]);
  const latestMeasurementTime = useMemo(() => {
    if (!metrics?.latestMeasurement?.measuredAt) return "Sin registro reciente";
    return new Date(metrics.latestMeasurement.measuredAt).toLocaleString("es-CO");
  }, [metrics?.latestMeasurement?.measuredAt]);

  const conclusions = useMemo(() => {
    const average = metrics?.averageGlucose ?? 0;
    return {
      trend: resolveGeneralTrend(filteredChartData),
      predominance: resolvePredominance(filteredChartData, average),
      stability: resolveStability(filteredChartData)
    };
  }, [filteredChartData, metrics?.averageGlucose]);

  const recommendations = useMemo(
    () => buildRecommendations(risk, filteredChartData, metrics?.averageGlucose ?? 0),
    [risk, filteredChartData, metrics?.averageGlucose]
  );

  const insightCards = useMemo(
    () => [
      {
        key: "trend" as const,
        title: "Tendencia general",
        value: conclusions.trend,
        description: "Lectura sintetica del desplazamiento entre el inicio y el cierre del rango.",
        badge: "Direccion"
      },
      {
        key: "predominance" as const,
        title: "Predominio de valores",
        value: conclusions.predominance,
        description: "Comparacion relativa frente al promedio observado en el periodo filtrado.",
        badge: "Distribucion"
      },
      {
        key: "stability" as const,
        title: "Estabilidad reciente",
        value: conclusions.stability,
        description: "Variacion de las ultimas mediciones disponibles para detectar dispersion.",
        badge: "Ritmo"
      }
    ],
    [conclusions]
  );

  const spotlightInsight = insightCards.find((card) => card.key === activeInsight) ?? insightCards[0];
  const intelligenceFactors = intelligenceSummary?.detectedFactors ?? [];
  const intelligenceRecommendations = intelligenceSummary?.recommendations ?? [];
  const visibleHistory = useMemo(() => {
    if (historyLimit === "ALL") return intelligenceHistory;
    return intelligenceHistory.slice(0, historyLimit);
  }, [historyLimit, intelligenceHistory]);
  const intelligenceThemeClass = getRiskThemeClass(
    intelligenceSummary?.finalRiskLevel,
    intelligenceSummary?.assistantMood
  );
  const intelligenceAnalysisState = getIntelligenceAnalysisState(
    intelligenceSummary?.generatedAt,
    metrics?.latestMeasurement?.measuredAt
  );
  const intelligenceActionLabel = getIntelligenceAnalysisLabel(intelligenceAnalysisState);
  const intelligenceStatusLabel = getIntelligenceAnalysisStatusLabel(intelligenceAnalysisState);
  const intelligenceStatusMessage = getIntelligenceAnalysisStatusMessage(intelligenceAnalysisState);
  const latestMeasurementOriginLabel = translateMeasurementOrigin(latestMeasurementOrigin);

  const handleManualIntelligenceRefresh = useCallback(async () => {
    if (isManualIntelligenceRefreshing || isIntelligenceInitialLoading || isIntelligenceHistoryInitialLoading) return;

    setIsManualIntelligenceRefreshing(true);
    setIntelligenceRefreshError(null);

    try {
      const generatedSummary = await generateIntelligenceSummary();
      commitIntelligenceSummary(generatedSummary);
      await refreshAnalyticsMeasurements();
      const historyResult = await refreshIntelligenceHistory({ background: true });
      if (!historyResult.success) {
        setIntelligenceRefreshError("No se pudo actualizar el análisis.");
      } else {
        showPrompt({
          id: "analytics-analysis-generated",
          tone: "success",
          title: "Análisis generado",
          message: "El reporte inteligente y su historial ya fueron actualizados con las mediciones más recientes."
        });
      }
    } catch (error) {
      console.error("Analytics manual intelligence refresh failed.", error);
      setIntelligenceRefreshError("No se pudo actualizar el análisis.");
    } finally {
      if (isMountedRef.current) {
        setIsManualIntelligenceRefreshing(false);
      }
    }
  }, [
    commitIntelligenceSummary,
    isIntelligenceHistoryInitialLoading,
    isIntelligenceInitialLoading,
    isManualIntelligenceRefreshing,
    refreshAnalyticsMeasurements,
    refreshIntelligenceHistory,
    showPrompt
  ]);

  const handleOpenHistoryDetail = useCallback(async (historyId: number) => {
    setSelectedHistoryId(historyId);
    setHistoryDetail(null);
    setHistoryDetailError(null);
    setIsHistoryDetailLoading(true);

    try {
      const detail = await getIntelligenceHistoryDetail(historyId);
      if (!isMountedRef.current) return;
      setHistoryDetail(detail);
    } catch (detailError) {
      console.error("Analytics history detail request failed.", detailError);
      if (!isMountedRef.current) return;
      setHistoryDetailError("No se pudo cargar el reporte completo del análisis.");
    } finally {
      if (isMountedRef.current) {
        setIsHistoryDetailLoading(false);
      }
    }
  }, []);

  const handleCloseHistoryDetail = useCallback(() => {
    setSelectedHistoryId(null);
    setHistoryDetail(null);
    setHistoryDetailError(null);
    setIsHistoryDetailLoading(false);
  }, []);

  useEffect(() => {
    if (isIntelligenceInitialLoading) return;
    if (intelligenceAnalysisState !== "missing") return;

    showPromptOnce({
      id: "assistant-before-first-analysis",
      title: "Todavía no hay análisis clínico",
      message: "Puedes generarlo manualmente cuando quieras para obtener interpretación, factores detectados y recomendaciones sobre tus mediciones."
    });
  }, [intelligenceAnalysisState, isIntelligenceInitialLoading, showPromptOnce]);

  return (
    <div className="dashboard-grid app-page analytics-page">
      <ContextualAssistantPrompt prompt={assistantPrompt} onDismiss={dismissAssistantPrompt} />
      <div className="analytics-hero">
        <Card className="analytics-hero-card analytics-hero-primary">
          <div className="analytics-hero-copy">
            <div>
              <p className="hero-eyebrow">Modulo de analisis</p>
              <h2 className="hero-title">Lectura visual para interpretar tendencia, riesgo y estabilidad sin perder contexto.</h2>
              <p className="hero-description">
                Usa esta vista para combinar la grafica, el estado actual y los hallazgos clave en una sola experiencia analitica.
              </p>
            </div>

            <div className="hero-pill-row">
              <span className="hero-pill">Última medición: {latestMeasurementLabel}</span>
              <span className="hero-pill">Tendencia: {risk ? translateTrend(risk.trend) : "ESTABLE"}</span>
            </div>
          </div>

          <div className="analytics-overview-grid">
            <div className="analytics-overview-card">
              <div className="analytics-overview-header">
                <span className="metric-icon-badge info" aria-hidden="true">
                  <InsightIcon name="latest" />
                </span>
                <div>
                  <p className="metric-label">Última medición</p>
                  <p className="metric-card-caption">Referencia operativa inmediata</p>
                </div>
              </div>
              <p className="analytics-overview-value">{latestMeasurementLabel}</p>
              <p className="metric-meta">{latestMeasurementTime}</p>
            </div>

            <div className="analytics-overview-card">
              <div className="analytics-overview-header">
                <span className="metric-icon-badge warning" aria-hidden="true">
                  <InsightIcon name="risk" />
                </span>
                <div>
                  <p className="metric-label">Nivel de riesgo</p>
                  <p className="metric-card-caption">Contexto de lectura actual</p>
                </div>
              </div>
              <p className="analytics-overview-value">{risk ? translateRiskLevel(risk.riskLevel) : "BAJO"}</p>
              <p className="metric-meta">Estado: {risk ? translateStatus(risk.currentStatus) : "EN RANGO"}</p>
            </div>
          </div>
        </Card>

        <Card className="analytics-hero-card analytics-hero-side">
          <div className="analytics-side-header">
            <span className="metric-icon-badge success" aria-hidden="true">
              <InsightIcon name="status" />
            </span>
            <div>
              <p className="metric-label">Lectura clinica</p>
              <p className="metric-card-caption">Interpretacion sintetica del estado actual</p>
            </div>
          </div>
          <p className="analytics-side-value">{risk ? translateStatus(risk.currentStatus) : "EN RANGO"}</p>
          <p className="risk-message">{riskMessage}</p>
        </Card>
      </div>

      <Section title="Exploracion de tendencia" subtitle="Visualizacion interactiva con el mismo rango temporal del seguimiento" action={<ChartRangeFilter value={chartRange} onChange={setChartRange} />}>
        <Card className="chart-card analytics-chart-card">
          {isLoading && chartData.length === 0 ? <p className="soft-text">Cargando analisis...</p> : null}
          {!isLoading && isChartRefreshing ? <p className="soft-text">Actualizando grafica...</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          {!isLoading && !error && filteredChartData.length > 0 ? <GlucoseVisualization data={filteredChartData} defaultView="TREND" /> : null}
          {!isLoading && !error && filteredChartData.length === 0 ? (
            <p className="soft-text">No hay datos en el rango seleccionado.</p>
          ) : null}
        </Card>
      </Section>

      <div className="analytics-main-grid">
        <Section title="Insight principal" subtitle="El hallazgo mas relevante se presenta primero para facilitar interpretacion">
          <Card className="analytics-spotlight-card">
            <div className="analytics-spotlight-header">
              <div className="analytics-spotlight-title">
                <span className="metric-icon-badge info" aria-hidden="true">
                  <InsightIcon name={spotlightInsight.key} />
                </span>
                <div>
                  <p className="metric-label">{spotlightInsight.title}</p>
                  <p className="metric-card-caption">Vista destacada del periodo filtrado</p>
                </div>
              </div>
              <span className="metric-card-badge">{spotlightInsight.badge}</span>
            </div>

            <p className="analytics-spotlight-value">{spotlightInsight.value}</p>
            <p className="analytics-spotlight-copy">{spotlightInsight.description}</p>

            <div className="analytics-insight-switcher" role="tablist" aria-label="Selector de insight">
              {insightCards.map((insight) => (
                <button
                  key={insight.key}
                  type="button"
                  className={`analytics-insight-tab ${activeInsight === insight.key ? "active" : ""}`}
                  onClick={() => setActiveInsight(insight.key)}
                  aria-pressed={activeInsight === insight.key}
                >
                  <span className="analytics-insight-tab-title">{insight.title}</span>
                  <span className="analytics-insight-tab-value">{insight.badge}</span>
                </button>
              ))}
            </div>
          </Card>
        </Section>

        <Section title="Lectura de estado" subtitle="Senales secundarias para ubicar el momento clinico actual">
          <div className="analytics-side-grid">
            <Card className="analytics-mini-card">
              <div className="analytics-mini-header">
                <span className="metric-icon-badge info" aria-hidden="true">
                  <InsightIcon name="status" />
                </span>
                <p className="metric-label">Estado actual</p>
              </div>
              <p className="analytics-mini-value">{risk ? translateStatus(risk.currentStatus) : "EN RANGO"}</p>
              <p className="soft-text">Condicion actual derivada del ultimo analisis disponible.</p>
            </Card>

            <Card className="analytics-mini-card">
              <div className="analytics-mini-header">
                <span className="metric-icon-badge warning" aria-hidden="true">
                  <InsightIcon name="risk" />
                </span>
                <p className="metric-label">Nivel de riesgo</p>
              </div>
              <p className="analytics-mini-value">{risk ? translateRiskLevel(risk.riskLevel) : "BAJO"}</p>
              <p className="soft-text">Tendencia: {risk ? translateTrend(risk.trend) : "ESTABLE"}</p>
            </Card>
          </div>
        </Section>
      </div>

      <Section title="Recomendaciones" subtitle="Acciones practicas presentadas como guia operativa y no solo como texto plano">
        <div className="analytics-recommendations-grid">
          {recommendations.map((item, index) => (
            <Card key={item} className="analytics-recommendation-card">
              <div className="analytics-recommendation-header">
                <span className="analytics-step-badge">{index + 1}</span>
                <p className="metric-label">Accion sugerida</p>
              </div>
              <p className="analytics-recommendation-copy">{item}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Conclusiones e insights" subtitle="Resumen visual para comparar hallazgos sin sentir bloques pesados de texto">
        <div className="analytics-conclusion-grid">
          {insightCards.map((insight) => (
            <Card key={insight.key} className={`analytics-conclusion-card ${activeInsight === insight.key ? "active" : ""}`}>
              <div className="analytics-conclusion-header">
                <span className="metric-icon-badge info" aria-hidden="true">
                  <InsightIcon name={insight.key} />
                </span>
                <span className="metric-card-badge">{insight.badge}</span>
              </div>
              <p className="metric-label">{insight.title}</p>
              <p className="analytics-conclusion-value">{insight.value}</p>
              <p className="soft-text">{insight.description}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="Analisis inteligente"
        subtitle="Resumen interpretativo generado con el sistema de inteligencia clinica disponible"
        action={
          <button
            type="button"
            className="ghost-button intelligence-refresh-button"
            onClick={handleManualIntelligenceRefresh}
            disabled={
              isManualIntelligenceRefreshing || isIntelligenceInitialLoading || isIntelligenceHistoryInitialLoading
            }
          >
            {isManualIntelligenceRefreshing ? (intelligenceAnalysisState === "missing" ? "Generando..." : "Actualizando...") : intelligenceActionLabel}
          </button>
        }
      >
        {isIntelligenceInitialLoading ? (
          <Card className="analytics-intelligence-card">
            <IntelligenceAssistantRobot isLoading className="analytics-intelligence-robot" />
            <p className="soft-text">Cargando analisis inteligente...</p>
          </Card>
        ) : null}

        {!isIntelligenceInitialLoading && intelligenceError ? (
          <Card className="analytics-intelligence-card">
            <p className="error-text">{intelligenceError}</p>
          </Card>
        ) : null}

        {!isIntelligenceInitialLoading && !intelligenceError && !intelligenceSummary ? (
          <Card className="analytics-intelligence-card">
            <IntelligenceAssistantRobot className="analytics-intelligence-robot" />
            <div className="analytics-intelligence-empty-copy">
              <p className="metric-label">Analisis pendiente</p>
              <p className="soft-text">Todavia no hay un analisis generado. Puedes solicitarlo cuando quieras.</p>
            </div>
            <button
              type="button"
              className="ghost-button intelligence-refresh-button"
              onClick={handleManualIntelligenceRefresh}
              disabled={isManualIntelligenceRefreshing}
            >
              {isManualIntelligenceRefreshing ? "Generando..." : "Generar analisis"}
            </button>
          </Card>
        ) : null}

        {!isIntelligenceInitialLoading && !intelligenceError && intelligenceSummary ? (
          <div className="analytics-intelligence-stack">
            <div className="analytics-intelligence-grid">
              <Card className={`analytics-intelligence-card analytics-intelligence-primary risk-theme-card ${intelligenceThemeClass}`}>
                <div className="analytics-intelligence-hero">
                  <IntelligenceAssistantRobot
                    assistantMood={intelligenceSummary.assistantMood}
                    finalRiskLevel={intelligenceSummary.finalRiskLevel}
                    trend={intelligenceSummary.trend}
                    className="analytics-intelligence-robot"
                  />
                  <div className="analytics-intelligence-header">
                    <div>
                      <p className="metric-label">Analisis inteligente</p>
                      <p className="metric-card-caption">Análisis inteligente generado a partir de tus mediciones recientes.</p>
                    </div>
                    <div className="analytics-intelligence-state-row">
                      <span className={`metric-chip intelligence-state-badge intelligence-state-${intelligenceAnalysisState}`}>
                        {intelligenceStatusLabel}
                      </span>
                      <span className={`metric-card-badge risk-theme-badge ${intelligenceThemeClass}`}>
                        {getRiskBadgeLabel(intelligenceSummary.finalRiskLevel)}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="analytics-intelligence-message">{intelligenceSummary.assistantMessage}</p>
                <p className="analytics-intelligence-explanation">{intelligenceSummary.aiExplanation}</p>
                <div className="assistant-context-list">
                  <span className="assistant-context-item">{intelligenceStatusMessage}</span>
                  <span className="assistant-context-item">Origen reciente: {latestMeasurementOriginLabel}</span>
                </div>
                {isManualIntelligenceRefreshing ? (
                  <p className="soft-text intelligence-refresh-status">Actualizando solo el análisis...</p>
                ) : null}
              </Card>

              <Card className="analytics-intelligence-card analytics-intelligence-comparison">
                <div className="analytics-intelligence-header">
                  <div>
                    <p className="metric-label">Detalles del análisis</p>
                    <p className="metric-card-caption">Referencia técnica secundaria del resultado generado.</p>
                  </div>
                  <span className="metric-card-badge">Detalle</span>
                </div>
                <p className="analytics-comparison-copy">
                  Análisis inteligente generado a partir de tus mediciones recientes.
                </p>
                <p className="analytics-intelligence-details-label">Comparación de riesgo</p>
                <div className="analytics-intelligence-metadata-grid">
                  <div className={`analytics-intelligence-meta-item risk-theme-panel ${getRiskThemeClass(intelligenceSummary.ruleBasedRiskLevel)}`}>
                    <span className="metric-label">Motor basado en reglas</span>
                    <span className={`metric-card-badge risk-theme-badge ${getRiskThemeClass(intelligenceSummary.ruleBasedRiskLevel)}`}>
                      {translateIntelligenceRiskLevel(intelligenceSummary.ruleBasedRiskLevel)}
                    </span>
                  </div>
                  <div className={`analytics-intelligence-meta-item risk-theme-panel ${getRiskThemeClass(intelligenceSummary.geminiRiskLevel)}`}>
                    <span className="metric-label">IA externa</span>
                    <span className={`metric-card-badge risk-theme-badge ${getRiskThemeClass(intelligenceSummary.geminiRiskLevel)}`}>
                      {translateIntelligenceRiskLevel(intelligenceSummary.geminiRiskLevel)}
                    </span>
                  </div>
                  <div className={`analytics-intelligence-meta-item risk-theme-panel ${intelligenceThemeClass}`}>
                    <span className="metric-label">Riesgo final</span>
                    <span className={`metric-card-badge risk-theme-badge ${intelligenceThemeClass}`}>
                      {translateIntelligenceRiskLevel(intelligenceSummary.finalRiskLevel)}
                    </span>
                  </div>
                  <div className={`analytics-intelligence-meta-item risk-theme-panel ${intelligenceThemeClass}`}>
                    <span className="metric-label">Nivel de acuerdo</span>
                    <strong>{translateAgreementStatus(intelligenceSummary.agreementStatus)}</strong>
                  </div>
                </div>
                <p className="analytics-comparison-note">{getAgreementExplanation(intelligenceSummary.agreementStatus)}</p>
              </Card>
            </div>

            <div className="analytics-intelligence-grid analytics-intelligence-secondary">
              <Card className="analytics-intelligence-card">
                <div className="analytics-intelligence-header">
                  <div>
                    <p className="metric-label">Factores detectados</p>
                    <p className="metric-card-caption">Aspectos identificados como relevantes para la lectura actual</p>
                  </div>
                </div>
                {intelligenceFactors.length > 0 ? (
                  <ul className="analytics-intelligence-list">
                    {intelligenceFactors.map((factor) => (
                      <li key={factor}>{factor}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="soft-text">No se detectaron factores adicionales en este momento.</p>
                )}
              </Card>

              <Card className="analytics-intelligence-card">
                <div className="analytics-intelligence-header">
                  <div>
                    <p className="metric-label">Recomendaciones</p>
                    <p className="metric-card-caption">Acciones sugeridas a partir del analisis generado</p>
                  </div>
                </div>
                {intelligenceRecommendations.length > 0 ? (
                  <ul className="analytics-intelligence-list">
                    {intelligenceRecommendations.map((recommendation) => (
                      <li key={recommendation}>{recommendation}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="soft-text">No hay recomendaciones adicionales disponibles.</p>
                )}
              </Card>

              <Card className="analytics-intelligence-card">
                <div className="analytics-intelligence-header">
                  <div>
                    <p className="metric-label">Metadatos del analisis</p>
                    <p className="metric-card-caption">Indicadores de generacion y disponibilidad del sistema</p>
                  </div>
                </div>
                <div className="analytics-intelligence-metadata-grid">
                  <div className="analytics-intelligence-meta-item">
                    <span className="metric-label">Confianza</span>
                    <strong>{formatIntelligenceConfidence(intelligenceSummary.confidence)}</strong>
                  </div>
                  <div className="analytics-intelligence-meta-item">
                    <span className="metric-label">Tendencia</span>
                    <strong>{translateIntelligenceTrend(intelligenceSummary.trend)}</strong>
                  </div>
                  <div className="analytics-intelligence-meta-item">
                    <span className="metric-label">Generado</span>
                    <strong>{formatIntelligenceGeneratedAt(intelligenceSummary.generatedAt)}</strong>
                  </div>
                  <div className="analytics-intelligence-meta-item">
                    <span className="metric-label">IA externa</span>
                    <strong>{intelligenceSummary.geminiAvailable ? "Disponible" : "No disponible"}</strong>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : null}

        {!isIntelligenceInitialLoading && !isIntelligenceHistoryInitialLoading && intelligenceRefreshError ? (
          <p className="soft-text">{intelligenceRefreshError}</p>
        ) : null}
      </Section>

      <Section
        title="Historial de análisis inteligente"
        subtitle="Evolución reciente de los análisis generados por GlycoWatch."
        action={
          <div className="analytics-history-filter" role="tablist" aria-label="Filtro de historial inteligente">
            {([
              { value: 5 as const, label: "Últimos 5" },
              { value: 10 as const, label: "Últimos 10" },
              { value: "ALL" as const, label: "Todos" }
            ]).map((option) => (
              <button
                key={option.label}
                type="button"
                className={`analytics-history-filter-button ${historyLimit === option.value ? "active" : ""}`}
                onClick={() => setHistoryLimit(option.value)}
                aria-pressed={historyLimit === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      >
        {isIntelligenceHistoryInitialLoading ? (
          <Card className="analytics-intelligence-card">
            <p className="soft-text">Cargando historial de análisis...</p>
          </Card>
        ) : null}

        {!isIntelligenceHistoryInitialLoading && intelligenceHistoryError ? (
          <Card className="analytics-intelligence-card">
            <p className="error-text">{intelligenceHistoryError}</p>
          </Card>
        ) : null}

        {!isIntelligenceHistoryInitialLoading && !intelligenceHistoryError && intelligenceHistory.length === 0 ? (
          <Card className="analytics-intelligence-card">
            <p className="soft-text">Aún no hay análisis guardados.</p>
          </Card>
        ) : null}

        {!isIntelligenceHistoryInitialLoading && !intelligenceHistoryError && intelligenceHistory.length > 0 ? (
          <div className="analytics-history-list">
            {visibleHistory.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`analytics-history-card analytics-history-trigger risk-theme-card ${getRiskThemeClass(item.finalRiskLevel, item.assistantMood)}`}
                onClick={() => void handleOpenHistoryDetail(item.id)}
              >
                <div className="analytics-history-header">
                  <div className="analytics-history-title">
                    <span className={`metric-card-badge risk-theme-badge ${getRiskThemeClass(item.finalRiskLevel, item.assistantMood)}`}>
                      {translateIntelligenceRiskLevel(item.finalRiskLevel)}
                    </span>
                    <p className="metric-card-caption">{formatIntelligenceGeneratedAt(item.createdAt)}</p>
                  </div>
                  <div className="analytics-history-tags">
                    <span className="analytics-history-tag">{translateIntelligenceTrend(item.trend)}</span>
                    <span className="analytics-history-tag">{translateAssistantMood(item.assistantMood)}</span>
                  </div>
                </div>

                <p className="analytics-history-summary" title={item.summary}>
                  {item.summary}
                </p>

                <div className="analytics-history-footer">
                  <p className="analytics-history-caption">Toca para abrir el reporte clínico completo.</p>
                  <span className="analytics-history-trend">{translateIntelligenceTrend(item.trend)}</span>
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </Section>

      <IntelligenceAnalysisDetailModal
        open={selectedHistoryId != null}
        detail={historyDetail}
        isLoading={isHistoryDetailLoading}
        error={historyDetailError}
        onClose={handleCloseHistoryDetail}
      />
    </div>
  );
}


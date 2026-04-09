"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { GlucoseVisualization } from "@/components/charts/glucose-visualization";
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

type InsightKey = "trend" | "predominance" | "stability";

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
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [risk, setRisk] = useState<RiskAnalysis | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartRange, setChartRange] = useState<ChartRange>("MONTH");
  const [activeInsight, setActiveInsight] = useState<InsightKey>("trend");
  const [isLoading, setIsLoading] = useState(true);
  const [isChartRefreshing, setIsChartRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasMountedChartRangeEffectRef = useRef(false);

  useEffect(() => {
    const mounted = { current: true };
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [metricsData, riskData, chartPoints] = await Promise.all([
          fetchDashboardMetrics(),
          fetchRiskAnalysis(),
          fetchChartData(buildChartRangeParams(chartRange).from, buildChartRangeParams(chartRange).to)
        ]);
        if (!mounted.current) return;
        setMetrics(metricsData);
        setRisk(riskData);
        setChartData(chartPoints);
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo cargar el analisis.";
        if (!mounted.current) return;
        setError(message);
      } finally {
        if (mounted.current) setIsLoading(false);
      }
    }

    void load();
    return () => {
      mounted.current = false;
    };
  }, []);

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
        const message = err instanceof Error ? err.message : "No se pudo cargar el analisis.";
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

  return (
    <div className="dashboard-grid analytics-page">
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
              <span className="hero-pill">Ultima medicion: {latestMeasurementLabel}</span>
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
                  <p className="metric-label">Ultima medicion</p>
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
    </div>
  );
}

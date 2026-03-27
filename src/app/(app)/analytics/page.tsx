"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { GlucoseChart } from "@/components/charts/glucose-chart";
import { fetchChartData, fetchDashboardMetrics, fetchRiskAnalysis } from "@/features/dashboard/api";
import { ChartPoint, DashboardMetrics, RiskAnalysis } from "@/features/dashboard/types";
import { ChartRangeFilter } from "@/features/dashboard/components/chart-range-filter";
import { ChartRange, filterChartByRange } from "@/features/dashboard/chart-range";
import {
  buildSpanishRiskMessage,
  translateRiskLevel,
  translateStatus,
  translateTrend
} from "@/features/dashboard/risk-text";

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
  return "Distribución equilibrada entre altos y bajos";
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
    recommendations.push("Prioriza una revisión rápida de tus últimas mediciones y tu plan de alimentación.");
  }
  if (risk?.currentStatus === "LOW") {
    recommendations.push("Mantén una colación de seguridad disponible y monitorea de nuevo en breve.");
  }

  if (filteredData.length > 0 && average > 0) {
    const predominance = resolvePredominance(filteredData, average);
    if (predominance.includes("altos")) {
      recommendations.push("Refuerza hidratación y seguimiento postprandial para reducir picos altos.");
    }
    if (predominance.includes("bajos")) {
      recommendations.push("Evita periodos largos sin ingesta y valida tus horarios de medición.");
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("Continúa con tu rutina actual y mantén controles periódicos para sostener estabilidad.");
  }

  return recommendations.slice(0, 3);
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [risk, setRisk] = useState<RiskAnalysis | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartRange, setChartRange] = useState<ChartRange>("MONTH");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mounted = { current: true };
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [metricsData, riskData, chartPoints] = await Promise.all([
          fetchDashboardMetrics(),
          fetchRiskAnalysis(),
          fetchChartData()
        ]);
        if (!mounted.current) return;
        setMetrics(metricsData);
        setRisk(riskData);
        setChartData(chartPoints);
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo cargar el análisis.";
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

  const filteredChartData = useMemo(() => filterChartByRange(chartData, chartRange), [chartData, chartRange]);
  const riskMessage = useMemo(() => (risk ? buildSpanishRiskMessage(risk) : "Sin análisis disponible por el momento."), [risk]);
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

  return (
    <div className="dashboard-grid">
      <Section title="Análisis de glucosa" subtitle="Panel dedicado para revisión de tendencias y comportamiento reciente">
        <div className="stat-grid">
          <Card>
            <p className="metric-label">Última medición</p>
            <p className="metric-value">{latestMeasurementLabel}</p>
            <p className="metric-meta">{latestMeasurementTime}</p>
          </Card>
          <Card>
            <p className="metric-label">Promedio</p>
            <p className="metric-value">{formatMetric(metrics?.averageGlucose ?? 0)} mg/dL</p>
            <p className="metric-meta">Ventana de análisis</p>
          </Card>
          <Card>
            <p className="metric-label">Mínimo</p>
            <p className="metric-value">{formatMetric(metrics?.minGlucose ?? 0)} mg/dL</p>
            <p className="metric-meta">Valor más bajo observado</p>
          </Card>
          <Card>
            <p className="metric-label">Máximo</p>
            <p className="metric-value">{formatMetric(metrics?.maxGlucose ?? 0)} mg/dL</p>
            <p className="metric-meta">Valor más alto observado</p>
          </Card>
        </div>
      </Section>

      <Section
        title="Gráfica de tendencia"
        subtitle="Comportamiento reciente filtrado por rango temporal"
        action={<ChartRangeFilter value={chartRange} onChange={setChartRange} />}
      >
        <Card>
          {isLoading ? <p className="soft-text">Cargando análisis...</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          {!isLoading && !error && filteredChartData.length > 0 ? <GlucoseChart data={filteredChartData} /> : null}
          {!isLoading && !error && filteredChartData.length === 0 ? (
            <p className="soft-text">No hay datos en el rango seleccionado.</p>
          ) : null}
        </Card>
      </Section>

      <Section title="Interpretación clínica" subtitle="Lectura basada en los datos actuales y nivel de riesgo">
        <div className="analytics-grid">
          <Card>
            <p className="metric-label">Estado actual</p>
            <p className="metric-value">{risk ? translateStatus(risk.currentStatus) : "EN RANGO"}</p>
            <p className="soft-text">{riskMessage}</p>
          </Card>
          <Card>
            <p className="metric-label">Nivel de riesgo</p>
            <p className="metric-value">{risk ? translateRiskLevel(risk.riskLevel) : "BAJO"}</p>
            <p className="soft-text">Tendencia: {risk ? translateTrend(risk.trend) : "ESTABLE"}</p>
          </Card>
        </div>
      </Section>

      <Section title="Recomendaciones" subtitle="Acciones prácticas para tu seguimiento diario">
        <Card>
          <ul className="insights-list">
            {recommendations.map((item) => (
              <li key={item} className="insight-item">
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section title="Conclusiones e insights" subtitle="Resumen analítico de tu comportamiento reciente">
        <div className="analytics-grid">
          <Card>
            <p className="metric-label">Tendencia general</p>
            <p className="metric-value">{conclusions.trend}</p>
            <p className="soft-text">Evaluación del cambio entre inicio y final del rango.</p>
          </Card>
          <Card>
            <p className="metric-label">Predominio de valores</p>
            <p className="metric-value">{conclusions.predominance}</p>
            <p className="soft-text">Comparación relativa con el promedio observado.</p>
          </Card>
          <Card>
            <p className="metric-label">Estabilidad reciente</p>
            <p className="metric-value">{conclusions.stability}</p>
            <p className="soft-text">Variación de las últimas mediciones disponibles.</p>
          </Card>
        </div>
      </Section>
    </div>
  );
}


"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createManualMeasurement,
  fetchAlerts,
  fetchChartData,
  fetchDashboardMetrics,
  fetchRiskAnalysis
} from "@/features/dashboard/api";
import { AlertItem, ChartPoint, DashboardMetrics, RiskAnalysis } from "@/features/dashboard/types";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { GlucoseChart } from "@/components/charts/glucose-chart";
import { ChartRangeFilter } from "@/features/dashboard/components/chart-range-filter";
import { ChartRange, filterChartByRange } from "@/features/dashboard/chart-range";
import {
  buildSpanishRiskMessage,
  translateRiskLevel,
  translateStatus,
  translateTrend
} from "@/features/dashboard/risk-text";

const RECENT_ALERT_WINDOW_HOURS = 76;

function formatMetric(value: number): string {
  return value.toLocaleString("es-CO", { maximumFractionDigits: 1 });
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
      message: "Riesgo detectado. Tienes alertas activas que requieren atención.",
      key
    };
  }

  return {
    variant: "warning",
    message: "Tienes alertas recientes. Revisa tu estado para mantener control.",
    key
  };
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [risk, setRisk] = useState<RiskAnalysis | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [glucoseValueInput, setGlucoseValueInput] = useState("");
  const [measuredAtInput, setMeasuredAtInput] = useState("");
  const [chartRange, setChartRange] = useState<ChartRange>("WEEK");
  const [dismissedBannerKey, setDismissedBannerKey] = useState<string | null>(null);

  const loadDashboardData = async (mountedRef?: { current: boolean }) => {
    setError(null);
    try {
      const [metricsData, chartPoints, riskData, alertsData] = await Promise.all([
        fetchDashboardMetrics(),
        fetchChartData(),
        fetchRiskAnalysis(),
        fetchAlerts()
      ]);
      if (mountedRef && !mountedRef.current) return;
      setMetrics(metricsData);
      setChartData(chartPoints);
      setRisk(riskData);
      setAlerts(alertsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudieron cargar los datos.";
      if (mountedRef && !mountedRef.current) return;
      setError(message);
    }
  };

  useEffect(() => {
    const mounted = { current: true };
    async function load() {
      setIsLoading(true);
      await loadDashboardData(mounted);
      if (mounted.current) setIsLoading(false);
    }

    void load();
    return () => {
      mounted.current = false;
    };
  }, []);

  const onManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const glucoseValue = Number(glucoseValueInput);
    if (!glucoseValue || glucoseValue <= 0) {
      setFormError("Ingresa un valor de glucosa válido.");
      return;
    }
    if (!measuredAtInput) {
      setFormError("Selecciona fecha y hora de medición.");
      return;
    }

    setIsSubmitting(true);
    try {
      const measuredAt = new Date(measuredAtInput);
      if (Number.isNaN(measuredAt.getTime())) {
        setFormError("La fecha y hora de medición no son válidas.");
        setIsSubmitting(false);
        return;
      }
      if (measuredAt.getTime() > Date.now()) {
        setFormError("La fecha y hora de medición no pueden estar en el futuro.");
        setIsSubmitting(false);
        return;
      }

      await createManualMeasurement({
        glucoseValue,
        unit: "mg/dL",
        measuredAt: measuredAt.toISOString()
      });
      setGlucoseValueInput("");
      setMeasuredAtInput("");
      setFormSuccess("Medición registrada correctamente.");
      await loadDashboardData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar la medición.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedLatest = useMemo(() => {
    if (!metrics?.latestMeasurement) return "Sin datos recientes";
    const date = new Date(metrics.latestMeasurement.measuredAt);
    return date.toLocaleString("es-CO");
  }, [metrics?.latestMeasurement]);

  const riskMessage = useMemo(() => {
    if (!risk) return "Sin análisis disponible por el momento.";
    return buildSpanishRiskMessage(risk);
  }, [risk]);

  const filteredChartData = useMemo(() => filterChartByRange(chartData, chartRange), [chartData, chartRange]);
  const bannerData = useMemo(() => resolveBannerData(risk, alerts), [risk, alerts]);

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
    <div className="dashboard-grid">
      {isBannerVisible && bannerData ? (
        <div className={`dashboard-alert-banner ${bannerData.variant}`} role="status" aria-live="polite">
          <p className="dashboard-alert-text">{bannerData.message}</p>
          <button
            type="button"
            className="dashboard-alert-close"
            aria-label="Cerrar alerta"
            onClick={() => setDismissedBannerKey(bannerData.key)}
          >
            ×
          </button>
        </div>
      ) : null}

      <Section title="Resumen clínico" subtitle="Indicadores recientes para seguimiento inmediato">
        {error ? <p className="error-text">{error}</p> : null}
        <div className="stat-grid">
          <Card>
            <p className="metric-label">Última medición</p>
            <p className="metric-value">
              {metrics?.latestMeasurement ? `${formatMetric(metrics.latestMeasurement.glucoseValue)} ${metrics.latestMeasurement.unit}` : "--"}
            </p>
            <p className="metric-meta">{formattedLatest}</p>
          </Card>

          <Card>
            <p className="metric-label">Promedio reciente</p>
            <p className="metric-value">{formatMetric(metrics?.averageGlucose ?? 0)} mg/dL</p>
            <p className="metric-meta">Ventana reciente</p>
          </Card>

          <Card>
            <p className="metric-label">Mínimo / Máximo</p>
            <p className="metric-value">
              {formatMetric(metrics?.minGlucose ?? 0)} / {formatMetric(metrics?.maxGlucose ?? 0)}
            </p>
            <p className="metric-meta">Valores recientes</p>
          </Card>

          <Card>
            <p className="metric-label">Total de alertas</p>
            <p className="metric-value">{formatMetric(metrics?.alertsCount ?? 0)}</p>
            <p className="metric-meta">Eventos registrados</p>
          </Card>
        </div>
      </Section>

      <Section
        title="Tendencia glucémica"
        subtitle="Últimas mediciones válidas para visualización rápida"
        action={
          <div className="section-actions">
            <ChartRangeFilter value={chartRange} onChange={setChartRange} />
            {isLoading ? <span className="soft-text">Cargando...</span> : null}
          </div>
        }
      >
        <Card>
          {filteredChartData.length > 0 ? (
            <GlucoseChart data={filteredChartData} />
          ) : (
            <p className="soft-text">No hay datos en el rango seleccionado.</p>
          )}
        </Card>
      </Section>

      <Section title="Estado de riesgo" subtitle="Evaluación actual basada en tus datos recientes">
        <Card>
          <div className="risk-grid">
            <div>
              <p className="metric-label">Estado actual</p>
              <p className="metric-value">{risk ? translateStatus(risk.currentStatus) : "EN RANGO"}</p>
            </div>
            <div>
              <p className="metric-label">Nivel de riesgo</p>
              <p className="metric-value">{risk ? translateRiskLevel(risk.riskLevel) : "BAJO"}</p>
            </div>
            <div>
              <p className="metric-label">Tendencia</p>
              <p className="metric-value">{risk ? translateTrend(risk.trend) : "ESTABLE"}</p>
            </div>
          </div>
          <p className="risk-message">{riskMessage}</p>
        </Card>
      </Section>

      <Section title="Alertas recientes" subtitle="Vista rápida de los últimos eventos detectados">
        <Card>
          {alerts.length === 0 ? (
            <p className="soft-text">No hay alertas registradas.</p>
          ) : (
            <ul className="alerts-list">
              {alerts.slice(0, 6).map((alert) => (
                <li key={alert.id} className="alert-row">
                  <div>
                    <p className="alert-type">{alert.type === "HIGH_GLUCOSE" ? "Glucosa alta" : "Glucosa baja"}</p>
                    <p className="alert-message">{alert.message}</p>
                  </div>
                  <div className={`alert-badge ${alert.isRead ? "read" : "unread"}`}>
                    {alert.isRead ? "Leída" : "Nueva"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Section>

      <Section title="Registro manual" subtitle="Añade una medición sin usar el dispositivo IoT">
        <Card>
          <form className="manual-form" onSubmit={onManualSubmit}>
            <label className="field">
              <span>Valor de glucosa (mg/dL)</span>
              <input
                type="number"
                step="0.1"
                min="1"
                value={glucoseValueInput}
                onChange={(event) => setGlucoseValueInput(event.target.value)}
                placeholder="Ej. 112.5"
              />
            </label>

            <label className="field">
              <span>Fecha y hora de medición</span>
              <input
                type="datetime-local"
                max={new Date().toISOString().slice(0, 16)}
                value={measuredAtInput}
                onChange={(event) => setMeasuredAtInput(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Unidad</span>
              <input type="text" value="mg/dL" disabled />
            </label>

            {formError ? <p className="error-text">{formError}</p> : null}
            {formSuccess ? <p className="success-text">{formSuccess}</p> : null}

            <div className="manual-actions">
              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar medición"}
              </button>
            </div>
          </form>
        </Card>
      </Section>
    </div>
  );
}


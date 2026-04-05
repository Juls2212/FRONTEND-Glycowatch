"use client";

import Link from "next/link";
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

function formatWholeMetric(value: number): string {
  return value.toLocaleString("es-CO", { maximumFractionDigits: 0 });
}

function formatAlertType(type: AlertItem["type"]): string {
  return type === "HIGH_GLUCOSE" ? "Glucosa alta" : "Glucosa baja";
}

function resolveAlertTone(type: AlertItem["type"]): "danger" | "info" {
  return type === "HIGH_GLUCOSE" ? "danger" : "info";
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
      setFormError("Ingresa un valor de glucosa valido.");
      return;
    }
    if (!measuredAtInput) {
      setFormError("Selecciona fecha y hora de medicion.");
      return;
    }

    setIsSubmitting(true);
    try {
      const measuredAt = new Date(measuredAtInput);
      if (Number.isNaN(measuredAt.getTime())) {
        setFormError("La fecha y hora de medicion no son validas.");
        setIsSubmitting(false);
        return;
      }
      if (measuredAt.getTime() > Date.now()) {
        setFormError("La fecha y hora de medicion no pueden estar en el futuro.");
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
      setFormSuccess("Medicion registrada correctamente.");
      await loadDashboardData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar la medicion.";
      setFormError(message);
    } finally {
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
  const latestMeasurementLabel = metrics?.latestMeasurement
    ? `${formatMetric(metrics.latestMeasurement.glucoseValue)} ${metrics.latestMeasurement.unit}`
    : "--";
  const rangeSummary = useMemo(() => {
    if (!metrics) return "--";
    return `${formatMetric(metrics.minGlucose)} - ${formatMetric(metrics.maxGlucose)} mg/dL`;
  }, [metrics]);
  const recentAlerts = useMemo(
    () =>
      [...alerts]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3),
    [alerts]
  );

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
    <div className="dashboard-grid dashboard-page">
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

      <div className="dashboard-hero">
        <Card className="dashboard-hero-card dashboard-hero-primary">
          <div className="dashboard-hero-copy">
            <div>
              <p className="hero-eyebrow">Resumen inmediato</p>
              <h2 className="hero-title">Lectura clinica rapida para priorizar decisiones y contexto.</h2>
              <p className="hero-description">
                Consulta el estado actual, el rango reciente y el volumen de alertas desde una sola cabecera.
              </p>
            </div>

            <div className="hero-pill-row">
              <span className="hero-pill">Ultima medicion: {latestMeasurementLabel}</span>
              <span className="hero-pill">Alertas nuevas: {formatWholeMetric(unreadAlertsCount)}</span>
            </div>
          </div>

          <div className="hero-metrics">
            <div className="hero-metric-card">
              <p className="metric-label">Ultimo registro</p>
              <p className="hero-metric-value">{latestMeasurementLabel}</p>
              <p className="metric-meta">{formattedLatest}</p>
            </div>

            <div className="hero-metric-card">
              <p className="metric-label">Rango reciente</p>
              <p className="hero-metric-value">{rangeSummary}</p>
              <p className="metric-meta">Minimo y maximo observados</p>
            </div>
          </div>
        </Card>

        <div className="dashboard-hero-aside">
          <Card className="dashboard-hero-card dashboard-hero-side dashboard-context-card">
            <div className="dashboard-context-row">
              <div>
                <p className="metric-label">Estado actual</p>
                <p className="hero-side-value">{risk ? translateStatus(risk.currentStatus) : "EN RANGO"}</p>
              </div>
              <div className="dashboard-context-meta">
                <span className="metric-chip">Riesgo {risk ? translateRiskLevel(risk.riskLevel) : "BAJO"}</span>
                <span className="metric-chip">Tendencia {risk ? translateTrend(risk.trend) : "ESTABLE"}</span>
              </div>
            </div>
            <p className="metric-meta">Referencia compacta para interpretar la lectura principal sin duplicar bloques.</p>
          </Card>
        </div>
      </div>

      <Section title="Resumen clinico" subtitle="Indicadores recientes organizados para escaneo rapido">
        {error ? <p className="error-text">{error}</p> : null}
        <div className="stat-grid dashboard-stat-grid">
          <Card className="metric-card">
            <div className="metric-card-top">
              <p className="metric-label">Ultima medicion</p>
              <span className="metric-chip">Ahora</span>
            </div>
            <p className="metric-value">{latestMeasurementLabel}</p>
            <p className="metric-meta">{formattedLatest}</p>
          </Card>

          <Card className="metric-card">
            <div className="metric-card-top">
              <p className="metric-label">Promedio reciente</p>
              <span className="metric-chip">mg/dL</span>
            </div>
            <p className="metric-value">{formatMetric(metrics?.averageGlucose ?? 0)}</p>
            <p className="metric-meta">Ventana reciente</p>
          </Card>

          <Card className="metric-card">
            <div className="metric-card-top">
              <p className="metric-label">Minimo / Maximo</p>
              <span className="metric-chip">Rango</span>
            </div>
            <p className="metric-value">
              {formatMetric(metrics?.minGlucose ?? 0)} / {formatMetric(metrics?.maxGlucose ?? 0)}
            </p>
            <p className="metric-meta">Variacion observada</p>
          </Card>

          <Card className="metric-card">
            <div className="metric-card-top">
              <p className="metric-label">Total de alertas</p>
              <span className="metric-chip">Eventos</span>
            </div>
            <p className="metric-value">{formatWholeMetric(metrics?.alertsCount ?? 0)}</p>
            <p className="metric-meta">Eventos registrados</p>
          </Card>
        </div>
      </Section>

      <div className="dashboard-main-grid dashboard-main-grid-single-aside">
        <Section
          title="Tendencia glucemica"
          subtitle="Visualizacion central para seguir el comportamiento reciente"
          action={
            <div className="section-actions">
              <ChartRangeFilter value={chartRange} onChange={setChartRange} />
              {isLoading ? <span className="soft-text">Cargando...</span> : null}
            </div>
          }
        >
          <Card className="chart-card">
            <div className="chart-card-header">
              <div>
                <p className="chart-card-kicker">Comportamiento del rango seleccionado</p>
                <p className="chart-card-summary">
                  {filteredChartData.length > 0 ? `${filteredChartData.length} mediciones visibles` : "Sin datos visibles"}
                </p>
              </div>
            </div>

            {filteredChartData.length > 0 ? (
              <GlucoseChart data={filteredChartData} />
            ) : (
              <p className="soft-text">No hay datos en el rango seleccionado.</p>
            )}
          </Card>
        </Section>

        <Section title="Insights" subtitle="Senales secundarias para interpretar el comportamiento reciente">
          <Card className="risk-card">
            <div className="risk-grid">
              <div className="risk-stat">
                <p className="metric-label">Estado actual</p>
                <p className="metric-value">{risk ? translateStatus(risk.currentStatus) : "EN RANGO"}</p>
              </div>
              <div className="risk-stat">
                <p className="metric-label">Nivel de riesgo</p>
                <p className="metric-value">{risk ? translateRiskLevel(risk.riskLevel) : "BAJO"}</p>
              </div>
              <div className="risk-stat">
                <p className="metric-label">Tendencia</p>
                <p className="metric-value">{risk ? translateTrend(risk.trend) : "ESTABLE"}</p>
              </div>
            </div>
            <p className="risk-message">{riskMessage}</p>
          </Card>
        </Section>
      </div>

      <div className="dashboard-secondary-grid">
        <Section title="Registro manual" subtitle="Entrada rapida para anadir una medicion sin salir del panel">
          <Card className="manual-entry-card">
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
                <span>Fecha y hora de medicion</span>
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
                <p className="manual-helper-text">El registro se agrega al historial y actualiza el panel al guardarse.</p>
                <button type="submit" className="primary-button" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar medicion"}
                </button>
              </div>
            </form>
          </Card>
        </Section>

        <Section
          title="Actividad de alertas"
          subtitle="Resumen breve para mantener contexto sin competir con el analisis principal"
          action={
            <Link href="/alerts" className="notification-link">
              Ver todas
            </Link>
          }
        >
          <Card className="alerts-card dashboard-alerts-compact">
            <div className="dashboard-alerts-summary">
              <div className="dashboard-alerts-summary-item">
                <p className="metric-label">Nuevas</p>
                <p className="metric-value">{formatWholeMetric(unreadAlertsCount)}</p>
              </div>
              <div className="dashboard-alerts-summary-item">
                <p className="metric-label">Totales</p>
                <p className="metric-value">{formatWholeMetric(metrics?.alertsCount ?? 0)}</p>
              </div>
            </div>

            {recentAlerts.length > 0 ? (
              <ul className="dashboard-alerts-list">
                {recentAlerts.map((alert) => (
                  <li key={alert.id} className="dashboard-alerts-item">
                    <div className="dashboard-alerts-item-main">
                      <span className={`notification-dot ${resolveAlertTone(alert.type)}`} aria-hidden="true" />
                      <div className="notification-copy">
                        <div className="notification-meta">
                          <p className="notification-item-title">{formatAlertType(alert.type)}</p>
                          <span className={`alert-badge ${alert.isRead ? "read" : "unread"}`}>
                            {alert.isRead ? "Leida" : "Nueva"}
                          </span>
                        </div>
                        <p className="notification-item-message">{alert.message}</p>
                        <p className="soft-text">{new Date(alert.createdAt).toLocaleString("es-CO")}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="soft-text">No hay alertas recientes.</p>
            )}
          </Card>
        </Section>
      </div>
    </div>
  );
}

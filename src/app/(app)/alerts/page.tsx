"use client";

import { useEffect, useMemo, useState } from "react";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { AlertsList } from "@/features/alerts/components/alerts-list";
import { fetchAlerts, markAlertAsRead } from "@/features/alerts/api";
import { AlertItem } from "@/features/alerts/types";
import { FeedbackBanner } from "@/components/ui/feedback-banner";

type AlertFilter = "ALL" | "UNREAD" | "HIGH" | "LOW";

function sortAlerts(alerts: AlertItem[]): AlertItem[] {
  return [...alerts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function applyFilter(alerts: AlertItem[], filter: AlertFilter): AlertItem[] {
  if (filter === "UNREAD") {
    return alerts.filter((alert) => !alert.isRead);
  }
  if (filter === "HIGH") {
    return alerts.filter((alert) => alert.type === "HIGH_GLUCOSE");
  }
  if (filter === "LOW") {
    return alerts.filter((alert) => alert.type === "LOW_GLUCOSE");
  }
  return alerts;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<AlertFilter>("ALL");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadAlerts = async (mountedRef?: { current: boolean }) => {
    setError(null);
    try {
      const alertsData = await fetchAlerts();
      if (mountedRef && !mountedRef.current) return;
      setAlerts(sortAlerts(alertsData));
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudieron cargar las alertas.";
      if (mountedRef && !mountedRef.current) return;
      setError(message);
    }
  };

  useEffect(() => {
    const mounted = { current: true };
    async function initialize() {
      setIsLoading(true);
      await loadAlerts(mounted);
      if (mounted.current) setIsLoading(false);
    }
    void initialize();
    return () => {
      mounted.current = false;
    };
  }, []);

  const onMarkAsRead = async (alertId: number) => {
    setError(null);
    setSuccess(null);
    setIsUpdatingId(alertId);
    try {
      await markAlertAsRead(alertId);
      await loadAlerts();
      setSuccess("La alerta fue marcada como leída.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar la alerta.";
      setError(message);
    } finally {
      setIsUpdatingId(null);
    }
  };

  const summary = useMemo(() => {
    const total = alerts.length;
    const high = alerts.filter((item) => item.type === "HIGH_GLUCOSE").length;
    const low = alerts.filter((item) => item.type === "LOW_GLUCOSE").length;
    const unread = alerts.filter((item) => !item.isRead).length;
    return { total, high, low, unread };
  }, [alerts]);

  const filteredAlerts = useMemo(() => applyFilter(alerts, activeFilter), [alerts, activeFilter]);

  return (
    <div className="dashboard-grid">
      <Section title="Alertas" subtitle="Historial completo de eventos de glucosa">
        {success ? <FeedbackBanner type="success" message={success} /> : null}
        {error ? <FeedbackBanner type="error" message={error} /> : null}

        <div className="stat-grid">
          <Card>
            <p className="metric-label">Total de alertas</p>
            <p className="metric-value">{summary.total}</p>
            <p className="metric-meta">Eventos registrados</p>
          </Card>
          <Card>
            <p className="metric-label">Alertas altas</p>
            <p className="metric-value">{summary.high}</p>
            <p className="metric-meta">Por encima del umbral</p>
          </Card>
          <Card>
            <p className="metric-label">Alertas bajas</p>
            <p className="metric-value">{summary.low}</p>
            <p className="metric-meta">Por debajo del umbral</p>
          </Card>
          <Card>
            <p className="metric-label">No leídas</p>
            <p className="metric-value">{summary.unread}</p>
            <p className="metric-meta">Pendientes de revisión</p>
          </Card>
        </div>

        <div className="range-filter alerts-filter">
          <button
            type="button"
            className={`range-pill ${activeFilter === "ALL" ? "active" : ""}`}
            onClick={() => setActiveFilter("ALL")}
          >
            Todas
          </button>
          <button
            type="button"
            className={`range-pill ${activeFilter === "UNREAD" ? "active" : ""}`}
            onClick={() => setActiveFilter("UNREAD")}
          >
            No leídas
          </button>
          <button
            type="button"
            className={`range-pill ${activeFilter === "HIGH" ? "active" : ""}`}
            onClick={() => setActiveFilter("HIGH")}
          >
            Altas
          </button>
          <button
            type="button"
            className={`range-pill ${activeFilter === "LOW" ? "active" : ""}`}
            onClick={() => setActiveFilter("LOW")}
          >
            Bajas
          </button>
        </div>

        <AlertsList
          alerts={filteredAlerts}
          isLoading={isLoading}
          error={null}
          isUpdatingId={isUpdatingId}
          onMarkAsRead={onMarkAsRead}
        />
      </Section>
    </div>
  );
}


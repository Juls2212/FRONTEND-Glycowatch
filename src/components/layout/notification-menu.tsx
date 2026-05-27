"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StatePanel } from "@/components/ui/state-panel";
import { fetchAlerts, markAlertAsRead } from "@/features/alerts/api";
import { AlertItem } from "@/features/alerts/types";
import { useAuthStore } from "@/stores/auth-store";

function sortAlerts(items: AlertItem[]): AlertItem[] {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function formatAlertType(type: AlertItem["type"]): string {
  return type === "HIGH_GLUCOSE" ? "Glucosa alta" : "Glucosa baja";
}

function resolveAlertTone(type: AlertItem["type"]): "danger" | "info" {
  return type === "HIGH_GLUCOSE" ? "danger" : "info";
}

export function NotificationMenu() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loadPromiseRef = useRef<Promise<void> | null>(null);
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);

  const loadAlerts = useCallback(
    async (options?: { background?: boolean }) => {
      if (!isHydrated || !accessToken) return;

      const background = options?.background ?? false;

      if (!background) {
        setError(null);
        setIsLoading(true);
      }

      if (loadPromiseRef.current) {
        try {
          await loadPromiseRef.current;
        } finally {
          if (!background) {
            setIsLoading(false);
          }
        }
        return;
      }

      const request = (async () => {
        try {
          const data = await fetchAlerts();
          setAlerts(sortAlerts(data));
        } catch (err) {
          if (!background) {
            const message = err instanceof Error ? err.message : "No se pudieron cargar las alertas.";
            setError(message);
          }
        } finally {
          loadPromiseRef.current = null;
        }
      })();

      loadPromiseRef.current = request;

      try {
        await request;
      } finally {
        if (!background) {
          setIsLoading(false);
        }
      }
    },
    [accessToken, isHydrated]
  );

  useEffect(() => {
    if (!isHydrated) return;
    if (!accessToken) {
      setAlerts([]);
      setError(null);
      setOpen(false);
      return;
    }

    void loadAlerts({ background: true });
  }, [accessToken, isHydrated, loadAlerts]);

  useEffect(() => {
    if (!open) return;
    void loadAlerts();
  }, [loadAlerts, open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onMarkAsRead = async (alertId: number) => {
    setUpdatingId(alertId);
    try {
      await markAlertAsRead(alertId);
      setAlerts((current) =>
        current.map((alert) => (alert.id === alertId ? { ...alert, isRead: true, readAt: new Date().toISOString() } : alert))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar la alerta.";
      setError(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const unreadCount = useMemo(() => alerts.filter((alert) => !alert.isRead).length, [alerts]);
  const recentAlerts = useMemo(() => alerts.slice(0, 5), [alerts]);

  return (
    <div className="notification-menu" ref={containerRef}>
      <button
        type="button"
        className={`icon-button notification-button ${open ? "active" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Abrir alertas"
        title="Alertas"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-svg">
          <path
            d="M12 4.75A4.25 4.25 0 0 0 7.75 9v2.1c0 .8-.23 1.58-.66 2.25l-1.18 1.8a.8.8 0 0 0 .67 1.23h10.84a.8.8 0 0 0 .67-1.23l-1.18-1.8a4.12 4.12 0 0 1-.66-2.25V9A4.25 4.25 0 0 0 12 4.75Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M10.25 18.25a1.75 1.75 0 0 0 3.5 0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 ? <span className="notification-count">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="notification-dropdown" role="dialog" aria-label="Alertas recientes">
          <div className="notification-header">
            <div>
              <p className="notification-title">Alertas</p>
              <p className="notification-subtitle">Eventos recientes y pendientes de revisión.</p>
            </div>
            <Link href="/alerts" className="notification-link" onClick={() => setOpen(false)}>
              Ver todas
            </Link>
          </div>

          {error ? (
            <StatePanel
              variant="error"
              compact
              title="No pudimos cargar las alertas"
              message={error}
            />
          ) : null}
          {isLoading ? (
            <StatePanel
              variant="loading"
              compact
              title="Cargando alertas"
              message="Buscando eventos recientes para mostrártelos aquí."
            />
          ) : null}

          {!isLoading && !error && recentAlerts.length === 0 ? (
            <StatePanel
              variant="empty"
              compact
              title="No hay alertas recientes"
              message="Si aparece algo importante, lo verás aquí primero."
            />
          ) : null}

          {!isLoading && !error && recentAlerts.length > 0 ? (
            <ul className="notification-list">
              {recentAlerts.map((alert) => (
                <li key={alert.id} className="notification-item">
                  <div className="notification-item-main">
                    <span className={`notification-dot ${resolveAlertTone(alert.type)}`} aria-hidden="true" />
                    <div className="notification-copy">
                      <div className="notification-meta">
                        <p className="notification-item-title">{formatAlertType(alert.type)}</p>
                        <span className={`alert-badge ${alert.isRead ? "read" : "unread"}`}>
                          {alert.isRead ? "Leída" : "Nueva"}
                        </span>
                      </div>
                      <p className="notification-item-message">{alert.message}</p>
                      <p className="soft-text">{new Date(alert.createdAt).toLocaleString("es-CO")}</p>
                    </div>
                  </div>

                  {!alert.isRead ? (
                    <button
                      type="button"
                      className="ghost-button notification-action"
                      disabled={updatingId === alert.id}
                      onClick={() => void onMarkAsRead(alert.id)}
                    >
                      {updatingId === alert.id ? "Guardando..." : "Marcar leída"}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

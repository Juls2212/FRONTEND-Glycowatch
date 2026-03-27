import { Card } from "@/components/ui/card";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
import { AlertItem } from "@/features/alerts/types";

type Props = {
  alerts: AlertItem[];
  isLoading: boolean;
  error: string | null;
  isUpdatingId: number | null;
  onMarkAsRead: (alertId: number) => Promise<void>;
};

type AlertGroup = {
  title: string;
  key: "HIGH_GLUCOSE" | "LOW_GLUCOSE";
  items: AlertItem[];
};

function formatAlertType(type: AlertItem["type"]): string {
  return type === "HIGH_GLUCOSE" ? "Glucosa alta" : "Glucosa baja";
}

function resolveSeverityClass(type: AlertItem["type"]): string {
  return type === "HIGH_GLUCOSE" ? "high" : "low";
}

function buildDescription(alert: AlertItem): string {
  if (alert.type === "HIGH_GLUCOSE") {
    return "Se detectó una lectura por encima del umbral configurado.";
  }
  return "Se detectó una lectura por debajo del umbral configurado.";
}

function buildGroups(alerts: AlertItem[]): AlertGroup[] {
  const high = alerts.filter((item) => item.type === "HIGH_GLUCOSE");
  const low = alerts.filter((item) => item.type === "LOW_GLUCOSE");

  const groups: AlertGroup[] = [];
  if (high.length > 0) {
    groups.push({ title: "Alertas altas", key: "HIGH_GLUCOSE", items: high });
  }
  if (low.length > 0) {
    groups.push({ title: "Alertas bajas", key: "LOW_GLUCOSE", items: low });
  }
  return groups;
}

export function AlertsList({ alerts, isLoading, error, isUpdatingId, onMarkAsRead }: Props) {
  const groups = buildGroups(alerts);

  return (
    <Card>
      {isLoading ? (
        <div className="skeleton-stack">
          <SkeletonBlock className="skeleton-line w-50" />
          <SkeletonBlock className="skeleton-line w-100" />
          <SkeletonBlock className="skeleton-line w-90" />
          <SkeletonBlock className="skeleton-line w-80" />
        </div>
      ) : null}
      {error ? <FeedbackBanner type="error" message={error} /> : null}

      {!isLoading && !error && alerts.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">Sin alertas para este filtro</p>
          <p className="soft-text">Cuando existan eventos de riesgo relevantes, aparecerán aquí.</p>
        </div>
      ) : null}

      {!isLoading && !error && alerts.length > 0 ? (
        <div className="alerts-groups">
          {groups.map((group) => (
            <section key={group.key} className="alerts-group">
              <div className="alerts-group-header">
                <h3 className="alerts-group-title">{group.title}</h3>
                <span className="soft-text">{group.items.length} eventos</span>
              </div>
              <ul className="alerts-list alerts-list-full">
                {group.items.map((alert) => (
                  <li key={alert.id} className={`alert-row alert-row-${resolveSeverityClass(alert.type)}`}>
                    <div>
                      <p className={`alert-type ${resolveSeverityClass(alert.type)}`}>{formatAlertType(alert.type)}</p>
                      <p className="alert-message">{buildDescription(alert)}</p>
                      <p className="soft-text">Fecha: {new Date(alert.createdAt).toLocaleString("es-CO")}</p>
                      <p className="soft-text">Detalle: {alert.message}</p>
                    </div>

                    <div className="alerts-actions">
                      <div className={`alert-badge ${alert.isRead ? "read" : "unread"}`}>
                        {alert.isRead ? "Leída" : "No leída"}
                      </div>
                      <button
                        type="button"
                        className="ghost-button"
                        disabled={alert.isRead || isUpdatingId === alert.id}
                        onClick={() => void onMarkAsRead(alert.id)}
                      >
                        {isUpdatingId === alert.id ? "Guardando..." : "Marcar como leída"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </Card>
  );
}


import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { ApiSuccess } from "@/types/api";
import { DashboardMetrics, ChartPoint, RiskAnalysis, AlertItem, ManualMeasurementPayload } from "./types";

function toNumeric(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeDashboardMetrics(raw: unknown): DashboardMetrics {
  const source = (raw ?? {}) as Record<string, unknown>;
  const latestRaw = source.latestMeasurement as Record<string, unknown> | null | undefined;

  return {
    latestMeasurement: latestRaw
      ? {
          glucoseValue: toNumeric(latestRaw.glucoseValue),
          unit: String(latestRaw.unit ?? "mg/dL"),
          measuredAt: String(latestRaw.measuredAt ?? "")
        }
      : null,
    averageGlucose: toNumeric(source.averageGlucose ?? source.average),
    minGlucose: toNumeric(source.minGlucose ?? source.min),
    maxGlucose: toNumeric(source.maxGlucose ?? source.max),
    alertsCount: toNumeric(source.alertsCount ?? source.alertCount)
  };
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const response = await apiClient.get<ApiSuccess<unknown>>(API_ENDPOINTS.analytics.dashboard);
  return normalizeDashboardMetrics(response.data.data);
}

export async function fetchChartData(): Promise<ChartPoint[]> {
  const response = await apiClient.get<ApiSuccess<ChartPoint[]>>(API_ENDPOINTS.analytics.chart);
  return response.data.data;
}

export async function fetchRiskAnalysis(): Promise<RiskAnalysis> {
  const response = await apiClient.get<ApiSuccess<RiskAnalysis>>(API_ENDPOINTS.analytics.risk);
  return response.data.data;
}

export async function fetchAlerts(): Promise<AlertItem[]> {
  const response = await apiClient.get<ApiSuccess<AlertItem[]>>(API_ENDPOINTS.alerts.base);
  return response.data.data;
}

export async function createManualMeasurement(payload: ManualMeasurementPayload): Promise<void> {
  await apiClient.post(`${API_ENDPOINTS.measurements.base}/manual`, payload);
}

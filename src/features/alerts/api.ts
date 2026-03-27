import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { ApiSuccess } from "@/types/api";
import { AlertItem } from "./types";

export async function fetchAlerts(): Promise<AlertItem[]> {
  const response = await apiClient.get<ApiSuccess<AlertItem[]>>(API_ENDPOINTS.alerts.base);
  return response.data.data;
}

export async function markAlertAsRead(alertId: number): Promise<void> {
  await apiClient.put(`${API_ENDPOINTS.alerts.base}/${alertId}/read`);
}


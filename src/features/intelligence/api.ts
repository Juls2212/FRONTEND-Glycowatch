import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { ApiSuccess } from "@/types/api";
import { IntelligenceHistoryItem, IntelligenceSummary } from "./types";

export async function getIntelligenceSummary(): Promise<IntelligenceSummary> {
  const response = await apiClient.get<ApiSuccess<IntelligenceSummary>>(API_ENDPOINTS.intelligence.summary);
  return response.data.data;
}

export async function generateIntelligenceSummary(): Promise<IntelligenceSummary> {
  const response = await apiClient.post<ApiSuccess<IntelligenceSummary>>(API_ENDPOINTS.intelligence.generate);
  return response.data.data;
}

export async function getIntelligenceHistory(): Promise<IntelligenceHistoryItem[]> {
  const response = await apiClient.get<ApiSuccess<IntelligenceHistoryItem[]>>(API_ENDPOINTS.intelligence.history);
  return response.data.data;
}

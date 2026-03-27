import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { ApiSuccess } from "@/types/api";
import {
  LatestMeasurement,
  ManualMeasurementPayload,
  MeasurementsFilters,
  MeasurementsPageData
} from "./types";

export async function fetchLatestMeasurement(): Promise<LatestMeasurement | null> {
  try {
    const response = await apiClient.get<ApiSuccess<LatestMeasurement>>(API_ENDPOINTS.measurements.latest);
    return response.data.data;
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status?: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchMeasurements(
  page: number,
  size: number,
  filters: MeasurementsFilters
): Promise<MeasurementsPageData> {
  const params: Record<string, string | number> = { page, size };
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;

  const response = await apiClient.get<ApiSuccess<MeasurementsPageData>>(API_ENDPOINTS.measurements.base, { params });
  return response.data.data;
}

export async function createManualMeasurement(payload: ManualMeasurementPayload): Promise<void> {
  await apiClient.post(`${API_ENDPOINTS.measurements.base}/manual`, payload);
}

export async function deleteMeasurement(measurementId: number): Promise<void> {
  await apiClient.delete(`${API_ENDPOINTS.measurements.base}/${measurementId}`);
}

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { ApiSuccess } from "@/types/api";
import { DeviceItem, RegisterDevicePayload, RegisterDeviceResult } from "./types";

export async function fetchDevices(): Promise<DeviceItem[]> {
  const response = await apiClient.get<ApiSuccess<DeviceItem[]>>(API_ENDPOINTS.devices.base);
  return response.data.data;
}

export async function registerDevice(payload: RegisterDevicePayload): Promise<RegisterDeviceResult> {
  const response = await apiClient.post<ApiSuccess<RegisterDeviceResult>>(API_ENDPOINTS.devices.base, payload);
  return response.data.data;
}

export async function linkDevice(deviceId: number): Promise<void> {
  await apiClient.post(`${API_ENDPOINTS.devices.base}/${deviceId}/link`);
}

export async function toggleDevice(deviceId: number): Promise<void> {
  await apiClient.put(`${API_ENDPOINTS.devices.base}/${deviceId}/toggle`);
}


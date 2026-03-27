import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { ApiSuccess } from "@/types/api";
import { ProfileData, UpdateProfilePayload } from "./types";

export async function fetchProfile(): Promise<ProfileData> {
  const response = await apiClient.get<ApiSuccess<ProfileData>>(API_ENDPOINTS.profile.me);
  return response.data.data;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<ProfileData> {
  const response = await apiClient.put<ApiSuccess<ProfileData>>(API_ENDPOINTS.profile.me, payload);
  return response.data.data;
}


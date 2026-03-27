import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { ApiSuccess } from "@/types/api";
import { LoginResponseData, LoginFormValues, RegisterFormValues, RegisterResponseData } from "./types";

export async function loginRequest(payload: LoginFormValues): Promise<LoginResponseData> {
  const response = await apiClient.post<ApiSuccess<LoginResponseData>>(API_ENDPOINTS.auth.login, payload);
  return response.data.data;
}

export async function registerRequest(payload: RegisterFormValues): Promise<RegisterResponseData> {
  const response = await apiClient.post<ApiSuccess<RegisterResponseData>>(API_ENDPOINTS.auth.register, payload);
  return response.data.data;
}

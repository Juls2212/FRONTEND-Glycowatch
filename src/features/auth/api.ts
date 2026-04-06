import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { parseLoginPayload, parseRegisterPayload } from "@/lib/validation/auth";
import { ApiSuccess } from "@/types/api";
import { LoginResponseData, LoginFormValues, RegisterFormValues, RegisterResponseData } from "./types";

export async function loginRequest(payload: LoginFormValues): Promise<LoginResponseData> {
  const normalizedPayload = parseLoginPayload(payload);
  const response = await apiClient.post<ApiSuccess<LoginResponseData>>(API_ENDPOINTS.auth.login, normalizedPayload);
  return response.data.data;
}

export async function registerRequest(payload: RegisterFormValues): Promise<RegisterResponseData> {
  const normalizedPayload = parseRegisterPayload(payload);
  const response = await apiClient.post<ApiSuccess<RegisterResponseData>>(API_ENDPOINTS.auth.register, normalizedPayload);
  return response.data.data;
}

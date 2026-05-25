import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { parseLoginPayload, parseRegisterPayload } from "@/lib/validation/auth";
import { ApiSuccess } from "@/types/api";
import { LoginResponseData, LoginFormValues, RegisterFormValues, RegisterResponseData } from "./types";
import { hashStringSha256 } from "./password-hash";

export async function loginRequest(payload: LoginFormValues): Promise<LoginResponseData> {
  const normalizedPayload = parseLoginPayload(payload);
  const hashedPassword = await hashStringSha256(normalizedPayload.password);
  const response = await apiClient.post<ApiSuccess<LoginResponseData>>(API_ENDPOINTS.auth.login, {
    ...normalizedPayload,
    password: hashedPassword
  });
  return response.data.data;
}

export async function registerRequest(payload: RegisterFormValues): Promise<RegisterResponseData> {
  const normalizedPayload = parseRegisterPayload(payload);
  const hashedPassword = await hashStringSha256(normalizedPayload.password);
  const response = await apiClient.post<ApiSuccess<RegisterResponseData>>(API_ENDPOINTS.auth.register, {
    ...normalizedPayload,
    password: hashedPassword
  });
  return response.data.data;
}

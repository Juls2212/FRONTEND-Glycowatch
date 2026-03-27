import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "@/lib/auth/token";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { HttpError } from "@/types/api";

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api/v1";

const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

const refreshClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    const status = error.response?.status ?? 0;

    if (status === 401 && original && !original._retry) {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        tokenStorage.clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(new HttpError("Sesión expirada.", 401, "SESSION_EXPIRED"));
      }

      try {
        original._retry = true;
        const refreshResponse = await refreshClient.post(API_ENDPOINTS.auth.refresh, { refreshToken });
        const newAccessToken = refreshResponse.data?.data?.accessToken as string | undefined;
        if (!newAccessToken) {
          throw new Error("Missing access token");
        }
        tokenStorage.setTokens(newAccessToken, refreshToken);
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(original);
      } catch {
        tokenStorage.clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(new HttpError("Sesión expirada.", 401, "SESSION_EXPIRED"));
      }
    }

    const message =
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message ??
      "Error inesperado.";

    return Promise.reject(new HttpError(message, status));
  }
);

export { apiClient };

export const API_ENDPOINTS = {
  auth: {
    login: "/api/v1/auth/login",
    register: "/api/v1/auth/register",
    refresh: "/api/v1/auth/refresh"
  },
  profile: {
    me: "/api/v1/profile"
  },
  devices: {
    base: "/api/v1/devices"
  },
  measurements: {
    base: "/api/v1/measurements",
    latest: "/api/v1/measurements/latest"
  },
  alerts: {
    base: "/api/v1/alerts"
  },
  analytics: {
    dashboard: "/api/v1/analytics/dashboard",
    chart: "/api/v1/analytics/chart",
    risk: "/api/v1/analytics/risk"
  },
  intelligence: {
    summary: "/api/v1/intelligence/summary",
    history: "/api/v1/intelligence/history"
  }
} as const;
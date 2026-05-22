export const API_ENDPOINTS = {
  auth: {
    login: "/api/v1/auth/login",
    register: "/api/v1/auth/register",
    refresh: "/api/v1/auth/refresh"
  },
  profile: {
    me: "/profile"
  },
  devices: {
    base: "/devices"
  },
  measurements: {
    base: "/measurements",
    latest: "/measurements/latest"
  },
  alerts: {
    base: "/alerts"
  },
  analytics: {
    dashboard: "/analytics/dashboard",
    chart: "/analytics/chart",
    risk: "/analytics/risk"
  },
  intelligence: {
    summary: "/intelligence/summary",
    history: "/intelligence/history"
  }
} as const;

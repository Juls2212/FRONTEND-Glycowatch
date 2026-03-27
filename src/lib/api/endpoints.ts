export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    refresh: "/auth/refresh"
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
  }
} as const;


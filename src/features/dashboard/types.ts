export type DashboardMetrics = {
  latestMeasurement: {
    glucoseValue: number;
    unit: string;
    measuredAt: string;
  } | null;
  averageGlucose: number;
  minGlucose: number;
  maxGlucose: number;
  alertsCount: number;
};

export type ChartPoint = {
  measuredAt: string;
  glucoseValue: number;
};

export type RiskAnalysis = {
  currentStatus: "LOW" | "IN_RANGE" | "HIGH";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  trend: "STABLE" | "RISING" | "FALLING";
  message: string;
};

export type AlertItem = {
  id: number;
  type: "HIGH_GLUCOSE" | "LOW_GLUCOSE";
  message: string;
  isRead: boolean;
  readAt: string | null;
  measurementId: number;
  createdAt: string;
};

export type ManualMeasurementPayload = {
  glucoseValue: number;
  unit: string;
  measuredAt: string;
};

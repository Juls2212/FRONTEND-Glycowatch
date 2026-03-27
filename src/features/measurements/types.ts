export type LatestMeasurement = {
  glucoseValue: number;
  unit: string;
  measuredAt: string;
};

export type MeasurementItem = {
  id: number;
  glucoseValue: number;
  unit: string;
  measuredAt: string;
  isValid: boolean;
  invalidReason?: string | null;
  deviceId?: number | null;
  origin?: "IOT" | "MANUAL" | string;
};

export type MeasurementsPageData = {
  content: MeasurementItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
};

export type MeasurementsFilters = {
  from?: string;
  to?: string;
};

export type ManualMeasurementPayload = {
  glucoseValue: number;
  unit: string;
  measuredAt: string;
};


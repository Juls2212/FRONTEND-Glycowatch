import { ChartPoint } from "@/features/dashboard/types";

export type ChartRange = "DAY" | "WEEK" | "MONTH" | "YEAR";

const RANGE_OFFSETS: Record<ChartRange, { amount: number; unit: "day" | "month" | "year" }> = {
  DAY: { amount: 1, unit: "day" },
  WEEK: { amount: 7, unit: "day" },
  MONTH: { amount: 1, unit: "month" },
  YEAR: { amount: 1, unit: "year" }
};

export function filterChartByRange(data: ChartPoint[], range: ChartRange): ChartPoint[] {
  const now = new Date();
  const threshold = new Date(now);
  const offset = RANGE_OFFSETS[range];

  if (offset.unit === "day") {
    threshold.setDate(now.getDate() - offset.amount);
  } else if (offset.unit === "month") {
    threshold.setMonth(now.getMonth() - offset.amount);
  } else {
    threshold.setFullYear(now.getFullYear() - offset.amount);
  }

  const thresholdTime = threshold.getTime();
  return data.filter((item) => new Date(item.measuredAt).getTime() >= thresholdTime);
}


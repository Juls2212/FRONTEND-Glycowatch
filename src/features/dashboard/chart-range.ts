import { ChartPoint } from "@/features/dashboard/types";

export type ChartRange = "DAY" | "WEEK" | "MONTH" | "YEAR";

const RANGE_OFFSETS: Record<ChartRange, { amount: number; unit: "day" | "month" | "year" }> = {
  DAY: { amount: 1, unit: "day" },
  WEEK: { amount: 7, unit: "day" },
  MONTH: { amount: 1, unit: "month" },
  YEAR: { amount: 1, unit: "year" }
};

function applyRangeOffset(baseDate: Date, range: ChartRange): Date {
  const threshold = new Date(baseDate);
  const offset = RANGE_OFFSETS[range];

  if (offset.unit === "day") {
    threshold.setDate(baseDate.getDate() - offset.amount);
  } else if (offset.unit === "month") {
    threshold.setMonth(baseDate.getMonth() - offset.amount);
  } else {
    threshold.setFullYear(baseDate.getFullYear() - offset.amount);
  }

  return threshold;
}

function formatDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildChartRangeParams(range: ChartRange): { from: string; to: string } {
  const toDate = new Date();
  const fromDate = applyRangeOffset(toDate, range);

  return {
    from: formatDateParam(fromDate),
    to: formatDateParam(toDate)
  };
}

export function filterChartByRange(data: ChartPoint[], range: ChartRange): ChartPoint[] {
  const threshold = applyRangeOffset(new Date(), range);

  const thresholdTime = threshold.getTime();
  return data.filter((item) => new Date(item.measuredAt).getTime() >= thresholdTime);
}

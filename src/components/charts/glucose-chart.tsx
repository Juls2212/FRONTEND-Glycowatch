"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis
} from "recharts";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { ChartPoint } from "@/features/dashboard/types";

type Props = {
  data: ChartPoint[];
};

type ChartTheme = {
  lineStart: string;
  lineEnd: string;
  fillStart: string;
  fillEnd: string;
  grid: string;
  gridStrong: string;
  tick: string;
  tooltipBackground: string;
  tooltipBorder: string;
  tooltipText: string;
  tooltipMuted: string;
  activeDot: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
};

type EnhancedPoint = ChartPoint & {
  status: "low" | "inRange" | "high";
  contextLabel: string;
};

const LOW_THRESHOLD = 70;
const HIGH_THRESHOLD = 180;

const axisDateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit"
});

const tooltipDateFormatter = new Intl.DateTimeFormat("es-CO", {
  weekday: "short",
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit"
});

function formatAxisLabel(value: string): string {
  return axisDateFormatter.format(new Date(value));
}

function formatTooltipLabel(value: string): string {
  return tooltipDateFormatter.format(new Date(value));
}

function resolvePointStatus(value: number): EnhancedPoint["status"] {
  if (value < LOW_THRESHOLD) return "low";
  if (value > HIGH_THRESHOLD) return "high";
  return "inRange";
}

function buildPointContext(value: number): string {
  if (value < LOW_THRESHOLD) return "Por debajo del rango recomendado";
  if (value > HIGH_THRESHOLD) return "Por encima del rango recomendado";
  return "Dentro del rango recomendado";
}

function createChartTheme(root: HTMLElement): ChartTheme {
  const styles = window.getComputedStyle(root);

  return {
    lineStart: styles.getPropertyValue("--chart-line-start").trim() || "#7dc0ff",
    lineEnd: styles.getPropertyValue("--chart-line-end").trim() || "#3a88dc",
    fillStart: styles.getPropertyValue("--chart-fill-start").trim() || "rgba(79, 152, 245, 0.22)",
    fillEnd: styles.getPropertyValue("--chart-fill-end").trim() || "rgba(79, 152, 245, 0.02)",
    grid: styles.getPropertyValue("--chart-grid").trim() || "#1c2b48",
    gridStrong: styles.getPropertyValue("--chart-grid-strong").trim() || "#31415d",
    tick: styles.getPropertyValue("--text-secondary").trim() || "#8fa7d5",
    tooltipBackground: styles.getPropertyValue("--chart-tooltip-bg").trim() || "#0f1626",
    tooltipBorder: styles.getPropertyValue("--chart-tooltip-border").trim() || "#2e4267",
    tooltipText: styles.getPropertyValue("--chart-tooltip-text").trim() || "#dce8ff",
    tooltipMuted: styles.getPropertyValue("--text-secondary").trim() || "#8fa7d5",
    activeDot: styles.getPropertyValue("--accent").trim() || "#8ec4ff",
    success: styles.getPropertyValue("--success").trim() || "#43c27c",
    warning: styles.getPropertyValue("--warning").trim() || "#f1b24c",
    danger: styles.getPropertyValue("--danger").trim() || "#e46b7d",
    info: styles.getPropertyValue("--info").trim() || "#4f98f5"
  };
}

function ChartTooltip({
  active,
  label,
  payload,
  theme
}: TooltipProps<ValueType, NameType> & { theme: ChartTheme }) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload as EnhancedPoint | undefined;
  if (!point) return null;

  return (
    <div
      className="chart-tooltip"
      style={{
        background: theme.tooltipBackground,
        borderColor: theme.tooltipBorder,
        color: theme.tooltipText
      }}
    >
      <p className="chart-tooltip-label">{formatTooltipLabel(String(label))}</p>
      <div className="chart-tooltip-value-row">
        <span className={`chart-tooltip-dot ${point.status}`} aria-hidden="true" />
        <p className="chart-tooltip-value">{`${point.glucoseValue} mg/dL`}</p>
      </div>
      <p className="chart-tooltip-context" style={{ color: theme.tooltipMuted }}>
        {point.contextLabel}
      </p>
    </div>
  );
}

function renderPoint(theme: ChartTheme) {
  return function PointDot(props: any) {
    const { cx, cy, payload } = props;
    if (typeof cx !== "number" || typeof cy !== "number" || !payload) return <g />;

    const point = payload as EnhancedPoint;
    const fill =
      point.status === "high" ? theme.danger : point.status === "low" ? theme.warning : theme.success;

    return (
      <g>
        <circle cx={cx} cy={cy} r={5.5} fill={fill} fillOpacity={0.14} />
        <circle cx={cx} cy={cy} r={3.2} fill={fill} stroke={theme.tooltipBackground} strokeWidth={1.5} />
      </g>
    );
  };
}

function renderActivePoint(theme: ChartTheme) {
  return function ActivePointDot(props: any) {
    const { cx, cy, payload } = props;
    if (typeof cx !== "number" || typeof cy !== "number" || !payload) return <g />;

    const point = payload as EnhancedPoint;
    const fill =
      point.status === "high" ? theme.danger : point.status === "low" ? theme.warning : theme.info;

    return (
      <g>
        <circle cx={cx} cy={cy} r={12} fill={fill} fillOpacity={0.12} />
        <circle cx={cx} cy={cy} r={7} fill={fill} fillOpacity={0.22} />
        <circle cx={cx} cy={cy} r={4.5} fill={fill} stroke={theme.tooltipBackground} strokeWidth={2} />
      </g>
    );
  };
}

export function GlucoseChart({ data }: Props) {
  const [chartTheme, setChartTheme] = useState<ChartTheme>({
    lineStart: "#7dc0ff",
    lineEnd: "#3a88dc",
    fillStart: "rgba(79, 152, 245, 0.22)",
    fillEnd: "rgba(79, 152, 245, 0.02)",
    grid: "#1c2b48",
    gridStrong: "#31415d",
    tick: "#8fa7d5",
    tooltipBackground: "#0f1626",
    tooltipBorder: "#2e4267",
    tooltipText: "#dce8ff",
    tooltipMuted: "#8fa7d5",
    activeDot: "#8ec4ff",
    success: "#43c27c",
    warning: "#f1b24c",
    danger: "#e46b7d",
    info: "#4f98f5"
  });

  useEffect(() => {
    const root = document.documentElement;

    const syncChartTheme = () => {
      setChartTheme(createChartTheme(root));
    };

    syncChartTheme();

    const observer = new MutationObserver(syncChartTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-color-mode", "data-accent-theme"]
    });

    return () => observer.disconnect();
  }, []);

  const enhancedData = useMemo<EnhancedPoint[]>(
    () =>
      data.map((point) => ({
        ...point,
        status: resolvePointStatus(point.glucoseValue),
        contextLabel: buildPointContext(point.glucoseValue)
      })),
    [data]
  );

  const yDomain = useMemo<[number, number]>(() => {
    if (enhancedData.length === 0) return [40, 220];

    const values = enhancedData.map((point) => point.glucoseValue);
    const min = Math.min(...values, LOW_THRESHOLD);
    const max = Math.max(...values, HIGH_THRESHOLD);
    const padding = Math.max(12, Math.round((max - min) * 0.12));
    return [Math.max(0, min - padding), max + padding];
  }, [enhancedData]);

  const pointRenderer = useMemo(() => renderPoint(chartTheme), [chartTheme]);
  const activePointRenderer = useMemo(() => renderActivePoint(chartTheme), [chartTheme]);

  return (
    <div className="chart-wrap chart-wrap-enhanced">
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={enhancedData} margin={{ top: 12, right: 10, bottom: 6, left: -10 }}>
          <defs>
            <linearGradient id="glucoseAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartTheme.fillStart} />
              <stop offset="100%" stopColor={chartTheme.fillEnd} />
            </linearGradient>
            <linearGradient id="glucoseLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={chartTheme.lineStart} />
              <stop offset="100%" stopColor={chartTheme.lineEnd} />
            </linearGradient>
          </defs>

          <ReferenceArea
            y1={LOW_THRESHOLD}
            y2={HIGH_THRESHOLD}
            fill={chartTheme.success}
            fillOpacity={0.045}
            ifOverflow="extendDomain"
          />
          <ReferenceArea y1={yDomain[0]} y2={LOW_THRESHOLD} fill={chartTheme.warning} fillOpacity={0.035} ifOverflow="extendDomain" />
          <ReferenceArea y1={HIGH_THRESHOLD} y2={yDomain[1]} fill={chartTheme.danger} fillOpacity={0.035} ifOverflow="extendDomain" />

          <CartesianGrid stroke={chartTheme.grid} strokeDasharray="4 6" vertical={false} />
          <XAxis
            dataKey="measuredAt"
            tickFormatter={formatAxisLabel}
            interval="preserveStartEnd"
            minTickGap={34}
            tick={{ fill: chartTheme.tick, fontSize: 12 }}
            axisLine={{ stroke: chartTheme.gridStrong, strokeOpacity: 0.55 }}
            tickLine={false}
          />
          <YAxis
            domain={yDomain}
            tick={{ fill: chartTheme.tick, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={42}
            tickFormatter={(value: number) => `${value}`}
          />
          <Tooltip content={<ChartTooltip theme={chartTheme} />} cursor={{ stroke: chartTheme.gridStrong, strokeDasharray: "3 4" }} />

          <Area
            type="monotone"
            dataKey="glucoseValue"
            stroke="none"
            fill="url(#glucoseAreaGradient)"
            fillOpacity={1}
            isAnimationActive
            animationDuration={520}
          />
          <Line
            type="monotone"
            dataKey="glucoseValue"
            stroke="url(#glucoseLineGradient)"
            strokeWidth={3}
            dot={pointRenderer}
            activeDot={activePointRenderer}
            isAnimationActive
            animationDuration={640}
            animationEasing="ease-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

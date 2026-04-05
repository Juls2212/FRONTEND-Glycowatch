"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis
} from "recharts";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { ChartPoint } from "@/features/dashboard/types";
import { GlucoseChart } from "@/components/charts/glucose-chart";

type VisualizationView = "LINE" | "BAR" | "TREND";

type Props = {
  data: ChartPoint[];
  defaultView?: VisualizationView;
};

type ChartTheme = {
  grid: string;
  gridStrong: string;
  tick: string;
  tooltipBackground: string;
  tooltipBorder: string;
  tooltipText: string;
  tooltipMuted: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  accent: string;
};

type EnhancedPoint = ChartPoint & {
  status: "low" | "inRange" | "high";
  contextLabel: string;
  trendValue: number;
};

const LOW_THRESHOLD = 70;
const HIGH_THRESHOLD = 180;

const VIEW_OPTIONS: Array<{ value: VisualizationView; label: string; description: string }> = [
  { value: "LINE", label: "Linea", description: "Lectura punto a punto con contexto clinico." },
  { value: "BAR", label: "Barras", description: "Comparacion rapida entre mediciones visibles." },
  { value: "TREND", label: "Tendencia", description: "Promedio movil para leer direccion general." }
];

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
  minute: "2-digit"
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

function buildTrendValue(data: ChartPoint[], index: number): number {
  const window = data.slice(Math.max(0, index - 3), index + 1);
  const total = window.reduce((sum, point) => sum + point.glucoseValue, 0);
  return Number((total / window.length).toFixed(1));
}

function createChartTheme(root: HTMLElement): ChartTheme {
  const styles = window.getComputedStyle(root);

  return {
    grid: styles.getPropertyValue("--chart-grid").trim() || "#1c2b48",
    gridStrong: styles.getPropertyValue("--chart-grid-strong").trim() || "#31415d",
    tick: styles.getPropertyValue("--text-secondary").trim() || "#8fa7d5",
    tooltipBackground: styles.getPropertyValue("--chart-tooltip-bg").trim() || "#0f1626",
    tooltipBorder: styles.getPropertyValue("--chart-tooltip-border").trim() || "#2e4267",
    tooltipText: styles.getPropertyValue("--chart-tooltip-text").trim() || "#dce8ff",
    tooltipMuted: styles.getPropertyValue("--text-secondary").trim() || "#8fa7d5",
    success: styles.getPropertyValue("--success").trim() || "#43c27c",
    warning: styles.getPropertyValue("--warning").trim() || "#f1b24c",
    danger: styles.getPropertyValue("--danger").trim() || "#e46b7d",
    info: styles.getPropertyValue("--info").trim() || "#4f98f5",
    accent: styles.getPropertyValue("--accent").trim() || "#4da3ff"
  };
}

function resolveColorByStatus(theme: ChartTheme, status: EnhancedPoint["status"]): string {
  if (status === "high") return theme.danger;
  if (status === "low") return theme.warning;
  return theme.success;
}

function VisualizationTooltip({
  active,
  label,
  payload,
  theme,
  metricLabel
}: TooltipProps<ValueType, NameType> & { theme: ChartTheme; metricLabel: string }) {
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
        <p className="chart-tooltip-value">
          {metricLabel}: {payload[0]?.value} mg/dL
        </p>
      </div>
      <p className="chart-tooltip-context" style={{ color: theme.tooltipMuted }}>
        {point.contextLabel}
      </p>
    </div>
  );
}

export function GlucoseVisualization({ data, defaultView = "LINE" }: Props) {
  const [view, setView] = useState<VisualizationView>(defaultView);
  const [chartTheme, setChartTheme] = useState<ChartTheme>({
    grid: "#1c2b48",
    gridStrong: "#31415d",
    tick: "#8fa7d5",
    tooltipBackground: "#0f1626",
    tooltipBorder: "#2e4267",
    tooltipText: "#dce8ff",
    tooltipMuted: "#8fa7d5",
    success: "#43c27c",
    warning: "#f1b24c",
    danger: "#e46b7d",
    info: "#4f98f5",
    accent: "#4da3ff"
  });

  useEffect(() => {
    const root = document.documentElement;

    const syncChartTheme = () => setChartTheme(createChartTheme(root));
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
      data.map((point, index) => ({
        ...point,
        status: resolvePointStatus(point.glucoseValue),
        contextLabel: buildPointContext(point.glucoseValue),
        trendValue: buildTrendValue(data, index)
      })),
    [data]
  );

  const yDomain = useMemo<[number, number]>(() => {
    if (enhancedData.length === 0) return [40, 220];
    const values = enhancedData.flatMap((point) => [point.glucoseValue, point.trendValue]);
    const min = Math.min(...values, LOW_THRESHOLD);
    const max = Math.max(...values, HIGH_THRESHOLD);
    const padding = Math.max(12, Math.round((max - min) * 0.12));
    return [Math.max(0, min - padding), max + padding];
  }, [enhancedData]);

  const activeView = VIEW_OPTIONS.find((option) => option.value === view) ?? VIEW_OPTIONS[0];

  return (
    <div className="visualization-shell">
      <div className="visualization-toolbar">
        <div className="visualization-copy">
          <p className="chart-card-kicker">Explora diferentes lecturas del mismo rango</p>
          <p className="visualization-note">{activeView.description}</p>
        </div>

        <div className="visualization-selector" role="tablist" aria-label="Selector de visualizacion">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`range-pill ${view === option.value ? "active" : ""}`}
              onClick={() => setView(option.value)}
              aria-pressed={view === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {enhancedData.length === 0 ? (
        <p className="soft-text">No hay datos para visualizar en este rango.</p>
      ) : null}

      {enhancedData.length > 0 && view === "LINE" ? <GlucoseChart data={enhancedData} /> : null}

      {enhancedData.length > 0 && view === "BAR" ? (
        <div className="chart-wrap chart-wrap-enhanced">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={enhancedData} margin={{ top: 12, right: 8, bottom: 6, left: -8 }} barCategoryGap={10}>
              <CartesianGrid stroke={chartTheme.grid} strokeDasharray="4 6" vertical={false} />
              <XAxis
                dataKey="measuredAt"
                tickFormatter={formatAxisLabel}
                interval="preserveStartEnd"
                minTickGap={30}
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
              />
              <Tooltip
                content={<VisualizationTooltip theme={chartTheme} metricLabel="Glucosa" />}
                cursor={{ fill: "rgba(255,255,255,0.02)" }}
              />
              <Bar
                dataKey="glucoseValue"
                radius={[10, 10, 4, 4]}
                animationDuration={520}
                activeBar={{ fillOpacity: 0.9, stroke: chartTheme.gridStrong, strokeOpacity: 0.45, strokeWidth: 1 }}
              >
                {enhancedData.map((point) => (
                  <Cell key={`${point.measuredAt}-${point.glucoseValue}`} fill={resolveColorByStatus(chartTheme, point.status)} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {enhancedData.length > 0 && view === "TREND" ? (
        <div className="chart-wrap chart-wrap-enhanced">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={enhancedData} margin={{ top: 12, right: 8, bottom: 6, left: -8 }}>
              <defs>
                <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartTheme.info} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={chartTheme.info} stopOpacity={0.03} />
                </linearGradient>
              </defs>
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
              />
              <Tooltip
                content={<VisualizationTooltip theme={chartTheme} metricLabel="Promedio movil" />}
                cursor={{ stroke: chartTheme.gridStrong, strokeDasharray: "3 4" }}
              />
              <Area
                type="monotone"
                dataKey="trendValue"
                stroke="none"
                fill="url(#trendAreaGradient)"
                isAnimationActive
                animationDuration={520}
              />
              <Line
                type="monotone"
                dataKey="glucoseValue"
                stroke={chartTheme.gridStrong}
                strokeOpacity={0.35}
                strokeWidth={1.6}
                dot={false}
                isAnimationActive
                animationDuration={420}
              />
              <Line
                type="monotone"
                dataKey="trendValue"
                stroke={chartTheme.info}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: chartTheme.info, stroke: chartTheme.tooltipBackground, strokeWidth: 2 }}
                isAnimationActive
                animationDuration={620}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
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
import { ChartTheme, useChartTheme } from "@/components/charts/chart-theme";

type VisualizationView = "LINE" | "BAR" | "TREND";

type Props = {
  data: ChartPoint[];
  defaultView?: VisualizationView;
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

function resolveColorByStatus(theme: ChartTheme, status: EnhancedPoint["status"]): string {
  if (status === "high") return theme.danger;
  if (status === "low") return theme.warning;
  return theme.accent;
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
  const chartTheme = useChartTheme();

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
            <BarChart data={enhancedData} margin={{ top: 18, right: 12, bottom: 10, left: -4 }} barCategoryGap={16}>
              <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 7" vertical={false} />
              <XAxis
                dataKey="measuredAt"
                tickFormatter={formatAxisLabel}
                interval="preserveStartEnd"
                minTickGap={38}
                tick={{ fill: chartTheme.tick, fontSize: 11 }}
                axisLine={{ stroke: chartTheme.gridStrong, strokeOpacity: 0.4 }}
                tickLine={false}
                dy={8}
              />
              <YAxis
                domain={yDomain}
                tick={{ fill: chartTheme.tick, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                content={<VisualizationTooltip theme={chartTheme} metricLabel="Glucosa" />}
                cursor={{ fill: "rgba(255,255,255,0.015)" }}
              />
              <Bar
                dataKey="glucoseValue"
                radius={[12, 12, 5, 5]}
                animationDuration={520}
                maxBarSize={26}
                activeBar={{ fillOpacity: 0.88, stroke: chartTheme.gridStrong, strokeOpacity: 0.32, strokeWidth: 1 }}
              >
                {enhancedData.map((point) => (
                <Cell key={`${point.measuredAt}-${point.glucoseValue}`} fill={resolveColorByStatus(chartTheme, point.status)} fillOpacity={0.74} />
              ))}
            </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {enhancedData.length > 0 && view === "TREND" ? (
        <div className="chart-wrap chart-wrap-enhanced">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={enhancedData} margin={{ top: 18, right: 12, bottom: 10, left: -4 }}>
              <defs>
                <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartTheme.accent} stopOpacity={0.14} />
                  <stop offset="100%" stopColor={chartTheme.accent} stopOpacity={0.015} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 7" vertical={false} />
              <XAxis
                dataKey="measuredAt"
                tickFormatter={formatAxisLabel}
                interval="preserveStartEnd"
                minTickGap={40}
                tick={{ fill: chartTheme.tick, fontSize: 11 }}
                axisLine={{ stroke: chartTheme.gridStrong, strokeOpacity: 0.4 }}
                tickLine={false}
                dy={8}
              />
              <YAxis
                domain={yDomain}
                tick={{ fill: chartTheme.tick, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                content={<VisualizationTooltip theme={chartTheme} metricLabel="Promedio movil" />}
                cursor={{ stroke: chartTheme.gridStrong, strokeDasharray: "2 6", strokeOpacity: 0.55 }}
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
                strokeOpacity={0.24}
                strokeWidth={1.4}
                dot={false}
                isAnimationActive
                animationDuration={420}
              />
              <Line
                type="monotone"
                dataKey="trendValue"
                stroke={chartTheme.accent}
                strokeWidth={2.6}
                dot={false}
                activeDot={{ r: 4.5, fill: chartTheme.accent, stroke: chartTheme.tooltipBackground, strokeWidth: 2 }}
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

"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ChartPoint } from "@/features/dashboard/types";

type Props = {
  data: ChartPoint[];
};
// Formateadores de fecha ya adaptados a la localización "es-CO"
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

// Componente de gráfico de glucosa utilizando Recharts
export function GlucoseChart({ data }: Props) {
  const [chartTheme, setChartTheme] = useState({
    lineStart: "#7dc0ff",
    lineEnd: "#3a88dc",
    grid: "#1c2b48",
    tick: "#8fa7d5",
    tooltipBackground: "#0f1626",
    tooltipBorder: "#2e4267",
    tooltipText: "#dce8ff",
    activeDot: "#8ec4ff"
  });

  useEffect(() => {
    const root = document.documentElement;

    const syncChartTheme = () => {
      const styles = window.getComputedStyle(root);
      setChartTheme({
        lineStart: styles.getPropertyValue("--chart-line-start").trim() || "#7dc0ff",
        lineEnd: styles.getPropertyValue("--chart-line-end").trim() || "#3a88dc",
        grid: styles.getPropertyValue("--chart-grid").trim() || "#1c2b48",
        tick: styles.getPropertyValue("--text-secondary").trim() || "#8fa7d5",
        tooltipBackground: styles.getPropertyValue("--chart-tooltip-bg").trim() || "#0f1626",
        tooltipBorder: styles.getPropertyValue("--chart-tooltip-border").trim() || "#2e4267",
        tooltipText: styles.getPropertyValue("--chart-tooltip-text").trim() || "#dce8ff",
        activeDot: styles.getPropertyValue("--accent").trim() || "#8ec4ff"
      });
    };

    syncChartTheme();

    const observer = new MutationObserver(syncChartTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-color-mode", "data-accent-theme"]
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 8, bottom: 6, left: 0 }}>
          <defs>
            <linearGradient id="glucoseLineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartTheme.lineStart} />
              <stop offset="100%" stopColor={chartTheme.lineEnd} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={chartTheme.grid} strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="measuredAt"
            tickFormatter={formatAxisLabel}
            interval="preserveStartEnd"
            minTickGap={36}
            tick={{ fill: chartTheme.tick, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fill: chartTheme.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: chartTheme.tooltipBackground,
              border: `1px solid ${chartTheme.tooltipBorder}`,
              borderRadius: "12px",
              color: chartTheme.tooltipText,
              boxShadow: "0 12px 24px rgba(0, 0, 0, 0.35)"
            }}
            labelFormatter={(value) => formatTooltipLabel(String(value))}
            formatter={(value: number) => [`${value} mg/dL`, "Glucosa"]}
          />
          <Line
            type="monotone"
            dataKey="glucoseValue"
            stroke="url(#glucoseLineGradient)"
            strokeWidth={3.2}
            dot={false}
            activeDot={{ r: 4, fill: chartTheme.activeDot }}
            isAnimationActive
            animationDuration={760}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

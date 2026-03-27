"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ChartPoint } from "@/features/dashboard/types";

type Props = {
  data: ChartPoint[];
};

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

export function GlucoseChart({ data }: Props) {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 8, bottom: 6, left: 0 }}>
          <defs>
            <linearGradient id="glucoseLineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7dc0ff" />
              <stop offset="100%" stopColor="#3a88dc" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1c2b48" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="measuredAt"
            tickFormatter={formatAxisLabel}
            interval="preserveStartEnd"
            minTickGap={36}
            tick={{ fill: "#8fa7d5", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fill: "#8fa7d5", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "#0f1626",
              border: "1px solid #2e4267",
              borderRadius: "12px",
              color: "#dce8ff",
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
            activeDot={{ r: 4, fill: "#8ec4ff" }}
            isAnimationActive
            animationDuration={760}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

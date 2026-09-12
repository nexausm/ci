"use client";

import { cn } from "@/lib/utils";
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipValueType } from "recharts";
import { TICK_STYLE, TOOLTIP_STYLE, formatCompact } from "./chart-utils";
import type { ChartPoint } from "./chart-utils";

export type ChartSeries = {
  name: string;
  color: string;
  points: ChartPoint[];
};

export function LineChart({
  series,
  className,
}: {
  series: ChartSeries[];
  className?: string;
}) {
  const data = series[0]?.points.map((point, i) => ({
    label: point.label,
    ...Object.fromEntries(
      series.map((s) => [`series-${s.name}`, s.points[i]?.value ?? 0]),
    ),
  }));

  return (
    <div className={cn("h-65 w-full sm:h-75", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="currentColor"
            strokeOpacity={0.12}
          />
          <XAxis
            dataKey="label"
            tick={TICK_STYLE}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tickFormatter={formatCompact}
            tick={{ ...TICK_STYLE, fontSize: 10, fillOpacity: 0.5 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(
              value: TooltipValueType | undefined,
              name: number | string | undefined,
            ) => [
              Number(value ?? 0).toLocaleString("en-US"),
              String(name ?? "").replace(/^series-/, ""),
            ]}
          />
          {series.map((s) => (
            <Line
              key={s.name}
              type="monotone"
              dataKey={`series-${s.name}`}
              name={s.name}
              stroke={s.color}
              strokeWidth={2.5}
              dot={{ r: 3.5, strokeWidth: 1.5, stroke: "#fff" }}
              activeDot={{ r: 5 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

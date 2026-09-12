"use client";

import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipValueType } from "recharts";
import { TICK_STYLE, TOOLTIP_STYLE, formatCompact } from "./chart-utils";
import type { ChartPoint } from "./chart-utils";

const LINE_COLOR = "#3b82f6";

export function AreaChart({
  data,
  className,
}: {
  data: ChartPoint[];
  className?: string;
}) {
  return (
    <div className={cn("h-65 w-full sm:h-75", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient
              id="dashboard-area-fill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={LINE_COLOR} stopOpacity={0.28} />
              <stop offset="100%" stopColor={LINE_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
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
            formatter={(value: TooltipValueType | undefined) => [
              Number(value ?? 0).toLocaleString("en-US"),
              "Invoiced",
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={LINE_COLOR}
            strokeWidth={2.5}
            fill="url(#dashboard-area-fill)"
            dot={{ r: 3.5 }}
            activeDot={{ r: 5 }}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

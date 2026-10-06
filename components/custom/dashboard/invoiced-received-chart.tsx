"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMoney } from "@/lib/totals";
import { formatCompact } from "./chart-utils";

export type MonthlyPoint = {
  label: string;
  invoiced: number;
  received: number;
};

const chartConfig = {
  invoiced: { label: "Invoiced", color: "var(--chart-1)" },
  received: { label: "Received", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function InvoicedReceivedChart({
  data,
  symbol,
}: {
  data: MonthlyPoint[];
  symbol: string;
}) {
  return (
    <ChartContainer config={chartConfig} className="h-65 w-full sm:h-75">
      <AreaChart accessibilityLayer data={data} margin={{ left: 0, right: 10 }}>
        <defs>
          <linearGradient id="fill-invoiced" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-invoiced)"
              stopOpacity={0.7}
            />
            <stop
              offset="95%"
              stopColor="var(--color-invoiced)"
              stopOpacity={0.05}
            />
          </linearGradient>
          <linearGradient id="fill-received" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-received)"
              stopOpacity={0.7}
            />
            <stop
              offset="95%"
              stopColor="var(--color-received)"
              stopOpacity={0.05}
            />
          </linearGradient>
        </defs>

        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickFormatter={formatCompact}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="line"
              formatter={(value, name) => [
                formatMoney(Number(value ?? 0), symbol),
                String(name),
              ]}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          dataKey="invoiced"
          type="natural"
          fill="url(#fill-invoiced)"
          stroke="var(--color-invoiced)"
          strokeWidth={2}
          isAnimationActive={false}
        />
        <Area
          dataKey="received"
          type="natural"
          fill="url(#fill-received)"
          stroke="var(--color-received)"
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}

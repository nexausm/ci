"use client";

import { Cell, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export type DoughnutSegment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

export function DoughnutChart({
  data,
  size = 190,
  thickness = 26,
  className,
}: {
  data: DoughnutSegment[];
  size?: number;
  thickness?: number;
  className?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const innerRadius = (size - thickness) / 2;

  const config = Object.fromEntries(
    data.map((d) => [d.key, { label: d.label, color: d.color }]),
  ) as ChartConfig;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      data-slot="doughnut-chart"
    >
      <ChartContainer
        config={config}
        className={`aspect-auto ${className ?? ""}`}
        initialDimension={{ width: size, height: size }}
      >
        <PieChart accessibilityLayer>
          <ChartTooltip
            content={
              <ChartTooltipContent
                nameKey="label"
                hideLabel
                hideIndicator
                formatter={(value) =>
                  Number(value ?? 0).toLocaleString("en-US")
                }
              />
            }
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={innerRadius}
            outerRadius={size / 2}
            paddingAngle={data.length > 1 ? 1.5 : 0}
            cornerRadius={2}
            stroke="none"
            startAngle={90}
            endAngle={-270}
            isAnimationActive={false}
          >
            {data.map((segment) => (
              <Cell key={segment.key} fill={`var(--color-${segment.key})`} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      {total > 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-semibold">{total}</span>
        </div>
      )}
    </div>
  );
}

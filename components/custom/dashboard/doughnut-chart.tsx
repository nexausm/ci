"use client";

import { cn } from "@/lib/utils";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export type DoughnutSegment = {
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

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
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
          >
            {data.map((segment) => (
              <Cell key={segment.label} fill={segment.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              return (
                <div className="border-border bg-card text-card-foreground rounded-lg border px-3 py-1.5 text-sm font-medium shadow-sm">
                  {Number(payload[0].value ?? 0).toLocaleString("en-US")}
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {total > 0 && (
        <div className="text-card-foreground pointer-events-none absolute inset-0 flex items-center justify-center text-2xl font-semibold">
          {total}
        </div>
      )}
    </div>
  );
}

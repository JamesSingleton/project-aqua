"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "@project-aqua/ui/components/chart";
import { cn } from "@project-aqua/ui/lib/utils";

function volumeChartConfig(unitLabel: string) {
  return {
    distance: {
      label: unitLabel,
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;
}

const attendanceConfig = {
  rate: {
    label: "Attendance %",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function shortDate(value: string) {
  const [, month, day] = value.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function VolumeChart({
  data,
  className,
  distanceUnit,
}: {
  data: Array<{ date: string; distance: number }>;
  className?: string;
  distanceUnit?: "yards" | "meters" | null;
}) {
  if (data.every((d) => d.distance === 0)) {
    return (
      <p className="text-muted-foreground text-sm">
        No workout volume in the last 30 days.
      </p>
    );
  }

  const unitLabel =
    distanceUnit === "meters"
      ? "Meters"
      : distanceUnit === "yards"
        ? "Yards"
        : "Distance";
  const unitSuffix =
    distanceUnit === "meters" ? "m" : distanceUnit === "yards" ? "yd" : "";

  return (
    <ChartContainer
      config={volumeChartConfig(unitLabel)}
      className={cn("aspect-auto h-64 min-h-[256px] w-full", className)}
    >
      <BarChart accessibilityLayer data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={shortDate}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) =>
            Number(v) >= 1000 ? `${Math.round(Number(v) / 1000)}k` : String(v)
          }
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) => String(value)}
              formatter={(value) => (
                <span className="font-mono">
                  {Number(value).toLocaleString()}
                  {unitSuffix ? ` ${unitSuffix}` : ""}
                </span>
              )}
            />
          }
        />
        <Bar
          dataKey="distance"
          fill="var(--color-distance)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}

export function AttendanceChart({
  data,
  className,
}: {
  data: Array<{ date: string; rate: number; present: number; total: number }>;
  className?: string;
}) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No attendance recorded in the last 30 days.
      </p>
    );
  }

  return (
    <ChartContainer
      config={attendanceConfig}
      className={cn("aspect-auto h-64 min-h-[256px] w-full", className)}
    >
      <LineChart accessibilityLayer data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={shortDate}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={40}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) => String(value)}
              formatter={(value, _name, item) => {
                const row = item.payload as {
                  present?: number;
                  total?: number;
                };
                return (
                  <span className="font-mono">
                    {Number(value)}%
                    {row.present != null && row.total != null
                      ? ` (${row.present}/${row.total})`
                      : ""}
                  </span>
                );
              }}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="rate"
          stroke="var(--color-rate)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

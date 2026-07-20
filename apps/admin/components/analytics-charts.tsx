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

const volumeConfig = {
  distance: {
    label: "Yards",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

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
}: {
  data: Array<{ date: string; distance: number }>;
}) {
  if (data.every((d) => d.distance === 0)) {
    return (
      <p className="text-muted-foreground text-sm">
        No workout volume in the last 30 days.
      </p>
    );
  }

  return (
    <ChartContainer
      config={volumeConfig}
      className="aspect-auto h-64 min-h-[256px] w-full"
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
                  {Number(value).toLocaleString()} yd
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
}: {
  data: Array<{ date: string; rate: number; present: number; total: number }>;
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
      className="aspect-auto h-64 min-h-[256px] w-full"
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
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={(v) => `${v}%`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) => String(value)}
              formatter={(value, _name, item) => {
                const payload = item?.payload as
                  | { present?: number; total?: number }
                  | undefined;
                return (
                  <span>
                    {Number(value)}%
                    {payload?.total != null
                      ? ` (${payload.present}/${payload.total})`
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
          dot={{ r: 3, fill: "var(--color-rate)" }}
        />
      </LineChart>
    </ChartContainer>
  );
}

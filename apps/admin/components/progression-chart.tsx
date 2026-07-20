"use client";

import { formatTime } from "@project-aqua/swim-core/times";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ProgressionChart({
  points,
}: {
  points: Array<{ date: string; timeMs: number; label: string }>;
}) {
  if (points.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Import meet results to see progression over time.
      </p>
    );
  }

  const data = points.map((p) => ({
    ...p,
    display: formatTime(p.timeMs),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis
            reversed
            tickFormatter={(v) => formatTime(Number(v))}
            width={64}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value) => formatTime(Number(value))}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
          />
          <Line
            type="monotone"
            dataKey="timeMs"
            stroke="var(--timing)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { formatBestTimeEventLabel } from "@project-aqua/swim-core/team-types";
import { formatTime } from "@project-aqua/swim-core/times";
import {
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
import { Label } from "@project-aqua/ui/components/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/ui/components/select";
import { useMemo, useState } from "react";

export type SwimmerSeriesPoint = {
  eventKey: string;
  eventLabel: string | null;
  eventGender: string | null;
  course: string | null;
  timeMs: number;
  meetDate: Date | string;
  meetName: string;
  source?: "meet" | "manual";
};

function toDateKey(value: Date | string) {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

/** Fastest swim per date+label for one event. */
function pointsBySwim(rows: SwimmerSeriesPoint[]) {
  const byKey = new Map<
    string,
    { date: string; timeMs: number; meetName: string }
  >();

  for (const row of rows) {
    const date = toDateKey(row.meetDate);
    const source = row.source ?? "meet";
    const key = `${date}::${source}::${row.meetName}`;
    const existing = byKey.get(key);
    if (!existing || row.timeMs < existing.timeMs) {
      byKey.set(key, { date, timeMs: row.timeMs, meetName: row.meetName });
    }
  }

  return [...byKey.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => ({
      ...p,
      display: formatTime(p.timeMs),
    }));
}

const timeConfig = {
  timeMs: {
    label: "Time",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function SwimmerEventChart({
  series,
  teamType,
}: {
  series: SwimmerSeriesPoint[];
  teamType?: string | null;
}) {
  const events = useMemo(() => {
    const counts = new Map<string, number>();
    const labels = new Map<string, string>();
    for (const row of series) {
      counts.set(row.eventKey, (counts.get(row.eventKey) ?? 0) + 1);
      if (!labels.has(row.eventKey)) {
        labels.set(
          row.eventKey,
          formatBestTimeEventLabel(
            row.eventLabel,
            row.course ?? "SCY",
            row.eventGender,
            teamType,
          ),
        );
      }
    }
    return [...counts.entries()]
      .map(([eventKey, count]) => ({
        eventKey,
        count,
        label: labels.get(eventKey) ?? eventKey,
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [series, teamType]);

  const defaultEvent = events[0]?.eventKey ?? "";
  const [selectedEvent, setSelectedEvent] = useState(defaultEvent);
  const activeEvent =
    events.some((e) => e.eventKey === selectedEvent) && selectedEvent
      ? selectedEvent
      : defaultEvent;

  const activeLabel =
    events.find((e) => e.eventKey === activeEvent)?.label ?? "Event";

  const chartData = useMemo(
    () => pointsBySwim(series.filter((r) => r.eventKey === activeEvent)),
    [series, activeEvent],
  );

  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 1] as [number, number];
    let min = chartData[0]!.timeMs;
    let max = min;
    for (const point of chartData) {
      if (point.timeMs < min) min = point.timeMs;
      if (point.timeMs > max) max = point.timeMs;
    }
    const pad = Math.max(500, Math.round((max - min) * 0.2) || 1000);
    return [min - pad, max + pad] as [number, number];
  }, [chartData]);

  const eventOptions = useMemo(
    () =>
      events.map((event) => ({
        value: event.eventKey,
        label: `${event.label} (${event.count})`,
      })),
    [events],
  );

  if (series.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No times yet. Import meet results or add a best time to see progression.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="swimmer-event">Event</Label>
          <Select
            items={eventOptions}
            value={activeEvent}
            onValueChange={(value) => {
              if (value != null) setSelectedEvent(value);
            }}
          >
            <SelectTrigger id="swimmer-event" className="w-full sm:w-[320px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {eventOptions.map((event) => (
                  <SelectItem key={event.value} value={event.value}>
                    {event.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <p className="text-muted-foreground text-sm">
          Lower is faster · {activeLabel}
        </p>
      </div>

      {chartData.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No results for this event.
        </p>
      ) : chartData.length === 1 && chartData[0] ? (
        <div className="rounded-lg border bg-muted/30 px-4 py-6 text-center">
          <p className="text-muted-foreground text-sm">
            {chartData[0].meetName}
          </p>
          <p className="font-timing text-3xl tabular-nums mt-1">
            {chartData[0].display}
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            Add more times to see a trend line
          </p>
        </div>
      ) : (
        <ChartContainer
          config={timeConfig}
          className="aspect-auto h-72 min-h-[288px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 8, right: 12, top: 8, bottom: 8 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const parts = String(value).split("-");
                return `${Number(parts[1])}/${Number(parts[2])}`;
              }}
            />
            <YAxis
              reversed
              domain={yDomain}
              tickLine={false}
              axisLine={false}
              width={72}
              tickFormatter={(v) => formatTime(Number(v))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelKey="meetName"
                  labelFormatter={(_value, payload) => {
                    const point = payload?.[0]?.payload as
                      | { meetName?: string; date?: string }
                      | undefined;
                    if (!point) return "";
                    return point.meetName
                      ? `${point.meetName} · ${point.date}`
                      : (point.date ?? "");
                  }}
                  formatter={(value) => (
                    <span className="font-timing font-mono">
                      {formatTime(Number(value))}
                    </span>
                  )}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="timeMs"
              stroke="var(--color-timeMs)"
              strokeWidth={2.5}
              dot={{
                r: 4,
                fill: "var(--color-timeMs)",
                strokeWidth: 0,
              }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      )}
    </div>
  );
}

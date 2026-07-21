import { formatDateOnly } from "@project-aqua/swim-core/calendar-date";
import { Button } from "@project-aqua/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

function daysUntil(dateOnly: string, todayKey: string): number {
  const start = new Date(`${dateOnly}T12:00:00`);
  const today = new Date(`${todayKey}T12:00:00`);
  return Math.ceil((start.getTime() - today.getTime()) / 86_400_000);
}

export function NextCompetitionCard({
  teamId,
  todayKey,
  meet,
}: {
  teamId: string;
  todayKey: string;
  meet: {
    id: string;
    name: string;
    startDate: Date;
    location: string | null;
    committedCount: number;
  } | null;
}) {
  const shellClassName =
    "relative shrink-0 overflow-hidden rounded-2xl px-5 py-4 text-primary-foreground";
  const shellStyle = {
    background:
      "linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary) 72%, black))",
  } as const;

  if (!meet) {
    return (
      <div className={shellClassName} style={shellStyle}>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-primary-foreground/70">
            Next competition
          </p>
          <p className="text-sm leading-tight font-bold">No upcoming meets</p>
          <p className="mt-0.5 text-xs text-primary-foreground/60">
            Import a meet to start planning entries.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="mt-3 w-fit"
          nativeButton={false}
          render={<Link href={`/team/${teamId}/meets/import`} />}
        >
          Import meet
          <ArrowRightIcon className="size-3.5" />
        </Button>
      </div>
    );
  }

  const dateKey = formatDateOnly(meet.startDate);
  const days = daysUntil(dateKey, todayKey);
  const dateLabel = meet.startDate.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  const countdownLabel =
    days <= 0 ? "today" : days === 1 ? "day away" : "days away";
  const countdownValue = days <= 0 ? "0" : String(days);
  const athleteLabel =
    meet.committedCount > 0
      ? `${meet.committedCount} committed`
      : meet.location?.trim() || "Entries open";

  return (
    <div className={shellClassName} style={shellStyle}>
      <Link
        href={`/team/${teamId}/meets/${meet.id}`}
        className="relative flex items-center justify-between gap-4 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/40"
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-xs font-medium text-primary-foreground/70">
            Next competition
          </p>
          <p className="truncate text-sm leading-tight font-bold">
            {meet.name}
          </p>
          <p className="text-xs text-primary-foreground/60">
            {dateLabel} · {athleteLabel}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-timing text-4xl leading-none font-semibold tabular-nums">
            {countdownValue}
          </p>
          <p className="mt-1 text-[11px] font-medium text-primary-foreground/70">
            {countdownLabel}
          </p>
        </div>
      </Link>
    </div>
  );
}

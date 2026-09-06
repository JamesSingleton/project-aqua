import {
  formatDateOnly,
  formatDateOnlyLabel,
} from "@project-aqua/swim-core/calendar-date";
import { Badge } from "@project-aqua/ui/components/badge";

const DATE_LABEL = {
  month: "short",
  day: "numeric",
  year: "numeric",
} as const;

function meetDateLine(startDate: Date, endDate: Date | null) {
  const start = formatDateOnlyLabel(startDate, undefined, DATE_LABEL);
  if (!endDate || formatDateOnly(startDate) === formatDateOnly(endDate)) {
    return start;
  }
  const sameMonthYear =
    startDate.getUTCMonth() === endDate.getUTCMonth() &&
    startDate.getUTCFullYear() === endDate.getUTCFullYear();
  if (sameMonthYear) {
    return `${formatDateOnlyLabel(startDate, undefined, { month: "short", day: "numeric" })}–${formatDateOnlyLabel(endDate, undefined, { day: "numeric", year: "numeric" })}`;
  }
  return `${start} – ${formatDateOnlyLabel(endDate, undefined, DATE_LABEL)}`;
}

export function MeetMasthead({
  startDate,
  endDate,
  course,
  entryDeadline,
  location,
  address,
  opponents,
}: {
  startDate: Date;
  endDate: Date | null;
  course: string;
  entryDeadline: Date | null;
  location: string | null;
  address: string | null;
  opponents: string | null;
}) {
  const venue = location?.trim() || null;
  const street = address?.trim() || null;

  return (
    <dl className="mt-2 flex max-w-xl flex-col gap-1 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <dt className="sr-only">Date</dt>
        <dd className="font-timing text-foreground text-base leading-snug font-semibold tabular-nums tracking-tight sm:text-lg sm:leading-none">
          {meetDateLine(startDate, endDate)}
        </dd>
        <dt className="sr-only">Course</dt>
        <dd>
          <Badge>{course}</Badge>
        </dd>
      </div>
      {entryDeadline ? (
        <div>
          <dt className="sr-only">Entry deadline</dt>
          <dd className="text-muted-foreground">
            Entries due{" "}
            {formatDateOnlyLabel(entryDeadline, undefined, DATE_LABEL)}
          </dd>
        </div>
      ) : null}
      {venue ? (
        <div>
          <dt className="sr-only">Venue</dt>
          <dd className="text-foreground">{venue}</dd>
        </div>
      ) : null}
      {street ? (
        <div>
          <dt className="sr-only">Address</dt>
          <dd className="text-muted-foreground text-pretty">{street}</dd>
        </div>
      ) : null}
      {opponents?.trim() ? (
        <div>
          <dt className="sr-only">Opponents</dt>
          <dd className="text-muted-foreground text-pretty">
            vs {opponents.trim()}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

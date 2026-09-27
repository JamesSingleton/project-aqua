import type { getTeamCalendarProjection } from "@lane4hq/db/queries/calendar";

type ProjectedEvent = Awaited<
  ReturnType<typeof getTeamCalendarProjection>
>[number];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIcsDate(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function buildIcsCalendar(
  teamName: string,
  events: ProjectedEvent[],
): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lane4 HQ//Team Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(teamName)}`,
  ];

  for (const event of events) {
    const end =
      event.endsAt ?? new Date(event.startsAt.getTime() + 60 * 60 * 1000);
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${escapeText(event.id)}@lane4hq`);
    lines.push(`DTSTAMP:${toIcsDate(new Date())}`);
    lines.push(`DTSTART:${toIcsDate(event.startsAt)}`);
    lines.push(`DTEND:${toIcsDate(end)}`);
    lines.push(`SUMMARY:${escapeText(event.title)}`);
    if (event.location) {
      lines.push(`LOCATION:${escapeText(event.location)}`);
    }
    if (event.description?.trim()) {
      lines.push(`DESCRIPTION:${escapeText(event.description.trim())}`);
    }
    lines.push(`CATEGORIES:${event.eventType.toUpperCase()}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

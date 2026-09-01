import { formatDateOnlyLabel } from "@project-aqua/swim-core/calendar-date";
import { isRelayStroke } from "@project-aqua/swim-core/entry-limits";
import {
  formatEventName,
  formatGenderShort,
} from "@project-aqua/swim-core/events";
import { formatTime } from "@project-aqua/swim-core/times";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMeetDetailAction } from "../../actions";
import { getMeetRelayLegsAction } from "../../relay-actions";
import { PrintReportButton } from "./print-report-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string; meetId: string }>;
}): Promise<Metadata> {
  const { teamId, meetId } = await params;
  const detail = await getMeetDetailAction(teamId, meetId);
  if (!detail) return {};
  return { title: `${detail.meet.name} - Entry report` };
}

export default async function MeetEntryReportPage({
  params,
}: {
  params: Promise<{ teamId: string; meetId: string }>;
}) {
  const { teamId, meetId } = await params;
  const detail = await getMeetDetailAction(teamId, meetId);
  if (!detail) notFound();

  const { meet, events, entries, roster } = detail;
  const relayLegs = await getMeetRelayLegsAction(teamId, meetId);
  const activeEntries = entries.filter((e) => e.status !== "scratched");
  const individualIds = new Set(
    activeEntries
      .filter((e) => !isRelayStroke(e.stroke, e.eventKey))
      .map((e) => e.membershipId),
  );
  const relayLegIds = new Set(relayLegs.map((leg) => leg.membershipId));
  const exportIds = new Set([
    ...activeEntries.map((e) => e.membershipId),
    ...relayLegIds,
  ]);
  const exportRoster = roster.filter((r) => exportIds.has(r.membershipId));
  const relaysOnly = exportRoster.filter(
    (r) =>
      relayLegIds.has(r.membershipId) && !individualIds.has(r.membershipId),
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 print:max-w-none">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <p className="text-muted-foreground text-sm">
          Paper review before you export the host pack.
        </p>
        <PrintReportButton />
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{meet.name}</h1>
        <p className="text-muted-foreground text-sm">
          {formatDateOnlyLabel(meet.startDate)}
          {meet.endDate ? ` – ${formatDateOnlyLabel(meet.endDate)}` : ""} ·{" "}
          {meet.course}
          {meet.location ? ` · ${meet.location}` : ""}
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-sm font-medium tracking-wide uppercase">
          Meet roster
        </h2>
        <p className="text-muted-foreground text-sm">
          {exportRoster.length} on host export
          {relaysOnly.length > 0 ? ` · ${relaysOnly.length} relays only` : ""}
        </p>
        <ul className="divide-border divide-y rounded-md border text-sm">
          {exportRoster.map((r) => (
            <li key={r.membershipId} className="flex justify-between px-3 py-2">
              <span>
                {r.firstName} {r.lastName}
              </span>
              <span className="text-muted-foreground">
                {individualIds.has(r.membershipId)
                  ? `${activeEntries.filter((e) => e.membershipId === r.membershipId).length} events`
                  : "Relays only"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium tracking-wide uppercase">
          Individual entries
        </h2>
        <ul className="divide-border divide-y rounded-md border text-sm">
          {activeEntries
            .filter((e) => !isRelayStroke(e.stroke, e.eventKey))
            .map((entry) => (
              <li
                key={entry.id}
                className="flex justify-between gap-3 px-3 py-2"
              >
                <span>
                  {entry.firstName} {entry.lastName} · #
                  {entry.eventNumber ?? "—"} {formatGenderShort(entry.gender)}{" "}
                  {formatEventName(entry.distance, entry.stroke)}
                </span>
                <span className="font-timing shrink-0 tabular-nums">
                  {entry.seedTimeMs != null
                    ? formatTime(entry.seedTimeMs)
                    : "NT"}
                  {entry.exhibition ? " ex" : ""}
                </span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}

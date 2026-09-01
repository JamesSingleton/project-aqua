import { getMeetResultsDetailed } from "@project-aqua/db/queries/meets";
import { formatEventName } from "@project-aqua/swim-core/events";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMeetDetailAction } from "../../actions";
import { listTimeStandardSetsAction } from "../../time-standards-actions";
import { MeetResultsCsvImport } from "./meet-results-csv-import";
import { ResultsWorkspace } from "./results-workspace";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string; meetId: string }>;
}): Promise<Metadata> {
  const { teamId, meetId } = await params;
  const detail = await getMeetDetailAction(teamId, meetId);
  if (!detail) return {};
  return { title: `${detail.meet.name} - Results` };
}

export default async function MeetResultsPage({
  params,
}: {
  params: Promise<{ teamId: string; meetId: string }>;
}) {
  const { teamId, meetId } = await params;
  const detail = await getMeetDetailAction(teamId, meetId);
  if (!detail) notFound();

  const { meet, events, roster } = detail;
  const [results, standardSets] = await Promise.all([
    getMeetResultsDetailed(meetId),
    listTimeStandardSetsAction(teamId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-muted-foreground text-sm">
        <Link
          href={`/team/${teamId}/meets/results`}
          className="hover:text-foreground underline-offset-4 hover:underline"
        >
          All results
        </Link>
        <span className="mx-1.5">/</span>
        <Link
          href={`/team/${teamId}/meets/${meetId}/entries`}
          className="hover:text-foreground underline-offset-4 hover:underline"
        >
          Entries
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <MeetResultsCsvImport teamId={teamId} meetId={meetId} />
      </div>

      <ResultsWorkspace
        teamId={teamId}
        meetId={meetId}
        meetName={meet.name}
        meetStartDate={meet.startDate}
        results={results.map((r) => ({
          id: r.id,
          meetEventId: r.meetEventId,
          swimmerId: r.swimmerId,
          timeMs: r.timeMs,
          previousBestTimeMs: r.previousBestTimeMs,
          place: r.place,
          isDq: r.isDq,
          round: r.round,
          heat: r.heat,
          lane: r.lane,
          exhibition: r.exhibition,
          dqCode: r.dqCode,
          firstName: r.firstName,
          lastName: r.lastName,
          dateOfBirth: r.dateOfBirth,
          eventNumber: r.eventNumber,
          distance: r.distance,
          stroke: r.stroke,
          gender: r.gender,
          ageGroup: r.ageGroup,
          eventKey: r.eventKey,
        }))}
        events={events
          .filter((event) => event.eventKind !== "dive")
          .map((event) => ({
            id: event.id,
            label: `#${event.eventNumber ?? "—"} ${formatEventName(event.distance, event.stroke)}`,
          }))}
        swimmers={roster.map((r) => ({
          swimmerId: r.swimmerId,
          name: `${r.firstName} ${r.lastName}`,
        }))}
        standardSets={standardSets.map((s) => ({
          id: s.id,
          name: s.name,
          course: s.course,
          seasonLabel: s.seasonLabel,
        }))}
      />
    </div>
  );
}

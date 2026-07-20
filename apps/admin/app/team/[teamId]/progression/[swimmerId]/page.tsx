import { getOrganizationTeamType } from "@project-aqua/db/authz";
import {
  getSwimmerBestTimes,
  getSwimmerMeetHistory,
  getSwimmerResultSeries,
} from "@project-aqua/db/queries/progression";
import { getRoster, getSwimmerById } from "@project-aqua/db/queries/roster";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SetBreadcrumbEntity } from "@/components/breadcrumb-entities";
import { PageHeader } from "@/components/page-header";
import { SwimmerProgressionPanel } from "@/components/swimmer-progression-panel";
import { ProgressionSwimmerPicker } from "../progression-swimmer-picker";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string; swimmerId: string }>;
}): Promise<Metadata> {
  const { teamId, swimmerId } = await params;
  const swimmer = await getSwimmerById(swimmerId, teamId);
  const name = swimmer
    ? (swimmer.preferredName ?? `${swimmer.firstName} ${swimmer.lastName}`)
    : "Progression";
  return {
    title: `${name} · Progression`,
    description: "Swimmer time trends and meet history.",
  };
}

export default async function ProgressionSwimmerPage({
  params,
}: {
  params: Promise<{ teamId: string; swimmerId: string }>;
}) {
  const { teamId, swimmerId } = await params;

  const [roster, swimmer, teamType, series, bestTimes, meetHistory] =
    await Promise.all([
      getRoster(teamId),
      getSwimmerById(swimmerId, teamId),
      getOrganizationTeamType(teamId),
      getSwimmerResultSeries(swimmerId),
      getSwimmerBestTimes(swimmerId),
      getSwimmerMeetHistory(swimmerId),
    ]);

  if (!swimmer) notFound();

  const displayName =
    swimmer.preferredName?.trim() ||
    `${swimmer.firstName} ${swimmer.lastName}`;

  const listSwimmers = roster.map((s) => ({
    swimmerId: s.swimmerId,
    firstName: s.firstName,
    lastName: s.lastName,
    preferredName: s.preferredName,
    groupName: s.groupName,
  }));

  const chartSeries = series.map((row) => ({
    eventKey: row.eventKey,
    eventLabel: row.eventLabel,
    eventGender: row.eventGender,
    course: row.course,
    timeMs: row.timeMs,
    meetDate: row.meetDate.toISOString().slice(0, 10),
    meetName: row.meetName,
  }));

  return (
    <div className="flex flex-col gap-6">
      <SetBreadcrumbEntity id={swimmerId} label={displayName} />
      <PageHeader
        title="Progression"
        description="Time trends, best times, and meet history."
      />

      <ProgressionSwimmerPicker
        teamId={teamId}
        swimmers={listSwimmers}
        selectedId={swimmerId}
      />

      <SwimmerProgressionPanel
        series={chartSeries}
        bestTimes={bestTimes}
        meetHistory={meetHistory}
        teamType={teamType}
      />
    </div>
  );
}

import { getSession } from "@project-aqua/auth/session";
import {
  getOrganizationTeamType,
  requireSwimmerTeamAccess,
} from "@project-aqua/db/authz";
import {
  getSwimmerBestTimes,
  getSwimmerMeetHistory,
  getSwimmerResultSeries,
} from "@project-aqua/db/queries/progression";
import type { Metadata } from "next";
import { SwimmerProgressionPanel } from "@/components/swimmer-progression-panel";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Progression" };
}

export default async function SwimmerProgressionPage({
  params,
}: {
  params: Promise<{ teamId: string; swimmerId: string }>;
}) {
  const { teamId, swimmerId } = await params;
  const session = await getSession();
  await requireSwimmerTeamAccess(session?.user?.id, swimmerId, teamId);

  const [teamType, series, bestTimes, meetHistory] = await Promise.all([
    getOrganizationTeamType(teamId),
    getSwimmerResultSeries(swimmerId),
    getSwimmerBestTimes(swimmerId),
    getSwimmerMeetHistory(swimmerId),
  ]);

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
    <SwimmerProgressionPanel
      series={chartSeries}
      bestTimes={bestTimes}
      meetHistory={meetHistory}
      teamType={teamType}
    />
  );
}

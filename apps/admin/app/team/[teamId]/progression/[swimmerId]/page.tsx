import { isCoachingRole } from "@project-aqua/auth/roles";
import { getSession } from "@project-aqua/auth/session";
import { getMember, getOrganizationTeamType } from "@project-aqua/db/authz";
import {
  getSwimmerBestTimes,
  getSwimmerResultSeries,
  getSwimmerTimeHistory,
} from "@project-aqua/db/queries/progression";
import { getRoster, getSwimmerById } from "@project-aqua/db/queries/roster";
import {
  ensureCurrentSeason,
  listTeamSeasons,
} from "@project-aqua/db/queries/seasons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SetBreadcrumbEntity } from "@/components/breadcrumb-entities";
import { PageHeader } from "@/components/page-header";
import { SwimmerProgressionPanel } from "@/components/swimmer-progression-panel";
import { ImportTimesCsvButton } from "../import-times-csv-button";
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
    description: "Swimmer time trends and history.",
  };
}

function resolveSeasonParam(
  seasonParam: string | undefined,
  seasons: Awaited<ReturnType<typeof listTeamSeasons>>,
  currentSeason: Awaited<ReturnType<typeof ensureCurrentSeason>>,
): {
  selectedId: string;
  range?: { startsOn: string; endsOn: string };
} {
  if (seasonParam === "all") {
    return { selectedId: "all" };
  }
  const selected =
    (seasonParam ? seasons.find((s) => s.id === seasonParam) : null) ??
    seasons.find((s) => s.isCurrent) ??
    currentSeason;
  return {
    selectedId: selected.id,
    range: { startsOn: selected.startsOn, endsOn: selected.endsOn },
  };
}

export default async function ProgressionSwimmerPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string; swimmerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { teamId, swimmerId } = await params;
  const rawParams = await searchParams;
  const seasonParam =
    typeof rawParams.season === "string" ? rawParams.season : undefined;
  const session = await getSession();

  const currentSeasonPromise = ensureCurrentSeason(teamId);
  const seasonsPromise = currentSeasonPromise.then(() =>
    listTeamSeasons(teamId),
  );

  const [roster, swimmer, teamType, membership, currentSeason, seasons] =
    await Promise.all([
      getRoster(teamId),
      getSwimmerById(swimmerId, teamId),
      getOrganizationTeamType(teamId),
      session?.user?.id
        ? getMember(session.user.id, teamId)
        : Promise.resolve(null),
      currentSeasonPromise,
      seasonsPromise,
    ]);

  if (!swimmer) notFound();

  const { selectedId: selectedSeasonId, range } = resolveSeasonParam(
    seasonParam,
    seasons,
    currentSeason,
  );

  const [series, bestTimes, timeHistory] = await Promise.all([
    getSwimmerResultSeries(swimmerId, teamId, range),
    getSwimmerBestTimes(swimmerId),
    getSwimmerTimeHistory(swimmerId, teamId, range),
  ]);

  const displayName =
    swimmer.preferredName?.trim() || `${swimmer.firstName} ${swimmer.lastName}`;

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
    source: row.source,
  }));

  return (
    <div className="flex flex-col gap-6">
      <SetBreadcrumbEntity id={swimmerId} label={displayName} />
      <PageHeader
        title="Progression"
        description="Time trends, best times, and swim history."
        actions={
          <ImportTimesCsvButton
            teamId={teamId}
            canEdit={isCoachingRole(membership?.role ?? "")}
          />
        }
      />

      <ProgressionSwimmerPicker
        teamId={teamId}
        swimmers={listSwimmers}
        selectedId={swimmerId}
        seasonParam={seasonParam}
        seasons={seasons.map((s) => ({
          id: s.id,
          label: s.label,
          isCurrent: s.isCurrent,
        }))}
        selectedSeasonId={selectedSeasonId}
      />

      <SwimmerProgressionPanel
        teamId={teamId}
        swimmerId={swimmerId}
        swimmerGender={swimmer.gender}
        series={chartSeries}
        bestTimes={bestTimes}
        timeHistory={timeHistory}
        teamType={teamType}
        canEditBestTimes={isCoachingRole(membership?.role ?? "")}
      />
    </div>
  );
}

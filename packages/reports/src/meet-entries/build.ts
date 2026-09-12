import {
  formatGenderLabel,
  formatStrokeLabel,
} from "@project-aqua/swim-core/events";
import type { MeetLineupSnapshot } from "@project-aqua/swim-core/meet-lineup-snapshot";
import {
  normalizeLscCode,
  normalizeTeamCode,
} from "@project-aqua/swim-core/team-codes";
import { formatTime } from "@project-aqua/swim-core/times";
import type {
  MeetEntriesReport,
  MeetEntriesReportEvent,
  MeetEntriesReportIndividual,
  MeetEntriesReportRelayTeam,
  MeetEntriesReportSwimmer,
  MeetEntriesReportSwimmerLine,
  ReportCourse,
} from "../types";

const SHORT_STROKE: Record<string, string> = {
  free: "Free",
  back: "Back",
  breast: "Breast",
  fly: "Fly",
  im: "IM",
  free_relay: "Free Relay",
  medley_relay: "Medley Relay",
};

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function toUtcDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (match) {
    return new Date(
      Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
    );
  }
  return new Date(value);
}

/** TM-style meet date: 12-Sep-26 */
export function formatMeetDateCompact(value: Date | string): string {
  const date = toUtcDate(value);
  const day = date.getUTCDate();
  const month = MONTHS_SHORT[date.getUTCMonth()] ?? "Jan";
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

export function formatCourseLabel(course: ReportCourse): string {
  if (course === "SCY") return "Yards";
  if (course === "SCM") return "Short Course Meters";
  return "Long Course Meters";
}

export function formatSeedLabel(
  seedTimeMs: number | null | undefined,
  course: ReportCourse,
  exhibition = false,
): string {
  const base =
    seedTimeMs != null && seedTimeMs > 0 ? formatTime(seedTimeMs) : "NT";
  const suffix =
    base === "NT" ? "" : course === "SCY" ? "Y" : course === "SCM" ? "S" : "L";
  const withCourse = `${base}${suffix}`;
  return exhibition ? `${withCourse} ex` : withCourse;
}

export function formatAthleteDisplayName(
  firstName: string,
  lastName: string,
  classYear?: string | null,
): string {
  const name = `${firstName} ${lastName}`.trim();
  if (classYear?.trim()) return `${name} (${classYear.trim()})`;
  return name;
}

/** Compact event title matching Team Manager paper reports: "200 Free". */
export function formatReportEventTitle(
  distance: number,
  stroke: string,
): string {
  const short = SHORT_STROKE[stroke] ?? formatStrokeLabel(stroke);
  return `${distance} ${short}`;
}

function seedSortKey(seedTimeMs: number | null): number {
  if (seedTimeMs == null || seedTimeMs <= 0) return Number.MAX_SAFE_INTEGER;
  return seedTimeMs;
}

/** Keep the first row per swimmer (call after seed sort). Duplicate entries collapse. */
export function uniqueIndividualsByMembership<
  T extends { membershipId: string },
>(entries: T[]): T[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.membershipId)) return false;
    seen.add(entry.membershipId);
    return true;
  });
}

function reportTeamCode(team: MeetLineupSnapshot["team"]): string | null {
  const code = normalizeTeamCode(team.teamCode);
  if (!code) return null;
  const lsc = normalizeLscCode(team.lscCode);
  return lsc ? `${code}-${lsc}` : code;
}

function reportTeamAddress(
  team: MeetLineupSnapshot["team"],
  override?: string | null,
): string | null {
  if (override?.trim()) return override.trim();
  const cityLine = [team.city, team.region, team.postalCode]
    .filter(Boolean)
    .join(", ");
  const parts = [
    team.addressLine1,
    team.addressLine2,
    cityLine || null,
    team.country,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export type BuildMeetEntriesReportOptions = {
  coachName?: string | null;
  coachEmail?: string | null;
  teamAddress?: string | null;
  generatedAt?: Date;
  /** TM Show Eight: include relay legs 5–8 labeled [Alt]. Default omits them. */
  includeRelayAlternates?: boolean;
  /** Paper grouping. Default event. */
  groupBy?: "event" | "swimmer";
};

/**
 * Team Manager–style paper model. Consumes a meet lineup snapshot;
 * does not regroup relays.
 */
export function buildMeetEntriesReport(
  snapshot: MeetLineupSnapshot,
  options: BuildMeetEntriesReportOptions = {},
): MeetEntriesReport {
  const course = snapshot.meet.course;
  const generatedAt = options.generatedAt ?? new Date();
  const reportEvents: MeetEntriesReportEvent[] = [];

  let femaleIndividualEntries = 0;
  let maleIndividualEntries = 0;
  let totalRelayEntries = 0;
  const athleteIds = new Set<string>();

  for (const event of snapshot.events) {
    const genderLabel = formatGenderLabel(event.gender);
    const title = formatReportEventTitle(event.distance, event.stroke);

    if (event.isRelay) {
      const teams: MeetEntriesReportRelayTeam[] = snapshot.relayTeams
        .filter((team) => team.meetEventId === event.id)
        .map((team) => {
          const maxLeg = options.includeRelayAlternates ? 8 : 4;
          const legs = team.legs.filter(
            (leg) => leg.legOrder >= 1 && leg.legOrder <= maxLeg,
          );
          for (const leg of legs) athleteIds.add(leg.membershipId);
          return {
            letter: team.letter,
            seedLabel: formatSeedLabel(team.seedTimeMs, course),
            legs: legs.map((leg) => {
              const isAlternate = leg.legOrder >= 5;
              const name = formatAthleteDisplayName(
                leg.firstName,
                leg.lastName,
                leg.classYear,
              );
              return {
                legOrder: leg.legOrder,
                membershipId: leg.membershipId,
                name: isAlternate ? `${name} [Alt]` : name,
                classYear: leg.classYear,
                isAlternate,
              };
            }),
          };
        })
        .filter((team) => team.legs.length > 0);

      if (teams.length === 0) continue;
      totalRelayEntries += teams.length;
      reportEvents.push({
        kind: "relay",
        eventId: event.id,
        eventNumber: event.eventNumber,
        title,
        genderLabel,
        teams,
      });
      continue;
    }

    const eventEntries = uniqueIndividualsByMembership(
      snapshot.individuals
        .filter(
          (entry) =>
            entry.meetEventId === event.id && !entry.inclusion.scratched,
        )
        .slice()
        .sort((a, b) => {
          const seed = seedSortKey(a.seedTimeMs) - seedSortKey(b.seedTimeMs);
          if (seed !== 0) return seed;
          return `${a.lastName}${a.firstName}`.localeCompare(
            `${b.lastName}${b.firstName}`,
          );
        }),
    );

    if (eventEntries.length === 0) continue;

    const athletes: MeetEntriesReportIndividual[] = eventEntries.map(
      (entry) => {
        athleteIds.add(entry.membershipId);
        if (entry.gender === "female") femaleIndividualEntries += 1;
        else if (entry.gender === "male") maleIndividualEntries += 1;

        return {
          entryId: entry.id,
          membershipId: entry.membershipId,
          name: formatAthleteDisplayName(
            entry.firstName,
            entry.lastName,
            entry.classYear,
          ),
          classYear: entry.classYear,
          seedLabel: formatSeedLabel(
            entry.seedTimeMs,
            course,
            entry.exhibition,
          ),
          exhibition: entry.exhibition,
        };
      },
    );

    reportEvents.push({
      kind: "individual",
      eventId: event.id,
      eventNumber: event.eventNumber,
      title,
      genderLabel,
      athletes,
    });
  }

  const swimmers = groupReportBySwimmer(reportEvents);

  return {
    reportTitle: "Individual Meet Entries Report",
    meetName: snapshot.meet.name,
    meetDateLabel: formatMeetDateCompact(snapshot.meet.startDate),
    courseLabel: formatCourseLabel(course),
    location: snapshot.meet.location ?? null,
    opponents: snapshot.meet.opponents ?? null,
    teamName: snapshot.team.name ?? "Team",
    teamCode: reportTeamCode(snapshot.team),
    coachName: options.coachName ?? snapshot.team.contactName ?? null,
    coachEmail: options.coachEmail ?? snapshot.team.contactEmail ?? null,
    teamAddress: reportTeamAddress(snapshot.team, options.teamAddress),
    generatedAtLabel: generatedAt.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    }),
    groupBy: options.groupBy === "swimmer" ? "swimmer" : "event",
    events: reportEvents,
    swimmers,
    summary: {
      femaleIndividualEntries,
      maleIndividualEntries,
      totalIndividualEntries: femaleIndividualEntries + maleIndividualEntries,
      totalRelayEntries,
      totalAthletes: athleteIds.size,
    },
  };
}

function groupReportBySwimmer(
  events: MeetEntriesReportEvent[],
): MeetEntriesReportSwimmer[] {
  const byId = new Map<string, MeetEntriesReportSwimmer>();

  function lineFor(
    membershipId: string,
    name: string,
    line: MeetEntriesReportSwimmerLine,
  ) {
    const current = byId.get(membershipId) ?? {
      membershipId,
      name,
      lines: [],
    };
    current.lines.push(line);
    byId.set(membershipId, current);
  }

  for (const event of events) {
    const eventLabel = `${event.genderLabel} ${event.title}`;
    if (event.kind === "individual") {
      for (const athlete of event.athletes) {
        lineFor(athlete.membershipId, athlete.name, {
          eventId: event.eventId,
          eventNumber: event.eventNumber,
          eventLabel,
          seedLabel: athlete.seedLabel,
          kind: "individual",
          exhibition: athlete.exhibition,
        });
      }
      continue;
    }
    for (const team of event.teams) {
      for (const leg of team.legs) {
        lineFor(leg.membershipId, leg.name, {
          eventId: event.eventId,
          eventNumber: event.eventNumber,
          eventLabel,
          seedLabel: team.seedLabel,
          kind: "relay",
          relayLetter: team.letter,
          isAlternate: leg.isAlternate,
        });
      }
    }
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

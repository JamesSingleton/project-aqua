import { isRelayStroke } from "@project-aqua/swim-core/entry-limits";
import {
  formatGenderLabel,
  formatStrokeLabel,
} from "@project-aqua/swim-core/events";
import { formatTime } from "@project-aqua/swim-core/times";
import type {
  MeetEntriesReport,
  MeetEntriesReportAthlete,
  MeetEntriesReportEvent,
  MeetEntriesReportIndividual,
  MeetEntriesReportRelayTeam,
  ReportCourse,
} from "../types";

export type MeetEntriesBuildEvent = {
  id: string;
  eventNumber: number | null;
  stroke: string;
  distance: number;
  gender: string;
  eventKey: string;
};

export type MeetEntriesBuildEntry = {
  id: string;
  meetEventId: string;
  membershipId: string;
  firstName: string;
  lastName: string;
  seedTimeMs: number | null;
  exhibition: boolean;
  status: string;
  stroke: string;
  eventKey: string;
  gender: string;
};

export type MeetEntriesBuildRelayLeg = {
  meetEventId: string;
  relayLetter: string;
  legOrder: number;
  membershipId: string;
  firstName: string;
  lastName: string;
};

export type BuildMeetEntriesReportInput = {
  meetName: string;
  startDate: Date | string;
  course: ReportCourse;
  location?: string | null;
  teamName: string;
  teamCode?: string | null;
  coachName?: string | null;
  coachEmail?: string | null;
  teamAddress?: string | null;
  generatedAt?: Date;
  events: MeetEntriesBuildEvent[];
  entries: MeetEntriesBuildEntry[];
  relayLegs: MeetEntriesBuildRelayLeg[];
  relayTeamSeeds?: Array<{
    meetEventId: string;
    relayLetter: string;
    seedTimeMs: number | null;
  }>;
  /** Optional roster map for class year / display enrichment. */
  athletesByMembershipId?: Map<string, MeetEntriesReportAthlete>;
};

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

function sortEvents(
  a: MeetEntriesBuildEvent,
  b: MeetEntriesBuildEvent,
): number {
  const an = a.eventNumber ?? Number.MAX_SAFE_INTEGER;
  const bn = b.eventNumber ?? Number.MAX_SAFE_INTEGER;
  if (an !== bn) return an - bn;
  return a.id.localeCompare(b.id);
}

function seedSortKey(seedTimeMs: number | null): number {
  if (seedTimeMs == null || seedTimeMs <= 0) return Number.MAX_SAFE_INTEGER;
  return seedTimeMs;
}

function athleteMeta(
  membershipId: string,
  firstName: string,
  lastName: string,
  map?: Map<string, MeetEntriesReportAthlete>,
): { name: string; classYear: string | null } {
  const fromMap = map?.get(membershipId);
  const classYear = fromMap?.classYear ?? null;
  return {
    name: formatAthleteDisplayName(
      fromMap?.firstName ?? firstName,
      fromMap?.lastName ?? lastName,
      classYear,
    ),
    classYear,
  };
}

/**
 * Build a Team Manager–style Individual Meet Entries report model
 * (by event, A-relay legs 1–4 only).
 */
export function buildMeetEntriesReport(
  input: BuildMeetEntriesReportInput,
): MeetEntriesReport {
  const {
    meetName,
    startDate,
    course,
    location,
    teamName,
    teamCode,
    coachName,
    coachEmail,
    teamAddress,
    events,
    entries,
    relayLegs,
    relayTeamSeeds = [],
    athletesByMembershipId,
  } = input;

  const generatedAt = input.generatedAt ?? new Date();
  const activeEntries = entries.filter((e) => e.status !== "scratched");
  const reportEvents: MeetEntriesReportEvent[] = [];

  let femaleIndividualEntries = 0;
  let maleIndividualEntries = 0;
  let totalRelayEntries = 0;
  const athleteIds = new Set<string>();

  for (const event of [...events].sort(sortEvents)) {
    const isRelay = isRelayStroke(event.stroke, event.eventKey);
    const genderLabel = formatGenderLabel(event.gender);
    const title = formatReportEventTitle(event.distance, event.stroke);

    if (isRelay) {
      const legsForEvent = relayLegs.filter(
        (leg) =>
          leg.meetEventId === event.id &&
          leg.legOrder >= 1 &&
          leg.legOrder <= 4,
      );
      const byLetter = new Map<string, MeetEntriesBuildRelayLeg[]>();
      for (const leg of legsForEvent) {
        const list = byLetter.get(leg.relayLetter) ?? [];
        list.push(leg);
        byLetter.set(leg.relayLetter, list);
      }

      const seedByLetter = new Map(
        relayTeamSeeds
          .filter((team) => team.meetEventId === event.id)
          .map((team) => [team.relayLetter, team.seedTimeMs] as const),
      );

      const teams: MeetEntriesReportRelayTeam[] = [...byLetter.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([letter, legs]) => {
          const sorted = [...legs].sort((a, b) => a.legOrder - b.legOrder);
          for (const leg of sorted) athleteIds.add(leg.membershipId);
          return {
            letter,
            seedLabel: formatSeedLabel(
              seedByLetter.get(letter) ?? null,
              course,
            ),
            legs: sorted.map((leg) => {
              const meta = athleteMeta(
                leg.membershipId,
                leg.firstName,
                leg.lastName,
                athletesByMembershipId,
              );
              return {
                legOrder: leg.legOrder,
                membershipId: leg.membershipId,
                name: meta.name,
                classYear: meta.classYear,
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

    const eventEntries = activeEntries
      .filter((e) => e.meetEventId === event.id)
      .sort((a, b) => {
        const seed = seedSortKey(a.seedTimeMs) - seedSortKey(b.seedTimeMs);
        if (seed !== 0) return seed;
        return `${a.lastName}${a.firstName}`.localeCompare(
          `${b.lastName}${b.firstName}`,
        );
      });

    if (eventEntries.length === 0) continue;

    const athletes: MeetEntriesReportIndividual[] = eventEntries.map(
      (entry) => {
        athleteIds.add(entry.membershipId);
        if (entry.gender === "female") femaleIndividualEntries += 1;
        else if (entry.gender === "male") maleIndividualEntries += 1;

        const meta = athleteMeta(
          entry.membershipId,
          entry.firstName,
          entry.lastName,
          athletesByMembershipId,
        );
        return {
          membershipId: entry.membershipId,
          name: meta.name,
          classYear: meta.classYear,
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

  return {
    reportTitle: "Individual Meet Entries Report",
    meetName,
    meetDateLabel: formatMeetDateCompact(startDate),
    courseLabel: formatCourseLabel(course),
    location: location ?? null,
    teamName,
    teamCode: teamCode ?? null,
    coachName: coachName ?? null,
    coachEmail: coachEmail ?? null,
    teamAddress: teamAddress ?? null,
    generatedAtLabel: generatedAt.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    }),
    events: reportEvents,
    summary: {
      femaleIndividualEntries,
      maleIndividualEntries,
      totalIndividualEntries: femaleIndividualEntries + maleIndividualEntries,
      totalRelayEntries,
      totalAthletes: athleteIds.size,
    },
  };
}

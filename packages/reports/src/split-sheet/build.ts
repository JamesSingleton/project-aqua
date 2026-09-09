import { formatGenderLabel } from "@project-aqua/swim-core/events";
import type { MeetLineupSnapshot } from "@project-aqua/swim-core/meet-lineup-snapshot";
import {
  isRelayAlternateSlot,
  RELAY_PRIMARY_LEG_COUNT,
  relaySlotLabel,
} from "@project-aqua/swim-core/relay-legs";
import {
  formatSplitCaptureLabel,
  type SplitCaptureInterval,
  splitCapturePlan,
  splitCaptureStrokeHint,
} from "@project-aqua/swim-core/split-capture";
import {
  normalizeLscCode,
  normalizeTeamCode,
} from "@project-aqua/swim-core/team-codes";
import {
  formatAthleteDisplayName,
  formatCourseLabel,
  formatMeetDateCompact,
  formatReportEventTitle,
  formatSeedLabel,
} from "../meet-entries/build";
import type {
  SplitSheetEvent,
  SplitSheetMark,
  SplitSheetPageOrientation,
  SplitSheetRelayTeam,
  SplitSheetReport,
  SplitSheetSwimmer,
  SplitSheetSwimmerLine,
} from "../types";

/** Landscape when a row needs more boxes than this (500 free = 10 splits + overall). */
export const SPLIT_SHEET_LANDSCAPE_BOX_THRESHOLD = 8;

function withOverallBox(marks: SplitSheetMark[]): SplitSheetMark[] {
  return [
    ...marks.map((mark) => ({ ...mark, isFinal: false })),
    { label: "Overall", isFinal: true },
  ];
}

function seedSortKey(seedTimeMs: number | null): number {
  if (seedTimeMs == null || seedTimeMs <= 0) return Number.MAX_SAFE_INTEGER;
  return seedTimeMs;
}

function individualMarks(
  distance: number,
  course: MeetLineupSnapshot["meet"]["course"],
  stroke: string,
  interval?: SplitCaptureInterval,
): SplitSheetMark[] {
  const plan = splitCapturePlan({ distance, course, interval });
  return withOverallBox(
    plan.marks.map((mark) => ({
      label: formatSplitCaptureLabel(
        mark.cumulativeDistance,
        splitCaptureStrokeHint({
          stroke,
          distance,
          cumulativeDistance: mark.cumulativeDistance,
          interval: plan.interval,
        }),
      ),
      isFinal: false,
    })),
  );
}

function relayTeamMarks(
  distance: number,
  course: MeetLineupSnapshot["meet"]["course"],
  stroke: string,
  legs: Array<{
    legOrder: number;
    name: string;
    membershipId: string;
  }>,
): SplitSheetMark[] {
  const racing = splitCapturePlan({
    distance,
    course,
    isRelay: true,
    relayLegCount: RELAY_PRIMARY_LEG_COUNT,
  });
  const byOrder = new Map(legs.map((leg) => [leg.legOrder, leg]));
  const marks: SplitSheetMark[] = racing.marks.map((mark, index) => {
    const order = index + 1;
    const leg = byOrder.get(order);
    return {
      label: formatSplitCaptureLabel(
        mark.cumulativeDistance,
        splitCaptureStrokeHint({
          stroke,
          distance,
          cumulativeDistance: mark.cumulativeDistance,
          interval: racing.interval,
          isRelay: true,
          relayLegOrder: order,
        }),
      ),
      isFinal: false,
      athleteName: leg?.name ?? null,
      membershipId: leg?.membershipId ?? null,
    };
  });
  for (const leg of legs) {
    if (!isRelayAlternateSlot(leg.legOrder)) continue;
    marks.push({
      label: relaySlotLabel(leg.legOrder),
      isFinal: false,
      athleteName: leg.name,
      membershipId: leg.membershipId,
    });
  }
  return withOverallBox(marks);
}

function maxMarkCount(events: SplitSheetEvent[]): number {
  let max = 0;
  for (const event of events) {
    if (event.kind === "individual") {
      for (const row of event.rows) {
        if (row.marks.length > max) max = row.marks.length;
      }
    } else {
      for (const team of event.teams) {
        if (team.marks.length > max) max = team.marks.length;
      }
    }
  }
  return max;
}

function pageOrientationFor(
  events: SplitSheetEvent[],
): SplitSheetPageOrientation {
  return maxMarkCount(events) > SPLIT_SHEET_LANDSCAPE_BOX_THRESHOLD
    ? "landscape"
    : "portrait";
}

export type BuildSplitSheetReportOptions = {
  coachName?: string | null;
  coachEmail?: string | null;
  teamAddress?: string | null;
  generatedAt?: Date;
  includeRelayAlternates?: boolean;
  groupBy?: "event" | "swimmer";
  /** Individual events only. Omitted = auto cadence. */
  interval?: SplitCaptureInterval;
  /** Blank relay boxes; planned lineup still listed under the heading. */
  blankRelayLines?: boolean;
};

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

function groupSplitSheetBySwimmer(
  events: SplitSheetEvent[],
): SplitSheetSwimmer[] {
  const byId = new Map<string, SplitSheetSwimmer>();

  function addLine(
    membershipId: string,
    name: string,
    line: SplitSheetSwimmerLine,
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
      for (const row of event.rows) {
        addLine(row.membershipId, row.name, {
          eventId: event.eventId,
          eventNumber: event.eventNumber,
          eventLabel,
          seedLabel: row.seedLabel,
          kind: "individual",
          exhibition: row.exhibition,
          marks: row.marks,
        });
      }
      continue;
    }
    for (const team of event.teams) {
      for (const mark of team.marks) {
        if (!mark.membershipId || !mark.athleteName) continue;
        addLine(mark.membershipId, mark.athleteName, {
          eventId: event.eventId,
          eventNumber: event.eventNumber,
          eventLabel,
          seedLabel: team.seedLabel,
          kind: "relay",
          relayLetter: team.letter,
          isAlternate: mark.label.startsWith("Alt"),
          marks: withOverallBox([mark]),
        });
      }
    }
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Clipboard split sheet from a meet lineup snapshot. Does not persist times.
 */
export function buildSplitSheetReport(
  snapshot: MeetLineupSnapshot,
  options: BuildSplitSheetReportOptions = {},
): SplitSheetReport {
  const course = snapshot.meet.course;
  const generatedAt = options.generatedAt ?? new Date();
  const events: SplitSheetEvent[] = [];

  for (const event of snapshot.events) {
    const genderLabel = formatGenderLabel(event.gender);
    const title = formatReportEventTitle(event.distance, event.stroke);

    if (event.isRelay) {
      const teams: SplitSheetRelayTeam[] = snapshot.relayTeams
        .filter((team) => team.meetEventId === event.id)
        .map((team) => {
          const maxLeg = options.includeRelayAlternates ? 8 : 4;
          const legs = team.legs
            .filter((leg) => leg.legOrder >= 1 && leg.legOrder <= maxLeg)
            .map((leg) => ({
              legOrder: leg.legOrder,
              membershipId: leg.membershipId,
              name: formatAthleteDisplayName(
                leg.firstName,
                leg.lastName,
                leg.classYear,
              ),
            }));
          return {
            letter: team.letter,
            seedLabel: formatSeedLabel(team.seedTimeMs, course),
            marks: relayTeamMarks(event.distance, course, event.stroke, legs),
          };
        })
        .filter((team) => team.marks.some((mark) => mark.athleteName));

      if (teams.length === 0) continue;
      events.push({
        kind: "relay",
        eventId: event.id,
        eventNumber: event.eventNumber,
        title,
        genderLabel,
        teams,
      });
      continue;
    }

    const eventEntries = snapshot.individuals
      .filter(
        (entry) => entry.meetEventId === event.id && !entry.inclusion.scratched,
      )
      .slice()
      .sort((a, b) => {
        const seed = seedSortKey(a.seedTimeMs) - seedSortKey(b.seedTimeMs);
        if (seed !== 0) return seed;
        return `${a.lastName}${a.firstName}`.localeCompare(
          `${b.lastName}${b.firstName}`,
        );
      });

    if (eventEntries.length === 0) continue;

    const marks = individualMarks(
      event.distance,
      course,
      event.stroke,
      options.interval,
    );
    events.push({
      kind: "individual",
      eventId: event.id,
      eventNumber: event.eventNumber,
      title,
      genderLabel,
      rows: eventEntries.map((entry) => ({
        membershipId: entry.membershipId,
        name: formatAthleteDisplayName(
          entry.firstName,
          entry.lastName,
          entry.classYear,
        ),
        seedLabel: formatSeedLabel(entry.seedTimeMs, course, entry.exhibition),
        exhibition: entry.exhibition,
        marks,
      })),
    });
  }

  return {
    reportTitle: "Split sheet",
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
    pageOrientation: pageOrientationFor(events),
    blankRelayLines: options.blankRelayLines === true,
    events,
    swimmers: groupSplitSheetBySwimmer(events),
  };
}

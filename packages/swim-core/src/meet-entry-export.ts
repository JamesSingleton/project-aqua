import { isRelayStroke } from "./entry-limits";
import { formatEventName, formatGenderLabel } from "./events";
import { formatTime } from "./times";

export type MeetEntryExportEvent = {
  id: string;
  eventNumber: number | null;
  stroke: string;
  distance: number;
  gender: string;
  ageGroup: string | null;
  eventKey: string;
};

export type MeetEntryExportEntry = {
  id: string;
  meetEventId: string;
  membershipId: string;
  firstName: string;
  lastName: string;
  seedTimeMs: number | null;
  exhibition: boolean;
  entryNotes: string | null;
  status: string;
  stroke: string;
  eventKey: string;
};

export type MeetRelayLegExport = {
  meetEventId: string;
  relayLetter: string;
  legOrder: number;
  membershipId: string;
  firstName: string;
  lastName: string;
};

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowToCsv(cells: string[]): string {
  return cells.map(escapeCsv).join(",");
}

function swimmerName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

function eventLabel(event: MeetEntryExportEvent): string {
  const base = formatEventName(event.distance, event.stroke);
  const age = event.ageGroup ? ` (${event.ageGroup})` : "";
  return `${base}${age}`;
}

function sortEvents(a: MeetEntryExportEvent, b: MeetEntryExportEvent): number {
  const an = a.eventNumber ?? Number.MAX_SAFE_INTEGER;
  const bn = b.eventNumber ?? Number.MAX_SAFE_INTEGER;
  if (an !== bn) return an - bn;
  return a.id.localeCompare(b.id);
}

export type MeetRelayTeamSeedExport = {
  meetEventId: string;
  relayLetter: string;
  seedTimeMs: number | null;
};

/** One row per individual entry; one row per relay team with Leg 1–4 columns. */
export function buildEntryListCsv(input: {
  events: MeetEntryExportEvent[];
  entries: MeetEntryExportEntry[];
  relayLegs: MeetRelayLegExport[];
  relayTeamSeeds?: MeetRelayTeamSeedExport[];
}): string {
  const { events, entries, relayLegs, relayTeamSeeds = [] } = input;
  const eventById = new Map(events.map((event) => [event.id, event]));
  const headers = [
    "Event #",
    "Event Name",
    "Type",
    "Gender",
    "Age Group",
    "Swimmer",
    "Seed Time",
    "Exhibition",
    "Leg 1",
    "Leg 2",
    "Leg 3",
    "Leg 4",
    "Notes",
  ];
  const rows: string[] = [rowToCsv(headers)];

  const activeEntries = entries.filter((entry) => entry.status !== "scratched");

  for (const event of [...events].sort(sortEvents)) {
    if (isRelayStroke(event.stroke, event.eventKey)) {
      const legsByTeam = new Map<string, MeetRelayLegExport[]>();
      for (const leg of relayLegs.filter((l) => l.meetEventId === event.id)) {
        const team = legsByTeam.get(leg.relayLetter) ?? [];
        team.push(leg);
        legsByTeam.set(leg.relayLetter, team);
      }

      const teams = [...legsByTeam.entries()].sort(([a], [b]) =>
        a.localeCompare(b),
      );
      if (teams.length === 0) continue;

      for (const [relayLetter, legs] of teams) {
        const ordered = [...legs].sort((a, b) => a.legOrder - b.legOrder);
        const legNames = [1, 2, 3, 4].map((order) => {
          const leg = ordered.find((l) => l.legOrder === order);
          return leg ? swimmerName(leg.firstName, leg.lastName) : "";
        });
        const seedMs = relayTeamSeeds.find(
          (team) =>
            team.meetEventId === event.id && team.relayLetter === relayLetter,
        )?.seedTimeMs;
        const seed = seedMs != null && seedMs > 0 ? formatTime(seedMs) : "";
        rows.push(
          rowToCsv([
            event.eventNumber?.toString() ?? "",
            eventLabel(event),
            "Relay",
            formatGenderLabel(event.gender),
            event.ageGroup ?? "",
            `Relay ${relayLetter}`,
            seed,
            "",
            ...legNames,
            "",
          ]),
        );
      }
      continue;
    }

    for (const entry of activeEntries.filter(
      (e) => e.meetEventId === event.id,
    )) {
      const seed =
        entry.seedTimeMs != null && entry.seedTimeMs > 0
          ? formatTime(entry.seedTimeMs)
          : "";
      rows.push(
        rowToCsv([
          event.eventNumber?.toString() ?? "",
          eventLabel(event),
          "Individual",
          formatGenderLabel(event.gender),
          event.ageGroup ?? "",
          swimmerName(entry.firstName, entry.lastName),
          seed,
          entry.exhibition ? "Yes" : "",
          "",
          "",
          "",
          "",
          entry.entryNotes ?? "",
        ]),
      );
    }
  }

  return `${rows.join("\n")}\n`;
}

/** One row per event; athletes in columns (names only). */
export function buildByEventCsv(input: {
  events: MeetEntryExportEvent[];
  entries: MeetEntryExportEntry[];
  relayLegs: MeetRelayLegExport[];
}): string {
  const { events, entries, relayLegs } = input;
  const headers = [
    "Event #",
    "Event Name",
    "Gender",
    "Age Group",
    "Athlete 1",
    "Athlete 2",
    "Athlete 3",
    "Athlete 4",
  ];
  const rows: string[] = [rowToCsv(headers)];
  const activeEntries = entries.filter((entry) => entry.status !== "scratched");

  for (const event of [...events].sort(sortEvents)) {
    if (isRelayStroke(event.stroke, event.eventKey)) {
      const legsByTeam = new Map<string, MeetRelayLegExport[]>();
      for (const leg of relayLegs.filter((l) => l.meetEventId === event.id)) {
        const team = legsByTeam.get(leg.relayLetter) ?? [];
        team.push(leg);
        legsByTeam.set(leg.relayLetter, team);
      }
      for (const [, legs] of [...legsByTeam.entries()].sort(([a], [b]) =>
        a.localeCompare(b),
      )) {
        const ordered = [...legs].sort((a, b) => a.legOrder - b.legOrder);
        const legNames = [1, 2, 3, 4].map((order) => {
          const leg = ordered.find((l) => l.legOrder === order);
          return leg ? swimmerName(leg.firstName, leg.lastName) : "";
        });
        rows.push(
          rowToCsv([
            event.eventNumber?.toString() ?? "",
            eventLabel(event),
            formatGenderLabel(event.gender),
            event.ageGroup ?? "",
            ...legNames,
          ]),
        );
      }
      continue;
    }

    const swimmers = activeEntries
      .filter((entry) => entry.meetEventId === event.id)
      .map((entry) => swimmerName(entry.firstName, entry.lastName));

    if (swimmers.length === 0) continue;

    for (let i = 0; i < swimmers.length; i += 4) {
      const chunk = swimmers.slice(i, i + 4);
      while (chunk.length < 4) chunk.push("");
      rows.push(
        rowToCsv([
          event.eventNumber?.toString() ?? "",
          eventLabel(event),
          formatGenderLabel(event.gender),
          event.ageGroup ?? "",
          ...chunk,
        ]),
      );
    }
  }

  return `${rows.join("\n")}\n`;
}

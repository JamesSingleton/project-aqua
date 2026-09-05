import type { EventGender } from "@project-aqua/swim-core/events";

export interface ParsedMeet {
  name: string;
  startDate?: string;
  endDate?: string;
  /** Host entry deadline (YYYY-MM-DD) when present in EV3. */
  entryDeadline?: string;
  course: "SCY" | "SCM" | "LCM";
  location?: string;
  address?: string;
  altitude?: number;
  sanctionNumber?: string;
  notes?: string;
  events: ParsedEvent[];
  entries: ParsedEntry[];
  results: ParsedResult[];
  relays?: ParsedRelayEntry[];
  /**
   * Meet-roster athletes, including relay-only swimmers who have a D1/D0
   * identity record but no individual event entry.
   */
  athletes?: ParsedAthlete[];
  /** Entry limits when present in the source file; omit/undefined if not found. */
  entryLimits?: {
    maxIndividualEntries?: number;
    maxRelayEntries?: number;
    maxCombinedEntries?: number;
    packages?: Array<{ individual: number; relay: number }>;
  };
  /**
   * Diving events detected in the source file but not imported yet.
   * Hy-Tek uses stroke `6` (HYV) / `F` (EV3). Swim-only import skips these
   * and surfaces the count so coaches know what was omitted.
   */
  skippedDiveEvents?: number;
  /**
   * When set, guides admin import (e.g. skip draft entries for results files).
   */
  importKind?: "results" | "entries" | "events" | "roster";
  /** Hy-Tek team abbreviation (MARI). */
  teamCode?: string;
  /** USA Swimming LSC (AZ). */
  lscCode?: string;
  /** Full team name for C1 (falls back to meet context). */
  teamName?: string;
  /** Optional 16-char TM short name (MHS). Defaults to teamCode. */
  teamShortName?: string;
  /** TM C1 team type, e.g. HS. */
  teamKind?: string;
  teamAddressLine1?: string;
  teamAddressLine2?: string;
  teamCity?: string;
  teamRegion?: string;
  teamPostalCode?: string;
  teamCountry?: string;
  /** Head coach (or owner) name for HY3 C1. */
  teamContactName?: string;
  /** Head coach (or owner) email for HY3 C3. */
  teamContactEmail?: string;
}

export interface ParsedEntry {
  eventNumber?: number;
  swimmerName: string;
  seedTime?: string;
  usaMemberId?: string;
  /** YYYY-MM-DD when present on HY3 D1 (or derived from USA ID). */
  dateOfBirth?: string;
  gender?: "male" | "female";
  /** High-school class year (FR/SO/JR/SR) when present. */
  classYear?: string;
  /** True when HY3 E1 col 84 is `X` (exhibition). */
  exhibition?: boolean;
  meetDivision?: string;
  heat?: number;
  lane?: number;
}

export interface ParsedEvent {
  eventNumber?: number;
  stroke: string;
  distance: number;
  gender: EventGender;
  ageGroup?: string;
  eventKey: string;
  /** `dive` for Hy-Tek dive events (stroke F/6); default swim. */
  eventKind?: "swim" | "dive";
  /** Number of dives when present on EV3 dive rows. */
  diveCount?: number;
  /** Championship round when present (HYV): prelims/finals/swimoff/time trial. */
  roundType?: "prelim" | "finals" | "swimoff" | "time_trial";
  /** Primary meet qualifying/entry cut time in milliseconds when present. */
  qualifyingTimeMs?: number;
}

export interface ParsedResult {
  eventNumber?: number;
  swimmerName: string;
  time: string;
  place?: number;
  isDq?: boolean;
  usaMemberId?: string;
  /** When present (e.g. Hy-Tek D0), used to match/create roster athletes. */
  dateOfBirth?: string;
  gender?: "male" | "female";
  /** Hy-Tek team abbreviation when present (C1 / D1 context). */
  teamCode?: string;
  resultType?: "prelim" | "swimoff" | "finals";
  heat?: number;
  lane?: number;
  dqCode?: string;
  exhibition?: boolean;
  /** Split times in milliseconds when present (e.g. HY3 G1). */
  splitsMs?: number[];
}

export interface ParsedRelayEntry {
  eventNumber?: number;
  /** Primary legs 1–4, then alternates #5–#8 when present. */
  swimmerNames: string[];
  seedTime?: string;
  teamCode?: string;
  relayLetter?: string;
}

/** Team-roster identity row (Hy-Tek D1 / CL2 D0 without an event). */
export interface ParsedAthlete {
  name: string;
  usaMemberId?: string;
  dateOfBirth?: string;
  gender?: "male" | "female";
  classYear?: string;
  /** Committed / attending with no individual event entries. */
  relayOnly?: boolean;
}

export interface ParsedRosterRow {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female";
  practiceGroup?: string;
  classYear?: string;
  usaMemberId?: string;
}

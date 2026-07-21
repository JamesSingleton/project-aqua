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
}

export interface ParsedEvent {
  eventNumber?: number;
  stroke: string;
  distance: number;
  gender: EventGender;
  ageGroup?: string;
  eventKey: string;
  /** Championship round when present (HYV): prelims/finals/swimoff/time trial. */
  roundType?: "prelim" | "finals" | "swimoff" | "time_trial";
  /** Primary meet qualifying/entry cut time in milliseconds when present. */
  qualifyingTimeMs?: number;
}

export interface ParsedEntry {
  eventNumber?: number;
  swimmerName: string;
  seedTime?: string;
  usaMemberId?: string;
  /** True when HY3 E1 col 84 is `X` (exhibition). */
  exhibition?: boolean;
  meetDivision?: string;
  heat?: number;
  lane?: number;
}

export interface ParsedResult {
  eventNumber?: number;
  swimmerName: string;
  time: string;
  place?: number;
  isDq?: boolean;
  usaMemberId?: string;
  resultType?: "prelim" | "swimoff" | "finals";
  heat?: number;
  lane?: number;
  dqCode?: string;
  exhibition?: boolean;
}

export interface ParsedRelayEntry {
  eventNumber?: number;
  swimmerNames: string[];
  seedTime?: string;
  teamCode?: string;
  relayLetter?: string;
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

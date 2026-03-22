// ─────────────────────────────────────────────────────────────────────────────
// Shared types across all Hytek file formats
// ─────────────────────────────────────────────────────────────────────────────

export type Course = "Y" | "S" | "L"; // SCY | SCM | LCM
export type Gender = "M" | "F";
export type EventType = "I" | "R"; // Individual | Relay
export type Stroke =
  | "A" // Freestyle
  | "B" // Backstroke
  | "C" // Breaststroke
  | "D" // Butterfly
  | "E" // IM
  | "F" // Freestyle Relay
  | "G" // Medley Relay
  | "H" // Diving
  | "I"; // Unknown

export const STROKE_LABELS: Record<Stroke, string> = {
  A: "Freestyle",
  B: "Backstroke",
  C: "Breaststroke",
  D: "Butterfly",
  E: "IM",
  F: "Freestyle Relay",
  G: "Medley Relay",
  H: "Diving",
  I: "Unknown",
};

// ─── SD3 Types ───────────────────────────────────────────────────────────────

export interface Sd3FileHeader {
  /** Contact name */
  contactName: string;
  /** Contact phone */
  contactPhone: string;
  /** Creation date MMDDYYYY */
  creationDate: string;
  /** File type code, e.g. "01" = entries, "02" = results */
  fileCode: string;
  /** Human-readable file description, e.g. "Meet Entries" */
  fileDescription: string;
  /** Software that created the file */
  softwareName: string;
  /** Software version */
  softwareVersion: string;
  /** "V3" or similar version */
  version: string;
}

export interface Sd3Meet {
  /** Altitude in feet */
  altitude: number;
  /** Season: 1=SCY, 2=LCM, 3=SCM */
  courseCode: string;
  /** Meet end date MMDDYYYY */
  endDate: string;
  /** Masters Y/N */
  masters: boolean;
  /** Meet name */
  name: string;
  /** Meet start date MMDDYYYY */
  startDate: string;
}

export interface Sd3Team {
  /** Team abbreviation, e.g. "AZSL" */
  abbreviation: string;
  /** Address line 1 */
  address1: string;
  /** City */
  city: string;
  /** LSC abbreviation, e.g. "AZ" */
  lsc: string;
  /** Full team name */
  name: string;
  /** State */
  state: string;
  /** Zip code */
  zip: string;
}

export interface Sd3Entry {
  /** Age */
  age: number;
  /** Age group max */
  ageGroupMax: number;
  /** Age group min */
  ageGroupMin: number;
  /** Citizen of country, e.g. "USA" */
  citizenship: string;
  /** Event distance in yards/meters */
  distance: number;
  /** Date of birth ISO yyyy-MM-dd */
  dob: string;
  /** USA-S SWIMS event catalog number — encodes stroke+distance, NOT the meet event number */
  eventNumber: number;
  /**
   * Age group section letter at D01[74].
   * This is the AGE GROUP SECTION of the USA-S event (A=youngest, B=middle, C=oldest),
   * NOT the stroke. It corresponds to the letter suffix in HYV event codes like "23A", "14B".
   * Stroke cannot be determined from SD3 alone — use resolveStroke() with a HYV/EV3 file.
   */
  eventSection: string;
  firstName: string;
  /** Gender */
  gender: Gender;
  /** Athlete last name, first name, middle initial */
  lastName: string;
  /** LSC abbreviation */
  lsc: string;
  /** USA Swimming member ID (12 hex chars) */
  memberId: string;
  /** Middle initial extracted from name field (e.g. "R" from "Damien R") */
  middleInitial: string;
  /** Course of seed time */
  seedCourse: Course;
  /** Seed time in seconds (null = NT) */
  seedTime: number | null;
  /**
   * Stroke resolved by cross-referencing the USA-S SWIMS event catalog number with a
   * known lookup table or an accompanying HYV/EV3 file. "I" if unknown.
   */
  stroke: Stroke;
}

export interface Sd3AthleteExtended {
  /** USA Swimming member ID (matches D01 entry) */
  memberId: string;
  /** Middle initial (single char, e.g. "R") — empty string if none */
  middleInitial: string;
  /** Middle name (multi-char, e.g. "Reed") — empty string if none */
  middleName: string;
  /** Preferred first name */
  preferredName: string;
}

export interface Sd3File {
  athletes: Sd3AthleteExtended[];
  entries: Sd3Entry[];
  header: Sd3FileHeader;
  meet: Sd3Meet;
  team: Sd3Team;
}

// ─── CL2 Types ───────────────────────────────────────────────────────────────

export interface Cl2Result {
  age: number;
  ageGroupMax: number;
  ageGroupMin: number;
  citizenship: string;
  distance: number;
  dob: string;
  /** DQ code, empty string if no DQ */
  dqCode: string;
  eventNumber: number;
  /** Whether result was marked with S (exhibition) */
  exhibition: boolean;
  /** Actual result time in seconds */
  finishTime: number | null;
  firstName: string;
  gender: Gender;
  /** Heat number */
  heat: number;
  /** Place in heat */
  heatPlace: number;
  /** Lane number */
  lane: number;
  lastName: string;
  lsc: string;
  memberId: string;
  /** Overall place */
  overallPlace: number;
  /** Prelim time if dual-round */
  prelimTime: number | null;
  /** "F" = Finals, "P" = Prelims, "S" = Swim-off */
  round: "F" | "P" | "S";
  /** Qualifying/seed time in seconds */
  seedTime: number | null;
  /** Split times in seconds */
  splits: number[];
  stroke: Stroke;
  /** Date swum MMDDYYYY */
  swimDate: string;
}

export interface Cl2Team {
  abbreviation: string;
  address: string;
  city: string;
  lsc: string;
  name: string;
  state: string;
  zip: string;
}

export interface Cl2Meet {
  address: string;
  altitude: number;
  city: string;
  country: string;
  course: Course;
  endDate: string;
  masters: boolean;
  name: string;
  startDate: string;
  state: string;
  zip: string;
}

export interface Cl2File {
  meet: Cl2Meet;
  results: Cl2Result[];
  teams: Cl2Team[];
}

// ─── HY3 Types ───────────────────────────────────────────────────────────────

export interface Hy3Athlete {
  age: number;
  /** Internal MM athlete ID */
  athleteId: number;
  dob: string;
  firstName: string;
  gender: Gender;
  lastName: string;
  /** USA Swimming member ID */
  memberId: string;
  /** Preferred name */
  preferredName: string;
  teamAbbr: string;
}

export interface Hy3Entry {
  ageGroupMax: number;
  ageGroupMin: number;
  /** Alternate qualifying time */
  altQualifyingTime: number | null;
  athleteId: number;
  distance: number;
  /** Entry fee */
  entryFee: number;
  /** Event number */
  eventNumber: number;
  gender: Gender;
  lastName: string;
  /** Truncated last name (5 chars) */
  lastNameShort: string;
  /** Points for scoring */
  points: number;
  qualifyingCourse: Course;
  /** Qualifying time in seconds */
  qualifyingTime: number | null;
  /** Reaction time */
  reactionTime: number;
  /** "F" | "P" | "S" */
  round: string;
  /** Seed rank */
  seedRank: string;
  stroke: Stroke;
  teamAbbr: string;
}

export interface Hy3Result {
  /** Adjusted time (reaction-time corrected) */
  adjustedTime: number | null;
  course: Course;
  /** DQ code */
  dqCode: string;
  entryCount: number;
  /** Exhibition / no-time flag */
  exhibition: boolean;
  /** Actual time swum in seconds */
  finishTime: number | null;
  heat: number;
  heatPlace: number;
  lane: number;
  overallPlace: number;
  round: "F" | "P" | "S";
  splits: number[];
  swimDate: string;
}

export interface Hy3AthleteRecord {
  athlete: Hy3Athlete;
  entries: Array<{ entry: Hy3Entry; results: Hy3Result[] }>;
}

export interface Hy3Team {
  abbreviation: string;
  address: string;
  city: string;
  lsc: string;
  name: string;
  state: string;
  zip: string;
}

export interface Hy3Meet {
  altitude: number;
  course: Course;
  endDate: string;
  facility: string;
  masters: boolean;
  name: string;
  startDate: string;
}

export interface Hy3File {
  meet: Hy3Meet;
  teams: Map<string, { team: Hy3Team; athletes: Hy3AthleteRecord[] }>;
}

// ─── HYV Types ───────────────────────────────────────────────────────────────

export interface HyvMeet {
  course: Course;
  endDate: string;
  facility: string;
  firstDayDate: string;
  name: string;
  softwareName: string;
  softwareVersion: string;
  startDate: string;
}

export interface HyvEvent {
  /** A-cut time in seconds (null = no cut) */
  aCut: number | null;
  ageMax: number;
  ageMin: number;
  /** B-cut time in seconds (null = no cut) */
  bCut: number | null;
  distance: number;
  /** Entry fee */
  entryFee: number;
  /** Entry limit per athlete in this event */
  entryLimit: number;
  /** Event code e.g. "1A", "13B" */
  eventCode: string;
  eventType: EventType;
  gender: Gender;
  /** "F" = Finals only, "P" = Prelims/Finals */
  roundType: "F" | "P";
  stroke: Stroke;
  /** Time standards: [slow5, fast5, slow4, fast4, ...] */
  timeStandards: (number | null)[];
}

export interface HyvFile {
  events: HyvEvent[];
  meet: HyvMeet;
}

// ─── EV3 Types ───────────────────────────────────────────────────────────────

export interface Ev3MeetHeader {
  course: Course;
  creationDate: string;
  endDate: string;
  facility: string;
  firstDayDate: string;
  hostClub: string;
  lscCode: string;
  meetSanction: string;
  name: string;
  sessionCount: number;
  softwareVersion: string;
  startDate: string;
}

export interface Ev3Event {
  ageMax: number;
  ageMin: number;
  distance: number;
  entryFee: number;
  /** Entry limit per athlete */
  entryLimit: number;
  /** Event code e.g. "1A", "13B" */
  eventCode: string;
  /** Sequential event number */
  eventNumber: number;
  eventType: EventType;
  gender: Gender;
  /** Heat count estimate */
  heatCount: number;
  /** Lane count */
  laneCount: number;
  /** "F" = Finals, "P" = Prelims */
  round: "F" | "P";
  /** Session number */
  session: number;
  /** Start time string e.g. "04:00PM" */
  startTime: string;
  stroke: Stroke;
  /** Time standards array */
  timeStandards: (number | null)[];
}

export interface Ev3File {
  events: Ev3Event[];
  header: Ev3MeetHeader;
}

// ─── Roster types (fileCode "03" HY3, "20" CL2) ─────────────────────────────

/** Academic year for high school swimmers */
export type GradeYear = "FR" | "SO" | "JR" | "SR" | "";

/**
 * Unified roster athlete record — used when parsing fileCode "03" (HY3)
 * or fileCode "20" (CL2/SD3) files which contain no meet or event data.
 */
export interface RosterAthlete {
  age: number;
  /** ISO yyyy-MM-dd — may be empty in high school rosters */
  dob: string;
  firstName: string;
  gender: Gender;
  gradeYear: GradeYear;
  /** Jersey / squad number from HY3 D1 record — 0 if not set */
  jerseyNumber: number;
  lastName: string;
  lsc: string;
  /** USA-S member ID (12 hex chars) — may be empty in high school rosters */
  memberId: string;
  middleInitial: string;
}

/**
 * Extended team info available from HY3 C1/C2/C3 records and CL2 C11.
 * Superset of both Cl2Team and Hy3Team.
 */
export interface SwimTeamInfo {
  abbreviation: string;
  address: string;
  city: string;
  /** Head coach name (HY3 only, empty in CL2) */
  coachName: string;
  country: string;
  /** Contact email (HY3 C3 record only) */
  email: string;
  lsc: string;
  name: string;
  /** "HS"=high school, ""=club */
  schoolType: string;
  /** Short name / mascot code e.g. "MHS" */
  shortName: string;
  state: string;
  zip: string;
}

// ─── Swim* type aliases (used by unified hy3.ts parser) ─────────────────────
// These map the Swim* names used in the new unified parser to the existing
// concrete types, keeping backward compatibility while enabling cleaner APIs.

export interface SwimMeet {
  address: string;
  altitude: number;
  city: string;
  country: string;
  course: Course;
  endDate: string;
  facility: string;
  masters: boolean;
  name: string;
  startDate: string;
  state: string;
  zip: string;
}

export type SwimAthlete = Hy3Athlete;
export type SwimAthleteResult = Hy3Result;

export interface SwimAthleteEntry {
  entry: {
    gender: Gender;
    athleteId: number;
    distance: number;
    stroke: Stroke;
    ageGroupMin: number;
    ageGroupMax: number;
    round: string;
    entryFee: number;
    eventNumber: number;
    seedRank: string;
    qualifyingTime: number | null;
    qualifyingCourse: Course;
    altQualifyingTime: number | null;
  };
  results: SwimAthleteResult[];
}

export interface SwimAthleteRecord {
  athlete: SwimAthlete;
  entries: SwimAthleteEntry[];
}

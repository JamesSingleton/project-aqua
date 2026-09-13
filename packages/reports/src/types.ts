/** Shared report document models. Meet entries is the first template; more will follow. */

export type ReportCourse = "SCY" | "SCM" | "LCM";

/** Header/footer fields shared by paper reports. */
export type ReportChrome = {
  reportTitle: string;
  meetName: string;
  /** e.g. 12-Sep-26 */
  meetDateLabel: string;
  courseLabel: string;
  location?: string | null;
  opponents?: string | null;
  teamName: string;
  teamCode?: string | null;
  coachName?: string | null;
  coachEmail?: string | null;
  teamAddress?: string | null;
  generatedAtLabel: string;
};

export type MeetEntriesReportAthlete = {
  membershipId: string;
  firstName: string;
  lastName: string;
  /** High school class year when known (FR / SO / JR / SR). */
  classYear?: string | null;
  gender?: "male" | "female" | null;
};

export type MeetEntriesReportIndividual = {
  entryId: string;
  membershipId: string;
  name: string;
  classYear?: string | null;
  seedLabel: string;
  exhibition: boolean;
};

export type MeetEntriesReportRelayLeg = {
  legOrder: number;
  membershipId: string;
  name: string;
  classYear?: string | null;
  isAlternate?: boolean;
};

export type MeetEntriesReportRelayTeam = {
  letter: string;
  seedLabel: string;
  /** Racing legs 1–4, plus 5–8 when includeRelayAlternates is on. */
  legs: MeetEntriesReportRelayLeg[];
};

export type MeetEntriesReportEvent =
  | {
      kind: "individual";
      eventId: string;
      eventNumber: number | null;
      title: string;
      genderLabel: string;
      athletes: MeetEntriesReportIndividual[];
    }
  | {
      kind: "relay";
      eventId: string;
      eventNumber: number | null;
      title: string;
      genderLabel: string;
      teams: MeetEntriesReportRelayTeam[];
    };

export type MeetEntriesReportSummary = {
  femaleIndividualEntries: number;
  maleIndividualEntries: number;
  totalIndividualEntries: number;
  totalRelayEntries: number;
  totalAthletes: number;
};

export type MeetEntriesReportGroupBy = "event" | "swimmer";

export type MeetEntriesReportSwimmerLine = {
  eventId: string;
  eventNumber: number | null;
  eventLabel: string;
  seedLabel: string;
  kind: "individual" | "relay";
  exhibition?: boolean;
  relayLetter?: string;
  isAlternate?: boolean;
};

export type MeetEntriesReportSwimmer = {
  membershipId: string;
  name: string;
  lines: MeetEntriesReportSwimmerLine[];
};

export type MeetEntriesReport = ReportChrome & {
  groupBy: MeetEntriesReportGroupBy;
  events: MeetEntriesReportEvent[];
  swimmers: MeetEntriesReportSwimmer[];
  summary: MeetEntriesReportSummary;
};

export type SplitSheetPageOrientation = "portrait" | "landscape";

export type SplitSheetMark = {
  label: string;
  isFinal: boolean;
  athleteName?: string | null;
  membershipId?: string | null;
};

export type SplitSheetIndividualRow = {
  entryId: string;
  membershipId: string;
  name: string;
  seedLabel: string;
  exhibition: boolean;
  marks: SplitSheetMark[];
};

export type SplitSheetRelayTeam = {
  letter: string;
  seedLabel: string;
  marks: SplitSheetMark[];
};

export type SplitSheetEvent =
  | {
      kind: "individual";
      eventId: string;
      eventNumber: number | null;
      title: string;
      genderLabel: string;
      rows: SplitSheetIndividualRow[];
    }
  | {
      kind: "relay";
      eventId: string;
      eventNumber: number | null;
      title: string;
      genderLabel: string;
      teams: SplitSheetRelayTeam[];
    };

export type SplitSheetSwimmerLine = {
  eventId: string;
  eventNumber: number | null;
  eventLabel: string;
  seedLabel: string;
  kind: "individual" | "relay";
  exhibition?: boolean;
  relayLetter?: string;
  isAlternate?: boolean;
  marks: SplitSheetMark[];
};

export type SplitSheetSwimmer = {
  membershipId: string;
  name: string;
  lines: SplitSheetSwimmerLine[];
};

export type SplitSheetReport = ReportChrome & {
  groupBy: MeetEntriesReportGroupBy;
  pageOrientation: SplitSheetPageOrientation;
  /** When true, relay boxes are blank; planned names print as a lineup line. */
  blankRelayLines: boolean;
  events: SplitSheetEvent[];
  swimmers: SplitSheetSwimmer[];
};

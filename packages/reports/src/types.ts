/** Shared report document models. Meet entries is the first template; more will follow. */

export type ReportCourse = "SCY" | "SCM" | "LCM";

export type MeetEntriesReportAthlete = {
  membershipId: string;
  firstName: string;
  lastName: string;
  /** High school class year when known (FR / SO / JR / SR). */
  classYear?: string | null;
  gender?: "male" | "female" | null;
};

export type MeetEntriesReportIndividual = {
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

export type MeetEntriesReport = {
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
  groupBy: MeetEntriesReportGroupBy;
  events: MeetEntriesReportEvent[];
  swimmers: MeetEntriesReportSwimmer[];
  summary: MeetEntriesReportSummary;
};

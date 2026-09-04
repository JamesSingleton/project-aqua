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
};

export type MeetEntriesReportRelayTeam = {
  letter: string;
  seedLabel: string;
  /** Primary legs only (1–4). Alternates are omitted to match TM paper reports. */
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

export type MeetEntriesReport = {
  reportTitle: string;
  meetName: string;
  /** e.g. 12-Sep-26 */
  meetDateLabel: string;
  courseLabel: string;
  location?: string | null;
  teamName: string;
  teamCode?: string | null;
  coachName?: string | null;
  coachEmail?: string | null;
  teamAddress?: string | null;
  generatedAtLabel: string;
  events: MeetEntriesReportEvent[];
  summary: MeetEntriesReportSummary;
};

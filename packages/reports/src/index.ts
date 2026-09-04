export { renderToBuffer, renderToStream } from "@react-pdf/renderer";
export {
  type BuildMeetEntriesReportInput,
  buildMeetEntriesReport,
  formatAthleteDisplayName,
  formatCourseLabel,
  formatMeetDateCompact,
  formatReportEventTitle,
  formatSeedLabel,
  type MeetEntriesBuildEntry,
  type MeetEntriesBuildEvent,
  type MeetEntriesBuildRelayLeg,
} from "./meet-entries/build";
export { MeetEntriesHtmlReport } from "./templates/html/meet-entries";
export {
  ensureReportFonts,
  MeetEntriesPdfDocument,
} from "./templates/pdf";
export type {
  MeetEntriesReport,
  MeetEntriesReportAthlete,
  MeetEntriesReportEvent,
  MeetEntriesReportIndividual,
  MeetEntriesReportRelayLeg,
  MeetEntriesReportRelayTeam,
  MeetEntriesReportSummary,
  ReportCourse,
} from "./types";

import { Document, Page, View } from "@react-pdf/renderer";
import type { MeetEntriesReport } from "../../types";
import { ReportFooter, ReportHeader } from "./components/chrome";
import { EventBlock, SwimmerBlock } from "./components/event-block";
import { ReportSummary } from "./components/summary";
import { ensureReportFonts } from "./fonts";

export function MeetEntriesPdfDocument({
  report,
}: {
  report: MeetEntriesReport;
}) {
  ensureReportFonts();

  return (
    <Document
      title={`${report.meetName} — Entries`}
      author={report.teamName}
      subject={report.reportTitle}
    >
      <Page
        size="LETTER"
        wrap
        style={{
          fontFamily: "Helvetica",
          fontSize: 9,
          paddingTop: 40,
          paddingBottom: 52,
          paddingHorizontal: 40,
          color: "#111111",
        }}
      >
        <ReportHeader report={report} />
        <View>
          {report.groupBy === "swimmer"
            ? report.swimmers.map((swimmer) => (
                <SwimmerBlock key={swimmer.membershipId} swimmer={swimmer} />
              ))
            : report.events.map((event) => (
                <EventBlock key={event.eventId} event={event} />
              ))}
        </View>
        <ReportSummary summary={report.summary} />
        <ReportFooter report={report} />
      </Page>
    </Document>
  );
}

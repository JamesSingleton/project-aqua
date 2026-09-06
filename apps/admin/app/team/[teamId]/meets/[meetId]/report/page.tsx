import {
  MeetEntriesHtmlReport,
  type MeetEntriesReport,
  SplitSheetHtmlReport,
  type SplitSheetReport,
} from "@project-aqua/reports";
import {
  parseSplitCaptureInterval,
  type SplitCaptureInterval,
} from "@project-aqua/swim-core/split-capture";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MeetEntryNav } from "../meet-entry-nav";
import { DownloadEntriesPdfButton } from "./download-entries-pdf-button";
import { loadMeetEntriesReport } from "./load-meet-entries-report";
import { loadSplitSheetReport } from "./load-split-sheet-report";
import { ReportAlternatesToggle } from "./report-alternates-toggle";
import { ReportDocumentToggle } from "./report-document-toggle";
import { ReportGroupToggle } from "./report-group-toggle";
import { ReportSplitIntervalToggle } from "./report-split-interval-toggle";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string; meetId: string }>;
  searchParams: Promise<{ doc?: string; split?: string }>;
}): Promise<Metadata> {
  const { teamId, meetId } = await params;
  const { doc, split } = await searchParams;
  const report =
    doc === "splits"
      ? await loadSplitSheetReport(teamId, meetId, {
          interval: parseSplitCaptureInterval(split),
        })
      : await loadMeetEntriesReport(teamId, meetId);
  if (!report) return {};
  const kind = doc === "splits" ? "Split sheet" : "Reports";
  return { title: `${report.meetName} - ${kind}` };
}

function ReportToolbar({
  teamId,
  meetId,
  meetName,
  includeRelayAlternates,
  groupBy,
  documentKind,
  splitInterval,
  title,
  description,
}: {
  teamId: string;
  meetId: string;
  meetName: string;
  includeRelayAlternates: boolean;
  groupBy: "event" | "swimmer";
  documentKind: "entries" | "splits";
  splitInterval?: SplitCaptureInterval;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">{title}</h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Suspense>
            <ReportDocumentToggle />
          </Suspense>
          <Suspense>
            <ReportGroupToggle />
          </Suspense>
          {documentKind === "splits" ? (
            <Suspense>
              <ReportSplitIntervalToggle />
            </Suspense>
          ) : null}
          <Suspense>
            <ReportAlternatesToggle />
          </Suspense>
        </div>
      </div>
      <DownloadEntriesPdfButton
        teamId={teamId}
        meetId={meetId}
        meetName={meetName}
        includeRelayAlternates={includeRelayAlternates}
        groupBy={groupBy}
        documentKind={documentKind}
        splitInterval={splitInterval}
      />
    </div>
  );
}

export default async function MeetEntryReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string; meetId: string }>;
  searchParams: Promise<{
    alts?: string;
    group?: string;
    doc?: string;
    split?: string;
  }>;
}) {
  const { teamId, meetId } = await params;
  const { alts, group, doc, split } = await searchParams;
  const includeRelayAlternates = alts === "1";
  const groupBy: "event" | "swimmer" =
    group === "swimmer" ? "swimmer" : "event";
  const splitInterval = parseSplitCaptureInterval(split);
  const reportOptions = { includeRelayAlternates, groupBy };

  if (doc === "splits") {
    const report: SplitSheetReport | null = await loadSplitSheetReport(
      teamId,
      meetId,
      { ...reportOptions, interval: splitInterval },
    );
    if (!report) notFound();
    const wide = report.pageOrientation === "landscape";
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <MeetEntryNav teamId={teamId} meetId={meetId} />
        <div
          className={
            wide
              ? "mx-auto flex w-full max-w-6xl flex-col gap-6"
              : "mx-auto flex w-full max-w-4xl flex-col gap-6"
          }
        >
          <ReportToolbar
            teamId={teamId}
            meetId={meetId}
            meetName={report.meetName}
            includeRelayAlternates={includeRelayAlternates}
            groupBy={groupBy}
            documentKind="splits"
            splitInterval={splitInterval}
            title="Split sheet"
            description="Blank boxes for writing splits on paper. Times are not saved in Aqua."
          />
          <SplitSheetHtmlReport report={report} />
        </div>
      </div>
    );
  }

  const report: MeetEntriesReport | null = await loadMeetEntriesReport(
    teamId,
    meetId,
    reportOptions,
  );
  if (!report) notFound();

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <MeetEntryNav teamId={teamId} meetId={meetId} />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <ReportToolbar
          teamId={teamId}
          meetId={meetId}
          meetName={report.meetName}
          includeRelayAlternates={includeRelayAlternates}
          groupBy={groupBy}
          documentKind="entries"
          title="Individual Meet Entries"
          description="Preview matches the PDF. Relay alternates are omitted unless you include them."
        />
        <MeetEntriesHtmlReport report={report} />
      </div>
    </div>
  );
}

import { MeetEntriesHtmlReport } from "@project-aqua/reports";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MeetEntryNav } from "../meet-entry-nav";
import { DownloadEntriesPdfButton } from "./download-entries-pdf-button";
import { loadMeetEntriesReport } from "./load-meet-entries-report";
import { ReportAlternatesToggle } from "./report-alternates-toggle";
import { ReportGroupToggle } from "./report-group-toggle";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string; meetId: string }>;
}): Promise<Metadata> {
  const { teamId, meetId } = await params;
  const report = await loadMeetEntriesReport(teamId, meetId);
  if (!report) return {};
  return { title: `${report.meetName} - Reports` };
}

export default async function MeetEntryReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string; meetId: string }>;
  searchParams: Promise<{ alts?: string; group?: string }>;
}) {
  const { teamId, meetId } = await params;
  const { alts, group } = await searchParams;
  const includeRelayAlternates = alts === "1";
  const groupBy = group === "swimmer" ? "swimmer" : "event";
  const report = await loadMeetEntriesReport(teamId, meetId, {
    includeRelayAlternates,
    groupBy,
  });
  if (!report) notFound();

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <MeetEntryNav teamId={teamId} meetId={meetId} />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-medium">Individual Meet Entries</h2>
              <p className="text-muted-foreground text-sm">
                Preview matches the PDF. Relay alternates are omitted unless you
                include them.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Suspense>
                <ReportGroupToggle />
              </Suspense>
              <Suspense>
                <ReportAlternatesToggle />
              </Suspense>
            </div>
          </div>
          <DownloadEntriesPdfButton
            teamId={teamId}
            meetId={meetId}
            meetName={report.meetName}
            includeRelayAlternates={includeRelayAlternates}
            groupBy={groupBy}
          />
        </div>

        <MeetEntriesHtmlReport report={report} />
      </div>
    </div>
  );
}

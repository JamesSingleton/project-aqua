import { MeetEntriesHtmlReport } from "@project-aqua/reports";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DownloadEntriesPdfButton } from "./download-entries-pdf-button";
import { loadMeetEntriesReport } from "./load-meet-entries-report";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string; meetId: string }>;
}): Promise<Metadata> {
  const { teamId, meetId } = await params;
  const report = await loadMeetEntriesReport(teamId, meetId);
  if (!report) return {};
  return { title: `${report.meetName} - Entry report` };
}

export default async function MeetEntryReportPage({
  params,
}: {
  params: Promise<{ teamId: string; meetId: string }>;
}) {
  const { teamId, meetId } = await params;
  const report = await loadMeetEntriesReport(teamId, meetId);
  if (!report) notFound();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">
            Download a PDF of the meet entries.
          </p>
        </div>
        <DownloadEntriesPdfButton
          teamId={teamId}
          meetId={meetId}
          meetName={report.meetName}
        />
      </div>

      <MeetEntriesHtmlReport report={report} />
    </div>
  );
}

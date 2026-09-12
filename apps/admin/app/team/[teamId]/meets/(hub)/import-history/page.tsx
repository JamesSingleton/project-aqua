import { Badge } from "@project-aqua/ui/components/badge";
import type { Metadata } from "next";
import Link from "next/link";
import { getImportJobHistoryAction } from "../../actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  return {
    title: "Import history",
    description: "Recent meet file imports for this team.",
    alternates: { canonical: `/team/${teamId}/meets/import-history` },
  };
}

const JOB_TYPE_LABEL: Record<string, string> = {
  meet_events: "Events",
  meet_entries: "Entries",
  meet_results: "Results",
};

const STATUS_VARIANT: Record<string, "secondary" | "outline" | "destructive"> =
  {
    complete: "secondary",
    processing: "outline",
    pending: "outline",
    failed: "destructive",
  };

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function summaryLine(
  job: Awaited<ReturnType<typeof getImportJobHistoryAction>>[number],
) {
  const s = job.summary;
  if (!s) return null;
  const parts = [
    s.events ? `${s.events} events` : null,
    s.entries ? `${s.entries} entries` : null,
    s.results ? `${s.results} results` : null,
    s.swimmersCreated ? `${s.swimmersCreated} swimmers added` : null,
    s.entriesSkipped ? `${s.entriesSkipped} entries skipped` : null,
    s.resultsSkipped ? `${s.resultsSkipped} results skipped` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export default async function MeetsImportHistoryPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const jobs = await getImportJobHistoryAction(teamId);

  return (
    <div className="flex flex-col gap-4">
      {jobs.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No meet file imports yet. Use “Import meet file” above to bring in
          events, entries, or results.
        </p>
      ) : (
        <ul className="divide-border divide-y rounded-lg border">
          {jobs.map((job) => {
            const meetId = job.summary?.meetId;
            const label = JOB_TYPE_LABEL[job.jobType] ?? job.jobType;
            const summary = summaryLine(job);
            const content = (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">
                      {label} import
                      {job.summary?.linkedExisting ? " (linked)" : ""}
                    </p>
                    <Badge variant={STATUS_VARIANT[job.status] ?? "outline"}>
                      {job.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {formatTimestamp(job.createdAt)}
                    {summary ? ` · ${summary}` : ""}
                  </p>
                  {job.status === "failed" && job.errors ? (
                    <p className="text-destructive mt-1 text-sm">
                      {job.errors}
                    </p>
                  ) : null}
                </div>
              </div>
            );
            return (
              <li key={job.id}>
                {meetId ? (
                  <Link
                    href={`/team/${teamId}/meets/${meetId}`}
                    className="hover:bg-muted/40 block transition-colors"
                  >
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

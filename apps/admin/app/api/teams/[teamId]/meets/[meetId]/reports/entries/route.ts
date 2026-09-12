import { AuthError } from "@project-aqua/db/authz";
import { MeetEntriesPdfDocument, renderToStream } from "@project-aqua/reports";
import { loadMeetEntriesReport } from "@/app/team/[teamId]/meets/[meetId]/report/load-meet-entries-report";

function safeFilename(name: string): string {
  return name.replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "") || "meet";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ teamId: string; meetId: string }> },
) {
  const { teamId, meetId } = await context.params;
  const url = new URL(request.url);
  const preview = url.searchParams.get("preview") === "true";
  const includeRelayAlternates = url.searchParams.get("alts") === "1";

  try {
    const report = await loadMeetEntriesReport(teamId, meetId, {
      includeRelayAlternates,
      groupBy:
        url.searchParams.get("group") === "swimmer" ? "swimmer" : "event",
    });
    if (!report) {
      return new Response("Meet not found", { status: 404 });
    }

    const stream = await renderToStream(MeetEntriesPdfDocument({ report }));
    const blob = await new Response(stream as unknown as BodyInit).blob();
    const filename = `${safeFilename(report.meetName)}_entries.pdf`;

    const headers: Record<string, string> = {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store, max-age=0",
    };
    if (!preview) {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }

    return new Response(blob, { headers });
  } catch (error) {
    if (error instanceof AuthError) {
      return new Response(error.message, { status: error.status });
    }
    const message =
      error instanceof Error ? error.message : "Failed to generate PDF";
    return new Response(message, { status: 500 });
  }
}

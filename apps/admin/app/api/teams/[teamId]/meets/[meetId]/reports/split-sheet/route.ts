import { AuthError } from "@project-aqua/db/authz";
import { renderToStream, SplitSheetPdfDocument } from "@project-aqua/reports";
import { parseSplitCaptureInterval } from "@project-aqua/swim-core/split-capture";
import { loadSplitSheetReport } from "@/app/team/[teamId]/meets/[meetId]/report/load-split-sheet-report";

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
    const report = await loadSplitSheetReport(teamId, meetId, {
      includeRelayAlternates,
      groupBy:
        url.searchParams.get("group") === "swimmer" ? "swimmer" : "event",
      interval: parseSplitCaptureInterval(url.searchParams.get("split")),
    });
    if (!report) {
      return new Response("Meet not found", { status: 404 });
    }

    const stream = await renderToStream(SplitSheetPdfDocument({ report }));
    const blob = await new Response(stream as unknown as BodyInit).blob();
    const filename = `${safeFilename(report.meetName)}_split-sheet.pdf`;

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

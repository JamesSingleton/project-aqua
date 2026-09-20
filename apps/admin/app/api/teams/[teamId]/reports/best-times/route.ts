import { getSession } from "@project-aqua/auth/session";
import {
  AuthError,
  getOrganizationMeetImportIdentity,
  requireTeamRole,
} from "@project-aqua/db/authz";
import { getTeamBestTimes } from "@project-aqua/db/queries/progression";
import {
  buildTeamBestTimesReport,
  renderToStream,
  TeamBestTimesPdfDocument,
} from "@project-aqua/reports";

function safeFilename(name: string): string {
  return name.replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "") || "team";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await context.params;

  try {
    const session = await getSession();
    await requireTeamRole(session?.user?.id, teamId, [
      "owner",
      "head_coach",
      "assistant_coach",
      "admin",
      "member",
    ]);

    const [identity, bestTimes] = await Promise.all([
      getOrganizationMeetImportIdentity(teamId),
      getTeamBestTimes(teamId),
    ]);

    const teamName = identity?.name ?? "Team";
    const report = buildTeamBestTimesReport({
      teamName,
      teamCode: identity?.teamCode ?? null,
      coachName: session?.user?.name ?? null,
      coachEmail: session?.user?.email ?? null,
      times: bestTimes.flatMap((bt) => {
        if (bt.gender !== "male" && bt.gender !== "female") return [];
        if (bt.course !== "SCY" && bt.course !== "SCM" && bt.course !== "LCM") {
          return [];
        }
        return [
          {
            swimmerId: bt.swimmerId,
            swimmerName: `${bt.firstName} ${bt.lastName}`,
            gender: bt.gender,
            eventKey: bt.eventKey,
            course: bt.course,
            timeMs: bt.timeMs,
          },
        ];
      }),
    });

    const stream = await renderToStream(TeamBestTimesPdfDocument({ report }));
    const blob = await new Response(stream as unknown as BodyInit).blob();
    const filename = `${safeFilename(teamName)}_best_times_scy.pdf`;

    return new Response(blob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return new Response(error.message, { status: error.status });
    }
    const message =
      error instanceof Error ? error.message : "Failed to generate PDF";
    return new Response(message, { status: 500 });
  }
}

"use server";

import { getSession } from "@project-aqua/auth/session";
import { assertFeature } from "@project-aqua/billing/features";
import { requireCoachSafeSportCurrent, requireTeamRole } from "@project-aqua/db/authz";
import {
  createImportJob,
  updateImportJob,
} from "@project-aqua/db/queries/imports";
import {
  addMeetEntry,
  addMeetEvent,
  addMeetResult,
  createMeet,
  getMeetById,
  getMeetEntries,
  getMeetEvents,
  getMeets,
} from "@project-aqua/db/queries/meets";
import { addSwimmer } from "@project-aqua/db/queries/roster";
import { isMinorSwimmer } from "@project-aqua/swim-core/age";
import {
  sendMeetImportComplete,
  sendRosterImportComplete,
  sendRosterImportFailed,
} from "@project-aqua/emails";
import { parseTime } from "@project-aqua/swim-core/times";
import { createMeetSchema } from "@project-aqua/swim-core/validators";
import { parseRosterCsv } from "@project-aqua/swim-formats/csv";
import { parseHy3 } from "@project-aqua/swim-formats/hy3";
import { parseSdif } from "@project-aqua/swim-formats/sdif";
import { revalidatePath } from "next/cache";

export async function createMeetAction(teamId: string, formData: FormData) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const parsed = createMeetSchema.parse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
    course: formData.get("course"),
    location: formData.get("location") || undefined,
  });

  const id = await createMeet(teamId, parsed);
  revalidatePath(`/team/${teamId}/meets`);
  return id;
}

export async function importMeetFileAction(
  teamId: string,
  content: string,
  format: "sdif" | "hy3",
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);
  await assertFeature(teamId, "meet_import");

  const jobId = await createImportJob(teamId, `meet_${format}`);
  await updateImportJob(jobId, { status: "processing" });

  try {
    const parsed = format === "sdif" ? parseSdif(content) : parseHy3(content);
    const meetId = await createMeet(teamId, {
      name: parsed.name,
      startDate: parsed.startDate ?? new Date().toISOString(),
      course: parsed.course,
      location: parsed.location,
    });

    for (const event of parsed.events) {
      await addMeetEvent(meetId, event);
    }

    revalidatePath(`/team/${teamId}/meets`);
    await updateImportJob(jobId, {
      status: "complete",
      resultSummary: JSON.stringify({
        meetId,
        events: parsed.events.length,
        entries: parsed.entries.length,
      }),
    });

    if (session?.user?.email) {
      await sendMeetImportComplete(session.user.email, {
        teamName: "Your team",
        meetName: parsed.name,
        eventsCount: parsed.events.length,
        entriesCount: parsed.entries.length,
      });
    }

    return { meetId, events: parsed.events.length };
  } catch (error) {
    await updateImportJob(jobId, {
      status: "failed",
      errors: error instanceof Error ? error.message : "Import failed",
    });
    throw error;
  }
}

export async function importRosterCsvAction(teamId: string, content: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const jobId = await createImportJob(teamId, "roster_csv");
  await updateImportJob(jobId, { status: "processing" });

  try {
    const rows = parseRosterCsv(content);
    if (rows.some((r) => isMinorSwimmer(r.dateOfBirth))) {
      await requireCoachSafeSportCurrent(session?.user?.id, teamId);
    }
    let added = 0;

    for (const row of rows) {
      await addSwimmer(teamId, row);
      added++;
    }

    revalidatePath(`/team/${teamId}/roster`);
    await updateImportJob(jobId, {
      status: "complete",
      resultSummary: JSON.stringify({ added }),
    });

    if (session?.user?.email) {
      await sendRosterImportComplete(session.user.email, {
        teamName: "Your team",
        added,
        updated: 0,
      });
    }

    return { added };
  } catch (error) {
    await updateImportJob(jobId, {
      status: "failed",
      errors: error instanceof Error ? error.message : "Import failed",
    });

    if (session?.user?.email) {
      await sendRosterImportFailed(session.user.email, {
        teamName: "Your team",
        errorSummary: error instanceof Error ? error.message : "Import failed",
      });
    }

    throw error;
  }
}

export async function getMeetsAction(teamId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
    "admin",
    "member",
  ]);
  return getMeets(teamId);
}

export async function getMeetDetailAction(teamId: string, meetId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
    "admin",
    "member",
  ]);

  const meet = await getMeetById(meetId, teamId);
  if (!meet) return null;

  const [events, entries] = await Promise.all([
    getMeetEvents(meetId),
    getMeetEntries(meetId),
  ]);

  return { meet, events, entries };
}

export async function addResultAction(
  teamId: string,
  meetId: string,
  meetEventId: string,
  swimmerId: string,
  time: string,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);
  await assertFeature(teamId, "progression");

  const timeMs = parseTime(time);
  await addMeetResult(meetId, meetEventId, swimmerId, timeMs);
  revalidatePath(`/team/${teamId}/progression`);
  revalidatePath(`/team/${teamId}/swimmers/${swimmerId}`);
}

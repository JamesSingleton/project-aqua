"use server";

import { getSession } from "@project-aqua/auth/session";
import { requireTeamRole } from "@project-aqua/db/authz";
import { ensureSwimEvent } from "@project-aqua/db/queries/meets";
import {
  createTimeStandardSet,
  deleteTimeStandardCut,
  deleteTimeStandardSet,
  getTimeStandardCutsForLookup,
  getTimeStandardEvent,
  listTimeStandardEvents,
  listTimeStandardSets,
  listTimeStandardSetsWithCounts,
  replaceTimeStandardCuts,
  updateTimeStandardCutTime,
  updateTimeStandardSet,
  upsertTimeStandardCut,
} from "@project-aqua/db/queries/time-standards";
import {
  type Course,
  type EventGender,
  eventGenderFromCode,
  type RelayStroke,
  type Stroke,
} from "@project-aqua/swim-core/events";
import { parseTime } from "@project-aqua/swim-core/times";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const manualCutSchema = z.object({
  setId: z.string().min(1),
  eventKey: z.string().min(1),
  ageGroup: z.string().trim().min(1),
  time: z.string().trim().min(1),
});

function revalidateStandards(teamId: string) {
  revalidatePath(`/team/${teamId}/meets/time-standards`);
  revalidatePath(`/team/${teamId}/meets/results`);
}

function parseEventKeyParts(eventKey: string): {
  distance: number;
  stroke: string;
  course: Course;
  gender: EventGender;
} | null {
  const parts = eventKey.split("_");
  if (parts.length < 4) return null;
  const genderCode = parts[parts.length - 1] ?? "m";
  const courseRaw = (parts[parts.length - 2] ?? "scy").toUpperCase();
  if (courseRaw !== "SCY" && courseRaw !== "SCM" && courseRaw !== "LCM") {
    return null;
  }
  const distance = Number.parseInt(parts[0] ?? "", 10);
  if (!Number.isFinite(distance)) return null;
  const stroke = parts.slice(1, -2).join("_");
  if (!stroke) return null;
  return {
    distance,
    stroke,
    course: courseRaw,
    gender: eventGenderFromCode(genderCode),
  };
}

export async function listTimeStandardSetsAction(teamId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
    "admin",
    "member",
  ]);
  return listTimeStandardSetsWithCounts(teamId);
}

export async function listTimeStandardEventsAction(teamId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
    "admin",
    "member",
  ]);
  return listTimeStandardEvents();
}

export async function getTimeStandardCutsAction(teamId: string, setId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
    "admin",
    "member",
  ]);
  const lookup = await getTimeStandardCutsForLookup(teamId, setId);
  if (!lookup) throw new Error("Time standard set not found");
  return {
    set: {
      id: lookup.set.id,
      name: lookup.set.name,
      course: lookup.set.course,
      seasonLabel: lookup.set.seasonLabel,
    },
    cuts: lookup.cuts.map((c) => ({
      id: c.id,
      eventKey: c.eventKey,
      eventLabel: c.eventLabel,
      gender: c.gender,
      ageGroup: c.ageGroup,
      timeMs: c.timeMs,
    })),
  };
}

export async function createTimeStandardSetAction(
  teamId: string,
  data: {
    name: string;
    course: Course;
    seasonLabel?: string;
  },
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const name = data.name.trim();
  if (!name) throw new Error("Name is required");

  const id = await createTimeStandardSet(teamId, {
    name,
    course: data.course,
    seasonLabel: data.seasonLabel?.trim() || undefined,
  });
  revalidateStandards(teamId);
  return id;
}

export async function updateTimeStandardSetAction(
  teamId: string,
  setId: string,
  data: { name: string; seasonLabel?: string | null },
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const updated = await updateTimeStandardSet(teamId, setId, data);
  if (!updated) throw new Error("Time standard set not found");
  revalidateStandards(teamId);
}

export async function deleteTimeStandardSetAction(
  teamId: string,
  setId: string,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const deleted = await deleteTimeStandardSet(teamId, setId);
  if (!deleted) throw new Error("Time standard set not found");
  revalidateStandards(teamId);
}

export async function saveTimeStandardCutAction(
  teamId: string,
  input: z.input<typeof manualCutSchema>,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const data = manualCutSchema.parse(input);
  const [lookup, event] = await Promise.all([
    getTimeStandardCutsForLookup(teamId, data.setId),
    getTimeStandardEvent(data.eventKey),
  ]);
  if (!lookup) throw new Error("Time standard set not found");
  if (!event) throw new Error("Select a valid event");
  if (event.course !== lookup.set.course) {
    throw new Error("The selected event does not match the standards course");
  }

  const timeMs = parseTime(data.time);
  if (!Number.isFinite(timeMs) || timeMs <= 0) {
    throw new Error("Enter a valid qualifying time");
  }

  await upsertTimeStandardCut(data.setId, {
    eventKey: event.eventKey,
    gender: event.gender,
    ageGroup: data.ageGroup,
    timeMs,
  });

  revalidateStandards(teamId);
  return { eventKey: event.eventKey };
}

export async function updateTimeStandardCutAction(
  teamId: string,
  cutId: string,
  time: string,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const timeMs = parseTime(time.trim());
  if (!Number.isFinite(timeMs) || timeMs <= 0) {
    throw new Error("Enter a valid qualifying time");
  }

  const updated = await updateTimeStandardCutTime(teamId, cutId, timeMs);
  if (!updated) throw new Error("Cut not found");
  revalidateStandards(teamId);
}

export async function deleteTimeStandardCutAction(
  teamId: string,
  cutId: string,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const deleted = await deleteTimeStandardCut(teamId, cutId);
  if (!deleted) throw new Error("Cut not found");
  revalidateStandards(teamId);
}

/**
 * CSV columns: eventKey,gender,ageGroup,time
 * gender may be male/female/mixed or m/f/x.
 */
export async function uploadTimeStandardCutsAction(
  teamId: string,
  setId: string,
  csvContent: string,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const sets = await listTimeStandardSets(teamId);
  const set = sets.find((s) => s.id === setId);
  if (!set) throw new Error("Time standard set not found");

  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) throw new Error("CSV is empty");

  const header = lines[0]?.toLowerCase() ?? "";
  const hasHeader =
    header.includes("eventkey") ||
    header.includes("event_key") ||
    header.startsWith("event");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const cuts: Array<{
    eventKey: string;
    gender: EventGender;
    ageGroup: string;
    timeMs: number;
  }> = [];

  for (const line of dataLines) {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 4) continue;
    const [eventKey, genderRaw, ageGroup, timeRaw] = cols;
    if (!eventKey || !genderRaw || !ageGroup || !timeRaw) continue;

    const gender = eventGenderFromCode(genderRaw);
    const timeMs = parseTime(timeRaw);
    if (!Number.isFinite(timeMs) || timeMs <= 0) {
      throw new Error(`Invalid time for ${eventKey}: ${timeRaw}`);
    }

    const parts = parseEventKeyParts(eventKey);
    if (parts) {
      await ensureSwimEvent({
        eventKey,
        distance: parts.distance,
        stroke: parts.stroke as Stroke | RelayStroke,
        gender: parts.gender,
        course: parts.course,
      });
    }

    cuts.push({ eventKey, gender, ageGroup, timeMs });
  }

  if (cuts.length === 0) {
    throw new Error("No valid cut rows found in CSV");
  }

  await replaceTimeStandardCuts(setId, cuts);
  revalidateStandards(teamId);
  return { count: cuts.length };
}

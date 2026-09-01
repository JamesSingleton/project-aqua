"use server";

import { getSession } from "@project-aqua/auth/session";
import {
  requireSwimmerTeamAccess,
  requireTeamRole,
} from "@project-aqua/db/authz";
import { ensureSwimEvent } from "@project-aqua/db/queries/meets";
import {
  deleteBestTime,
  setBestTime,
} from "@project-aqua/db/queries/progression";
import { getRoster } from "@project-aqua/db/queries/roster";
import {
  formatLocalDateOnly,
  parseDateOnly,
} from "@project-aqua/swim-core/calendar-date";
import { getCatalogEvent } from "@project-aqua/swim-core/event-catalog";
import type { Course } from "@project-aqua/swim-core/events";
import { normalizePersonName } from "@project-aqua/swim-core/people";
import { parseTime } from "@project-aqua/swim-core/times";
import { parseTimesCsv } from "@project-aqua/swim-formats/csv";
import { revalidatePath } from "next/cache";

const MUTATE_ROLES = [
  "owner",
  "head_coach",
  "assistant_coach",
  "admin",
] as const;

function parseAchievedAt(value: string): Date {
  const parsed = parseDateOnly(value.slice(0, 10));
  if (!parsed) {
    throw new Error("Invalid date");
  }
  return parsed;
}

function revalidateProgression(teamId: string, swimmerId: string) {
  revalidatePath(`/team/${teamId}/progression/${swimmerId}`);
  revalidatePath(`/team/${teamId}/swimmers/${swimmerId}/progression`);
  revalidatePath(`/team/${teamId}/roster`);
}

export async function setSwimmerBestTimeAction(
  teamId: string,
  swimmerId: string,
  input: {
    eventKey: string;
    time: string;
    achievedOn: string;
  },
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [...MUTATE_ROLES]);
  await requireSwimmerTeamAccess(session?.user?.id, swimmerId, teamId);

  const catalogEvent = getCatalogEvent(input.eventKey);
  if (catalogEvent?.eventType !== "individual") {
    throw new Error("Unknown event");
  }

  const timeMs = parseTime(input.time);
  if (timeMs <= 0) {
    throw new Error("Enter a valid time (e.g. 1:02.34 or 28.50)");
  }

  await ensureSwimEvent({
    eventKey: catalogEvent.eventKey,
    distance: catalogEvent.distance,
    stroke: catalogEvent.stroke,
    gender: catalogEvent.gender,
    course: catalogEvent.course,
  });

  await setBestTime({
    swimmerId,
    organizationId: teamId,
    eventKey: catalogEvent.eventKey,
    course: catalogEvent.course as Course,
    timeMs,
    achievedAt: parseAchievedAt(input.achievedOn),
  });

  revalidateProgression(teamId, swimmerId);
}

export async function deleteSwimmerBestTimeAction(
  teamId: string,
  swimmerId: string,
  bestTimeId: string,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [...MUTATE_ROLES]);
  await requireSwimmerTeamAccess(session?.user?.id, swimmerId, teamId);

  const deleted = await deleteBestTime(bestTimeId, teamId);
  if (!deleted) {
    throw new Error("Best time not found");
  }

  revalidateProgression(teamId, swimmerId);
}

export async function importBestTimesCsvAction(
  teamId: string,
  content: string,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [...MUTATE_ROLES]);

  const rows = parseTimesCsv(content);
  if (rows.length === 0) {
    throw new Error(
      "No times found. Use first_name, last_name, event_key, time columns.",
    );
  }

  const roster = await getRoster(teamId);
  const byName = new Map(
    roster.map((s) => [
      `${normalizePersonName(s.lastName)}|${normalizePersonName(s.firstName)}`,
      s,
    ]),
  );

  let imported = 0;
  let unmatched = 0;
  let invalid = 0;
  const today = formatLocalDateOnly(new Date());

  for (const row of rows) {
    const swimmer = byName.get(
      `${normalizePersonName(row.lastName)}|${normalizePersonName(row.firstName)}`,
    );
    if (!swimmer) {
      unmatched += 1;
      continue;
    }

    const catalogEvent = getCatalogEvent(row.eventKey);
    if (catalogEvent?.eventType !== "individual") {
      invalid += 1;
      continue;
    }

    const timeMs = parseTime(row.time);
    if (timeMs <= 0) {
      invalid += 1;
      continue;
    }

    let achievedAt: Date;
    try {
      achievedAt = parseAchievedAt(row.achievedOn?.slice(0, 10) ?? today);
    } catch {
      invalid += 1;
      continue;
    }

    await ensureSwimEvent({
      eventKey: catalogEvent.eventKey,
      distance: catalogEvent.distance,
      stroke: catalogEvent.stroke,
      gender: catalogEvent.gender,
      course: catalogEvent.course,
    });

    await setBestTime({
      swimmerId: swimmer.swimmerId,
      organizationId: teamId,
      eventKey: catalogEvent.eventKey,
      course: catalogEvent.course as Course,
      timeMs,
      achievedAt,
    });
    imported += 1;
  }

  revalidatePath(`/team/${teamId}/progression`);
  revalidatePath(`/team/${teamId}/roster`);
  return { imported, unmatched, invalid };
}

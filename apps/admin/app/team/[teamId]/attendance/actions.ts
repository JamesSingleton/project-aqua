"use server";

import { getSession } from "@project-aqua/auth/session";
import { requireTeamRole } from "@project-aqua/db/authz";
import {
  createPracticeSession,
  getAttendanceForSession,
  getPracticeSessions,
  setAttendance,
} from "@project-aqua/db/queries/attendance";
import type { AttendanceStatus } from "@project-aqua/swim-core/validators";
import { revalidatePath } from "next/cache";

export async function createSessionAction(
  teamId: string,
  data: { date: string; location?: string; notes?: string },
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
  ]);

  const id = await createPracticeSession(teamId, {
    date: new Date(data.date),
    location: data.location,
    notes: data.notes,
  });

  revalidatePath(`/team/${teamId}/attendance`);
  return id;
}

export async function setAttendanceAction(
  teamId: string,
  sessionId: string,
  membershipId: string,
  status: AttendanceStatus,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
  ]);

  await setAttendance(sessionId, membershipId, status);
  revalidatePath(`/team/${teamId}/attendance`);
}

export async function getSessionsAction(teamId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
    "admin",
    "member",
  ]);
  return getPracticeSessions(teamId);
}

export async function getSessionAttendanceAction(
  teamId: string,
  sessionId: string,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
    "admin",
    "member",
  ]);
  return getAttendanceForSession(sessionId);
}

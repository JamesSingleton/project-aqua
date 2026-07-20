"use server";

import { getSession } from "@project-aqua/auth/session";
import { requireTeamRole } from "@project-aqua/db/authz";
import {
  createPracticeSession,
  getAttendanceForSession,
  getPracticeSessions,
  setAttendance,
  setPracticeRsvp,
} from "@project-aqua/db/queries/attendance";
import type {
  AttendanceStatus,
  RsvpStatus,
} from "@project-aqua/swim-core/validators";
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
    "admin",
  ]);

  const id = await createPracticeSession(teamId, {
    date: new Date(data.date),
    location: data.location,
    notes: data.notes,
  });

  revalidatePath(`/team/${teamId}/attendance`);
  revalidatePath(`/team/${teamId}/calendar`);
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
    "admin",
  ]);

  await setAttendance(sessionId, membershipId, status);
  revalidatePath(`/team/${teamId}/attendance`);
  revalidatePath(`/team/${teamId}/attendance/${sessionId}`);
}

export async function setRsvpAction(
  teamId: string,
  sessionId: string,
  membershipId: string,
  rsvpStatus: RsvpStatus,
  absenceReason?: string,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
    "admin",
    "member",
  ]);

  await setPracticeRsvp(
    sessionId,
    membershipId,
    rsvpStatus,
    absenceReason ?? null,
  );
  revalidatePath(`/team/${teamId}/attendance/${sessionId}`);
  revalidatePath(`/team/${teamId}/calendar`);
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

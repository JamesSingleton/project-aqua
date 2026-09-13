"use server";

import { getSession } from "@project-aqua/auth/session";
import { requireTeamRole } from "@project-aqua/db/authz";
import {
  type CommitSeasonRollInput,
  commitSeasonRoll,
  listMembershipsNotInSeason,
  previewSeasonRoll,
} from "@project-aqua/db/queries/seasons";
import { revalidatePath } from "next/cache";

export async function previewNewSeasonAction(
  teamId: string,
  sourceSeasonId: string,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "admin",
  ]);
  return previewSeasonRoll(teamId, sourceSeasonId);
}

export async function commitNewSeasonAction(
  teamId: string,
  input: CommitSeasonRollInput,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "admin",
  ]);
  const season = await commitSeasonRoll(teamId, input);
  revalidatePath(`/team/${teamId}/roster`);
  return season;
}

export async function searchReturnersAction(
  teamId: string,
  seasonId: string,
  q?: string,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "admin",
  ]);
  return listMembershipsNotInSeason(teamId, seasonId, q);
}

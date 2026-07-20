"use server";

import { getSession } from "@project-aqua/auth/session";
import { requireTeamRole } from "@project-aqua/db/authz";
import {
  assignMembershipGroup,
  assignMembershipGroupsBulk,
  createTrainingGroup,
  deleteTrainingGroup,
  listTrainingGroups,
} from "@project-aqua/db/queries/groups";
import { revalidatePath } from "next/cache";

const ROLES = [
  "owner",
  "head_coach",
  "assistant_coach",
  "admin",
  "member",
] as const;

const MUTATE = ["owner", "head_coach", "admin"] as const;

export async function listGroupsAction(teamId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [...ROLES]);
  return listTrainingGroups(teamId);
}

export async function createGroupAction(teamId: string, name: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [...MUTATE]);
  if (!name.trim()) throw new Error("Group name is required");
  const row = await createTrainingGroup(teamId, name);
  revalidatePath(`/team/${teamId}/roster`);
  return row;
}

export async function deleteGroupAction(teamId: string, groupId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [...MUTATE]);
  await deleteTrainingGroup(teamId, groupId);
  revalidatePath(`/team/${teamId}/roster`);
}

export async function assignGroupAction(
  teamId: string,
  membershipId: string,
  groupId: string | null,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [...MUTATE]);
  await assignMembershipGroup(membershipId, groupId);
  revalidatePath(`/team/${teamId}/roster`);
}

export async function assignGroupsBulkAction(
  teamId: string,
  membershipIds: string[],
  groupId: string | null,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [...MUTATE]);
  const uniqueIds = [...new Set(membershipIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    throw new Error("Select at least one swimmer");
  }
  await assignMembershipGroupsBulk(teamId, uniqueIds, groupId);
  revalidatePath(`/team/${teamId}/roster`);
}

"use server";

import { getSession } from "@project-aqua/auth/session";
import {
  requireCoachSafeSportCurrent,
  requireTeamRole,
} from "@project-aqua/db/authz";
import { assignMembershipGroup } from "@project-aqua/db/queries/groups";
import { getSwimmerById, updateSwimmer } from "@project-aqua/db/queries/roster";
import { isMinorSwimmer } from "@project-aqua/swim-core/age";
import { rosterRowSchema } from "@project-aqua/swim-core/validators";
import { revalidatePath } from "next/cache";
import type { CreateSwimmerFormValues } from "@/schemas";
import { normalizeCreateSwimmerFormValues } from "@/schemas/swimmer-create.utils";

export async function editSwimmerAction(
  teamId: string,
  swimmerId: string,
  input: CreateSwimmerFormValues,
  groupId: string | null,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const parsed = rosterRowSchema.parse(
    normalizeCreateSwimmerFormValues({
      ...input,
      // Prefer groupId over the deprecated free-text practice group field.
      practiceGroup: undefined,
    }),
  );

  if (isMinorSwimmer(parsed.dateOfBirth)) {
    await requireCoachSafeSportCurrent(session?.user?.id, teamId);
  }

  await updateSwimmer(swimmerId, teamId, parsed);

  const membership = await getSwimmerById(swimmerId, teamId);
  if (!membership) throw new Error("Swimmer not found");
  await assignMembershipGroup(teamId, membership.membershipId, groupId);

  revalidatePath(`/team/${teamId}/roster`);
  revalidatePath(`/team/${teamId}/swimmers/${swimmerId}`);
  revalidatePath(`/team/${teamId}/swimmers/${swimmerId}/edit`);
}

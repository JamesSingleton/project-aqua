"use server";

import { getSession } from "@lane4hq/auth/session";
import { requireTeamRole } from "@lane4hq/db/authz";
import { updateSwimmer } from "@lane4hq/db/queries/roster";
import { parseEligibilityStatus } from "@lane4hq/swim-core/team-types";
import { revalidatePath } from "next/cache";

export async function updateSwimmerEligibilityAction(
  teamId: string,
  swimmerId: string,
  input: {
    eligibilityStatus: string | null;
    eligibilityNotes?: string | null;
  },
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
  ]);

  const status =
    input.eligibilityStatus == null || input.eligibilityStatus === ""
      ? null
      : parseEligibilityStatus(input.eligibilityStatus);

  if (input.eligibilityStatus && !status) {
    throw new Error("Invalid eligibility status");
  }

  await updateSwimmer(swimmerId, teamId, {
    eligibilityStatus: status,
    eligibilityNotes: input.eligibilityNotes?.trim() || null,
  });

  revalidatePath(`/team/${teamId}/swimmers/${swimmerId}`);
  revalidatePath(`/team/${teamId}/roster`);
  revalidatePath(`/team/${teamId}/meets`, "layout");
}

"use server";

import { getSession } from "@project-aqua/auth/session";
import { canAddSwimmer } from "@project-aqua/billing/features";
import {
  requireCoachSafeSportCurrent,
  requireTeamMember,
  requireTeamRole,
} from "@project-aqua/db/authz";
import { db } from "@project-aqua/db/client";
import {
  addSwimmer,
  searchLinkableSwimmersByIdentity,
  searchSwimmerByUsaId,
} from "@project-aqua/db/queries/roster";
import { organization } from "@project-aqua/db/schema";
import { sendMaappAcknowledgmentRequest } from "@project-aqua/emails";
import { isMinorSwimmer } from "@project-aqua/swim-core/age";
import { normalizeCreateSwimmerFormValues } from "@project-aqua/swim-core/validators";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { CreateSwimmerFormValues } from "@/schemas";
import { createSwimmerFormSchema } from "@/schemas";

export async function createSwimmerAction(
  teamId: string,
  input: CreateSwimmerFormValues,
) {
  const session = await getSession();
  const userId = session?.user?.id;
  await requireTeamRole(userId, teamId, ["owner", "head_coach"]);

  const parsed = createSwimmerFormSchema.parse(
    normalizeCreateSwimmerFormValues(input),
  );

  if (isMinorSwimmer(parsed.dateOfBirth)) {
    await requireCoachSafeSportCurrent(userId, teamId);
  }

  const canAdd = await canAddSwimmer(teamId);
  if (!canAdd) {
    throw new Error(
      "Swimmer limit reached for your plan. Upgrade to add more.",
    );
  }

  const result = await addSwimmer(teamId, parsed, {
    viewerUserId: userId,
  });

  if (
    isMinorSwimmer(parsed.dateOfBirth) &&
    parsed.contacts?.parentEmail &&
    session?.user
  ) {
    const [org] = await db
      .select({ name: organization.name })
      .from(organization)
      .where(eq(organization.id, teamId))
      .limit(1);

    const swimmerName = `${parsed.firstName} ${parsed.lastName}`;
    const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
    await sendMaappAcknowledgmentRequest(parsed.contacts.parentEmail, {
      teamName: org?.name ?? "Your team",
      swimmerName,
      parentName: parsed.contacts.parentName,
      acknowledgeUrl: `${baseUrl}/team/${teamId}/swimmers/${result.swimmerId}`,
    });
  }

  revalidatePath(`/team/${teamId}/roster`);
  return result;
}

export async function lookupUsaSwimmerAction(
  teamId: string,
  usaMemberId: string,
) {
  const session = await getSession();
  await requireTeamMember(session?.user?.id, teamId);
  if (!usaMemberId.trim()) return null;
  return searchSwimmerByUsaId(usaMemberId.trim());
}

export async function lookupLinkableSwimmerAction(
  teamId: string,
  identity: {
    firstName: string;
    lastName: string;
    preferredName?: string;
    dateOfBirth: string;
  },
) {
  const session = await getSession();
  const userId = session?.user?.id;
  await requireTeamMember(userId, teamId);
  if (!userId) return [];
  if (
    !identity.firstName.trim() ||
    !identity.lastName.trim() ||
    !identity.dateOfBirth.trim()
  ) {
    return [];
  }

  return searchLinkableSwimmersByIdentity(userId, teamId, identity);
}

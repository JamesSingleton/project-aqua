"use server";

import { getSession } from "@project-aqua/auth/session";
import { assertFeature } from "@project-aqua/billing/features";
import { requireTeamRole } from "@project-aqua/db/authz";
import { db } from "@project-aqua/db/client";
import { organization } from "@project-aqua/db/schema";
import { createSwimsClient } from "@project-aqua/usa-swimming/client";
import { syncRoster } from "@project-aqua/usa-swimming/sync";
import { eq } from "drizzle-orm";

export async function getVendorClubsAction(teamId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);
  await assertFeature(teamId, "swims_sync");

  try {
    const client = createSwimsClient();
    return await client.getVendorClubs();
  } catch {
    return [];
  }
}

export async function connectUsaSwimmingClubAction(
  teamId: string,
  clubId: string,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);
  await assertFeature(teamId, "swims_sync");

  await db
    .update(organization)
    .set({ usaSwimmingClubId: clubId })
    .where(eq(organization.id, teamId));
}

export async function syncSwimsRosterAction(teamId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);
  await assertFeature(teamId, "swims_sync");

  const [org] = await db
    .select({
      name: organization.name,
      usaSwimmingClubId: organization.usaSwimmingClubId,
    })
    .from(organization)
    .where(eq(organization.id, teamId))
    .limit(1);

  const clubId = org?.usaSwimmingClubId;
  if (!clubId) throw new Error("No USA Swimming club connected");

  return syncRoster(teamId, clubId, session?.user?.email, org?.name);
}

export async function getRegistrationLinkAction(teamId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);
  await assertFeature(teamId, "swims_sync");

  const [org] = await db
    .select({ usaSwimmingClubId: organization.usaSwimmingClubId })
    .from(organization)
    .where(eq(organization.id, teamId))
    .limit(1);

  const clubId = org?.usaSwimmingClubId;
  if (!clubId) throw new Error("No USA Swimming club connected");

  const client = createSwimsClient();
  return client.generateRegistrationLink(clubId);
}

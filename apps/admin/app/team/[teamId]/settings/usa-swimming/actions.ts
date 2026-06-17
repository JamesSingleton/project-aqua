"use server";

import { getSession } from "@project-aqua/auth/session";
import { requireTeamRole } from "@project-aqua/db/authz";
import { db } from "@project-aqua/db/client";
import { organization } from "@project-aqua/db/schema";
import { createSwimsClient } from "@project-aqua/usa-swimming/client";
import { syncRoster } from "@project-aqua/usa-swimming/sync";
import { eq } from "drizzle-orm";

export async function getVendorClubsAction(teamId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

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

  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, teamId))
    .limit(1);

  const metadata = org?.metadata ? JSON.parse(org.metadata) : {};
  metadata.usaSwimmingClubId = clubId;

  await db
    .update(organization)
    .set({ metadata: JSON.stringify(metadata) })
    .where(eq(organization.id, teamId));
}

export async function syncSwimsRosterAction(teamId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, teamId))
    .limit(1);

  const metadata = org?.metadata ? JSON.parse(org.metadata) : {};
  const clubId = metadata.usaSwimmingClubId;
  if (!clubId) throw new Error("No USA Swimming club connected");

  return syncRoster(teamId, clubId, session?.user?.email, org?.name);
}

export async function getRegistrationLinkAction(teamId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, teamId))
    .limit(1);

  const metadata = org?.metadata ? JSON.parse(org.metadata) : {};
  const clubId = metadata.usaSwimmingClubId;
  if (!clubId) throw new Error("No USA Swimming club connected");

  const client = createSwimsClient();
  return client.generateRegistrationLink(clubId);
}

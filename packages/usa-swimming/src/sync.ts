import { db } from "@project-aqua/db/client";
import {
  addSwimmer,
  findSwimmerByGoverningBodyId,
  getSwimmerById,
} from "@project-aqua/db/queries/roster";
import {
  swimmerClubRegistrations,
  swimmers,
  teamSwimmerMemberships,
} from "@project-aqua/db/schema";
import { sendSwimsSyncSummary } from "@project-aqua/emails";
import { and, eq } from "drizzle-orm";
import { createSwimsClient } from "./client.js";

function generateId(): string {
  return crypto.randomUUID();
}

async function getMembershipForTeam(swimmerId: string, organizationId: string) {
  const [row] = await db
    .select({ id: teamSwimmerMemberships.id })
    .from(teamSwimmerMemberships)
    .where(
      and(
        eq(teamSwimmerMemberships.swimmerId, swimmerId),
        eq(teamSwimmerMemberships.organizationId, organizationId),
      ),
    )
    .limit(1);
  return row ?? null;
}

async function upsertClubRegistration(
  membershipId: string,
  usaMemberId: string,
  clubId: string,
  member: {
    registrationStatus?: string | null;
    recordId?: string | null;
  },
) {
  const [existing] = await db
    .select({ id: swimmerClubRegistrations.id })
    .from(swimmerClubRegistrations)
    .where(eq(swimmerClubRegistrations.membershipId, membershipId))
    .limit(1);

  if (existing) {
    await db
      .update(swimmerClubRegistrations)
      .set({
        usaMemberId,
        clubId,
        registrationStatus: member.registrationStatus ?? null,
        swimsRecordId: member.recordId ?? null,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(swimmerClubRegistrations.id, existing.id));
    return;
  }

  await db.insert(swimmerClubRegistrations).values({
    id: generateId(),
    membershipId,
    usaMemberId,
    clubId,
    registrationStatus: member.registrationStatus ?? null,
    swimsRecordId: member.recordId ?? null,
    lastSyncedAt: new Date(),
  });
}

export async function syncMemberFromSwims(
  organizationId: string,
  clubId: string,
  memberId: string,
  options?: { inactive?: boolean },
) {
  const client = createSwimsClient();
  const member = await client.getMemberDetails(clubId, memberId);

  const existingSwimmer = await findSwimmerByGoverningBodyId(memberId);
  let swimmerId = existingSwimmer?.id;

  if (!swimmerId) {
    const result = await addSwimmer(organizationId, {
      firstName: member.firstName,
      lastName: member.lastName,
      dateOfBirth: member.dateOfBirth,
      gender: member.gender,
      usaMemberId: memberId,
    });
    swimmerId = result.swimmerId;
  } else {
    await db
      .update(swimmers)
      .set({
        firstName: member.firstName,
        lastName: member.lastName,
        dateOfBirth: member.dateOfBirth,
        gender: member.gender,
        governingBody: "usa_swimming",
        governingBodyId: memberId,
        updatedAt: new Date(),
      })
      .where(eq(swimmers.id, swimmerId));

    const onTeam = await getSwimmerById(swimmerId, organizationId);
    if (!onTeam) {
      await addSwimmer(organizationId, {
        firstName: member.firstName,
        lastName: member.lastName,
        dateOfBirth: member.dateOfBirth,
        gender: member.gender,
        usaMemberId: memberId,
        linkExistingSwimmerId: swimmerId,
      });
    }
  }

  if (options?.inactive) {
    await db
      .update(teamSwimmerMemberships)
      .set({ status: "inactive", leftAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(teamSwimmerMemberships.swimmerId, swimmerId),
          eq(teamSwimmerMemberships.organizationId, organizationId),
        ),
      );
    return { action: "updated" as const, swimmerId };
  }

  const membership = await getMembershipForTeam(swimmerId, organizationId);
  if (membership) {
    await upsertClubRegistration(membership.id, memberId, clubId, member);
  }

  return {
    action: existingSwimmer ? ("updated" as const) : ("added" as const),
    swimmerId,
  };
}

export async function syncRoster(
  organizationId: string,
  clubId: string,
  notifyEmail?: string,
  teamName?: string,
) {
  const client = createSwimsClient();
  const members = await client.getClubMembers(clubId);

  let added = 0;
  let updated = 0;
  const removed = 0;

  for (const member of members) {
    const result = await syncMemberFromSwims(
      organizationId,
      clubId,
      member.memberId,
    );
    if (result.action === "added") added++;
    else updated++;
  }

  if (notifyEmail && teamName) {
    await sendSwimsSyncSummary(notifyEmail, {
      teamName,
      added,
      updated,
      removed,
    });
  }

  return { added, updated, removed };
}

export async function syncCoachAptFromSwims(
  memberId: string,
  organizationMemberId: string,
  apt: {
    status: "current" | "expired" | "pending" | "not_started";
    completedAt?: Date;
    expiresAt?: Date;
    externalId?: string;
  },
) {
  const { upsertStaffCredential } = await import(
    "@project-aqua/db/queries/safesport"
  );

  await upsertStaffCredential({
    memberId: organizationMemberId,
    credentialType: "safesport_core",
    status: apt.status,
    completedAt: apt.completedAt,
    expiresAt: apt.expiresAt,
  });

  return { memberId, synced: true };
}

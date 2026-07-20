import { isMinorSwimmer } from "@project-aqua/swim-core/age";
import { parseClassYear } from "@project-aqua/swim-core/team-types";
import type {
  RosterRow,
  SwimmerContactsInput,
  SwimmerMedicalInput,
} from "@project-aqua/swim-core/validators";
import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { member, organization } from "../schema/auth";
import { trainingGroups } from "../schema/groups";
import {
  swimmerClubRegistrations,
  swimmerContacts,
  swimmerMedical,
  swimmers,
  teamSwimmerMemberships,
} from "../schema/swimmers";

function generateId(): string {
  return crypto.randomUUID();
}

function resolveGoverningBodyId(data: RosterRow): string | undefined {
  return data.governingBodyId ?? data.usaMemberId ?? undefined;
}

function resolveClassYear(data: RosterRow): string | null {
  return parseClassYear(data.classYear) ?? null;
}

async function upsertMembershipContacts(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  membershipId: string,
  contacts?: SwimmerContactsInput,
) {
  if (!contacts) return;

  const values = {
    parentName: contacts.parentName ?? null,
    parentEmail: contacts.parentEmail || null,
    parentPhone: contacts.parentPhone ?? null,
    emergencyName: contacts.emergencyName ?? null,
    emergencyPhone: contacts.emergencyPhone ?? null,
    addressLine1: contacts.addressLine1 ?? null,
    addressLine2: contacts.addressLine2 ?? null,
    city: contacts.city ?? null,
    state: contacts.state ?? null,
    postalCode: contacts.postalCode ?? null,
    country: contacts.country ?? null,
    minorDirectContactConsent: contacts.minorDirectContactConsent ?? false,
    minorDirectContactConsentedAt: contacts.minorDirectContactConsent
      ? new Date()
      : null,
    minorDirectContactConsentedBy:
      contacts.minorDirectContactConsentedBy ?? null,
    updatedAt: new Date(),
  };

  await tx
    .insert(swimmerContacts)
    .values({ membershipId, ...values })
    .onConflictDoUpdate({
      target: swimmerContacts.membershipId,
      set: values,
    });
}

async function upsertMembershipMedical(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  membershipId: string,
  medical?: SwimmerMedicalInput,
) {
  if (!medical) return;

  const values = {
    allergies: medical.allergies ?? null,
    medications: medical.medications ?? null,
    conditions: medical.conditions ?? null,
    notes: medical.notes ?? null,
    updatedAt: new Date(),
  };

  await tx
    .insert(swimmerMedical)
    .values({ membershipId, ...values })
    .onConflictDoUpdate({
      target: swimmerMedical.membershipId,
      set: values,
    });
}

export async function findSwimmerByGoverningBodyId(governingBodyId: string) {
  const [row] = await db
    .select()
    .from(swimmers)
    .where(eq(swimmers.governingBodyId, governingBodyId))
    .limit(1);
  return row ?? null;
}

export async function getRoster(organizationId: string) {
  const rows = await db
    .select({
      membershipId: teamSwimmerMemberships.id,
      swimmerId: swimmers.id,
      firstName: swimmers.firstName,
      middleName: swimmers.middleName,
      lastName: swimmers.lastName,
      preferredName: swimmers.preferredName,
      dateOfBirth: swimmers.dateOfBirth,
      gender: swimmers.gender,
      governingBodyId: swimmers.governingBodyId,
      practiceGroup: teamSwimmerMemberships.practiceGroup,
      trainingGroups: teamSwimmerMemberships.trainingGroups,
      groupId: teamSwimmerMemberships.groupId,
      groupName: trainingGroups.name,
      classYear: teamSwimmerMemberships.classYear,
      status: teamSwimmerMemberships.status,
      joinedAt: teamSwimmerMemberships.joinedAt,
    })
    .from(teamSwimmerMemberships)
    .innerJoin(swimmers, eq(teamSwimmerMemberships.swimmerId, swimmers.id))
    .leftJoin(
      trainingGroups,
      eq(teamSwimmerMemberships.groupId, trainingGroups.id),
    )
    .where(
      and(
        eq(teamSwimmerMemberships.organizationId, organizationId),
        eq(teamSwimmerMemberships.status, "active"),
      ),
    );

  return rows;
}

export async function getSwimmerById(
  swimmerId: string,
  organizationId: string,
) {
  const [row] = await db
    .select({
      membershipId: teamSwimmerMemberships.id,
      swimmerId: swimmers.id,
      firstName: swimmers.firstName,
      middleName: swimmers.middleName,
      lastName: swimmers.lastName,
      preferredName: swimmers.preferredName,
      dateOfBirth: swimmers.dateOfBirth,
      gender: swimmers.gender,
      email: swimmers.email,
      phone: swimmers.phone,
      governingBody: swimmers.governingBody,
      governingBodyId: swimmers.governingBodyId,
      practiceGroup: teamSwimmerMemberships.practiceGroup,
      trainingGroups: teamSwimmerMemberships.trainingGroups,
      groupId: teamSwimmerMemberships.groupId,
      groupName: trainingGroups.name,
      classYear: teamSwimmerMemberships.classYear,
      status: teamSwimmerMemberships.status,
    })
    .from(teamSwimmerMemberships)
    .innerJoin(swimmers, eq(teamSwimmerMemberships.swimmerId, swimmers.id))
    .leftJoin(
      trainingGroups,
      eq(teamSwimmerMemberships.groupId, trainingGroups.id),
    )
    .where(
      and(
        eq(swimmers.id, swimmerId),
        eq(teamSwimmerMemberships.organizationId, organizationId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function getSwimmerContactsForMembership(
  membershipId: string,
  organizationId: string,
) {
  const [row] = await db
    .select({
      membershipId: swimmerContacts.membershipId,
      parentName: swimmerContacts.parentName,
      parentEmail: swimmerContacts.parentEmail,
      parentPhone: swimmerContacts.parentPhone,
      emergencyName: swimmerContacts.emergencyName,
      emergencyPhone: swimmerContacts.emergencyPhone,
      addressLine1: swimmerContacts.addressLine1,
      addressLine2: swimmerContacts.addressLine2,
      city: swimmerContacts.city,
      state: swimmerContacts.state,
      postalCode: swimmerContacts.postalCode,
      country: swimmerContacts.country,
      minorDirectContactConsent: swimmerContacts.minorDirectContactConsent,
    })
    .from(swimmerContacts)
    .innerJoin(
      teamSwimmerMemberships,
      eq(swimmerContacts.membershipId, teamSwimmerMemberships.id),
    )
    .where(
      and(
        eq(swimmerContacts.membershipId, membershipId),
        eq(teamSwimmerMemberships.organizationId, organizationId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function getSwimmerMedicalForMembership(
  membershipId: string,
  organizationId: string,
) {
  const [row] = await db
    .select({
      membershipId: swimmerMedical.membershipId,
      allergies: swimmerMedical.allergies,
      medications: swimmerMedical.medications,
      conditions: swimmerMedical.conditions,
      notes: swimmerMedical.notes,
    })
    .from(swimmerMedical)
    .innerJoin(
      teamSwimmerMemberships,
      eq(swimmerMedical.membershipId, teamSwimmerMemberships.id),
    )
    .where(
      and(
        eq(swimmerMedical.membershipId, membershipId),
        eq(teamSwimmerMemberships.organizationId, organizationId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function getSwimmerAffiliations(
  swimmerId: string,
  viewerUserId: string,
) {
  const rows = await db
    .select({
      organizationId: organization.id,
      name: organization.name,
      metadata: organization.metadata,
      status: teamSwimmerMemberships.status,
      practiceGroup: teamSwimmerMemberships.practiceGroup,
      role: member.role,
    })
    .from(teamSwimmerMemberships)
    .innerJoin(
      organization,
      eq(teamSwimmerMemberships.organizationId, organization.id),
    )
    .innerJoin(
      member,
      and(
        eq(member.organizationId, organization.id),
        eq(member.userId, viewerUserId),
      ),
    )
    .where(eq(teamSwimmerMemberships.swimmerId, swimmerId));

  return rows.map((row) => {
    const metadata = row.metadata ? JSON.parse(row.metadata) : {};
    return {
      organizationId: row.organizationId,
      name: row.name,
      teamType: (metadata.teamType as string) ?? "club",
      status: row.status,
      practiceGroup: row.practiceGroup,
    };
  });
}

export async function getClubRegistrationForMembership(
  membershipId: string,
  organizationId: string,
) {
  const [row] = await db
    .select({
      id: swimmerClubRegistrations.id,
      usaMemberId: swimmerClubRegistrations.usaMemberId,
      clubId: swimmerClubRegistrations.clubId,
      registrationStatus: swimmerClubRegistrations.registrationStatus,
      lastSyncedAt: swimmerClubRegistrations.lastSyncedAt,
    })
    .from(swimmerClubRegistrations)
    .innerJoin(
      teamSwimmerMemberships,
      eq(swimmerClubRegistrations.membershipId, teamSwimmerMemberships.id),
    )
    .where(
      and(
        eq(swimmerClubRegistrations.membershipId, membershipId),
        eq(teamSwimmerMemberships.organizationId, organizationId),
      ),
    )
    .limit(1);

  return row ?? null;
}

async function createMembershipForTeam(
  organizationId: string,
  swimmerId: string,
  data: RosterRow,
) {
  const membershipId = generateId();
  const governingBodyId = resolveGoverningBodyId(data);

  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: teamSwimmerMemberships.id })
      .from(teamSwimmerMemberships)
      .where(
        and(
          eq(teamSwimmerMemberships.organizationId, organizationId),
          eq(teamSwimmerMemberships.swimmerId, swimmerId),
        ),
      )
      .limit(1);

    if (existing) {
      throw new Error("Swimmer is already on this team");
    }

    await tx.insert(teamSwimmerMemberships).values({
      id: membershipId,
      organizationId,
      swimmerId,
      practiceGroup: data.practiceGroup ?? null,
      trainingGroups: data.trainingGroups ?? [],
      classYear: resolveClassYear(data),
      status: "active",
    });

    if (governingBodyId) {
      await tx.insert(swimmerClubRegistrations).values({
        id: generateId(),
        membershipId,
        usaMemberId: governingBodyId,
      });
    }

    await upsertMembershipContacts(tx, membershipId, data.contacts);
    await upsertMembershipMedical(tx, membershipId, data.medical);
  });

  return { swimmerId, membershipId };
}

export async function addExistingSwimmerToTeam(
  swimmerId: string,
  organizationId: string,
  data: RosterRow,
) {
  const [swimmer] = await db
    .select({ id: swimmers.id })
    .from(swimmers)
    .where(eq(swimmers.id, swimmerId))
    .limit(1);

  if (!swimmer) {
    throw new Error("Swimmer not found");
  }

  return createMembershipForTeam(organizationId, swimmerId, data);
}

export async function addSwimmer(organizationId: string, data: RosterRow) {
  const governingBodyId = resolveGoverningBodyId(data);

  if (data.linkExistingSwimmerId) {
    return addExistingSwimmerToTeam(
      data.linkExistingSwimmerId,
      organizationId,
      data,
    );
  }

  if (governingBodyId) {
    const existing = await findSwimmerByGoverningBodyId(governingBodyId);
    if (existing) {
      return createMembershipForTeam(organizationId, existing.id, data);
    }
  }

  const swimmerId = generateId();
  const membershipId = generateId();

  await db.transaction(async (tx) => {
    await tx.insert(swimmers).values({
      id: swimmerId,
      firstName: data.firstName,
      middleName: data.middleName ?? null,
      lastName: data.lastName,
      preferredName: data.preferredName ?? null,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      email: data.email || null,
      phone: data.phone ?? null,
      governingBody: governingBodyId ? "usa_swimming" : null,
      governingBodyId: governingBodyId ?? null,
    });

    await tx.insert(teamSwimmerMemberships).values({
      id: membershipId,
      organizationId,
      swimmerId,
      practiceGroup: data.practiceGroup ?? null,
      trainingGroups: data.trainingGroups ?? [],
      classYear: resolveClassYear(data),
      status: "active",
    });

    if (governingBodyId) {
      await tx.insert(swimmerClubRegistrations).values({
        id: generateId(),
        membershipId,
        usaMemberId: governingBodyId,
      });
    }

    await upsertMembershipContacts(tx, membershipId, data.contacts);
    await upsertMembershipMedical(tx, membershipId, data.medical);
  });

  return { swimmerId, membershipId };
}

export async function updateSwimmer(
  swimmerId: string,
  organizationId: string,
  data: Partial<RosterRow>,
) {
  const membership = await getSwimmerById(swimmerId, organizationId);
  if (!membership) return null;

  await db.transaction(async (tx) => {
    if (
      data.firstName ||
      data.lastName ||
      data.middleName !== undefined ||
      data.preferredName !== undefined ||
      data.dateOfBirth ||
      data.gender ||
      data.email !== undefined ||
      data.phone !== undefined
    ) {
      await tx
        .update(swimmers)
        .set({
          ...(data.firstName && { firstName: data.firstName }),
          ...(data.middleName !== undefined && {
            middleName: data.middleName ?? null,
          }),
          ...(data.preferredName !== undefined && {
            preferredName: data.preferredName ?? null,
          }),
          ...(data.lastName && { lastName: data.lastName }),
          ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
          ...(data.gender && { gender: data.gender }),
          ...(data.email !== undefined && { email: data.email || null }),
          ...(data.phone !== undefined && { phone: data.phone ?? null }),
          updatedAt: new Date(),
        })
        .where(eq(swimmers.id, swimmerId));
    }

    if (
      data.practiceGroup !== undefined ||
      data.trainingGroups !== undefined ||
      data.classYear !== undefined
    ) {
      await tx
        .update(teamSwimmerMemberships)
        .set({
          ...(data.practiceGroup !== undefined && {
            practiceGroup: data.practiceGroup,
          }),
          ...(data.trainingGroups !== undefined && {
            trainingGroups: data.trainingGroups,
          }),
          ...(data.classYear !== undefined && {
            classYear: parseClassYear(data.classYear),
          }),
          updatedAt: new Date(),
        })
        .where(eq(teamSwimmerMemberships.id, membership.membershipId));
    }

    if (data.contacts) {
      await upsertMembershipContacts(
        tx,
        membership.membershipId,
        data.contacts,
      );
    }

    if (data.medical) {
      await upsertMembershipMedical(tx, membership.membershipId, data.medical);
    }
  });

  return getSwimmerById(swimmerId, organizationId);
}

export async function removeSwimmerFromTeam(
  swimmerId: string,
  organizationId: string,
) {
  const membership = await getSwimmerById(swimmerId, organizationId);
  if (!membership) return false;

  await db
    .update(teamSwimmerMemberships)
    .set({ status: "inactive", leftAt: new Date(), updatedAt: new Date() })
    .where(eq(teamSwimmerMemberships.id, membership.membershipId));

  return true;
}

export async function getRosterStats(organizationId: string) {
  const roster = await getRoster(organizationId);
  return {
    totalSwimmers: roster.length,
    minorSwimmers: roster.filter((r) => isMinorSwimmer(r.dateOfBirth)).length,
    practiceGroups: [
      ...new Set(roster.map((r) => r.practiceGroup).filter(Boolean)),
    ].length,
  };
}

export async function searchSwimmerByUsaId(usaMemberId: string) {
  const [row] = await db
    .select({
      id: swimmers.id,
      firstName: swimmers.firstName,
      lastName: swimmers.lastName,
      dateOfBirth: swimmers.dateOfBirth,
      governingBodyId: swimmers.governingBodyId,
    })
    .from(swimmers)
    .where(eq(swimmers.governingBodyId, usaMemberId))
    .limit(1);

  return row ?? null;
}

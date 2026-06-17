import { isMinorSwimmer } from "@project-aqua/swim-core/age";
import { and, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { db } from "./client.js";
import {
  auditLog,
  member,
  staffCredentials,
  swimmers,
  teamSwimmerMemberships,
} from "./schema/index.js";

export const COACH_ROLES = [
  "owner",
  "head_coach",
  "assistant_coach",
  "admin",
  "member",
] as const;

export const EXPORT_ROLES = ["owner", "head_coach"] as const;

export type CoachRole = (typeof COACH_ROLES)[number];

const SAFESPORT_TYPES = [
  "safesport_core",
  "safesport_refresher_1",
  "safesport_refresher_2",
  "safesport_refresher_3",
] as const;

export class AuthError extends Error {
  constructor(
    message: string,
    public status = 401,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function getMember(userId: string, organizationId: string) {
  const [row] = await db
    .select()
    .from(member)
    .where(
      and(eq(member.userId, userId), eq(member.organizationId, organizationId)),
    )
    .limit(1);
  return row ?? null;
}

export async function requireTeamMember(
  userId: string | undefined,
  organizationId: string,
) {
  if (!userId) throw new AuthError("Unauthorized");
  const m = await getMember(userId, organizationId);
  if (!m) throw new AuthError("Not a member of this team", 403);
  return m;
}

export async function requireTeamRole(
  userId: string | undefined,
  organizationId: string,
  roles: CoachRole[],
) {
  const m = await requireTeamMember(userId, organizationId);
  if (!roles.includes(m.role as CoachRole)) {
    throw new AuthError("Insufficient permissions", 403);
  }
  return m;
}

export async function getUserTeams(userId: string) {
  const { organization } = await import("./schema/index.js");
  return db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      role: member.role,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(eq(member.userId, userId));
}

export async function getSwimmerMembership(
  swimmerId: string,
  organizationId: string,
) {
  const [row] = await db
    .select({
      membershipId: teamSwimmerMemberships.id,
      swimmerId: teamSwimmerMemberships.swimmerId,
      status: teamSwimmerMemberships.status,
      dateOfBirth: swimmers.dateOfBirth,
    })
    .from(teamSwimmerMemberships)
    .innerJoin(swimmers, eq(teamSwimmerMemberships.swimmerId, swimmers.id))
    .where(
      and(
        eq(teamSwimmerMemberships.swimmerId, swimmerId),
        eq(teamSwimmerMemberships.organizationId, organizationId),
        eq(teamSwimmerMemberships.status, "active"),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function requireSwimmerTeamAccess(
  userId: string | undefined,
  swimmerId: string,
  organizationId: string,
) {
  await requireTeamMember(userId, organizationId);
  const membership = await getSwimmerMembership(swimmerId, organizationId);
  if (!membership) {
    throw new AuthError("Swimmer is not on this team", 404);
  }
  return membership;
}

export async function hasCurrentSafeSportTraining(memberId: string) {
  const now = new Date();
  const [row] = await db
    .select({ id: staffCredentials.id })
    .from(staffCredentials)
    .where(
      and(
        eq(staffCredentials.memberId, memberId),
        inArray(staffCredentials.credentialType, [...SAFESPORT_TYPES]),
        eq(staffCredentials.status, "current"),
        or(
          isNull(staffCredentials.expiresAt),
          gt(staffCredentials.expiresAt, now),
        ),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export async function requireCoachSafeSportCurrent(
  userId: string | undefined,
  organizationId: string,
) {
  const m = await requireTeamMember(userId, organizationId);
  const current = await hasCurrentSafeSportTraining(m.id);
  if (!current) {
    throw new AuthError(
      "SafeSport training required. Complete training at safesporttrained.org before accessing minor athlete data.",
      403,
    );
  }
  return m;
}

export async function writeAuditLog(data: {
  organizationId: string;
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  await db.insert(auditLog).values({
    id: crypto.randomUUID(),
    organizationId: data.organizationId,
    actorUserId: data.actorUserId,
    action: data.action,
    resourceType: data.resourceType,
    resourceId: data.resourceId,
    metadata: data.metadata ?? null,
    ipAddress: data.ipAddress ?? null,
  });
}

export async function requireMinorPiiAccess(
  userId: string | undefined,
  organizationId: string,
  membershipId: string,
  options?: { ipAddress?: string },
) {
  const m = await requireCoachSafeSportCurrent(userId, organizationId);

  const [membership] = await db
    .select({
      membershipId: teamSwimmerMemberships.id,
      dateOfBirth: swimmers.dateOfBirth,
    })
    .from(teamSwimmerMemberships)
    .innerJoin(swimmers, eq(teamSwimmerMemberships.swimmerId, swimmers.id))
    .where(
      and(
        eq(teamSwimmerMemberships.id, membershipId),
        eq(teamSwimmerMemberships.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new AuthError("Membership not found", 404);
  }

  if (isMinorSwimmer(membership.dateOfBirth) && userId) {
    await writeAuditLog({
      organizationId,
      actorUserId: userId,
      action: "roster.pii.read",
      resourceType: "team_swimmer_membership",
      resourceId: membershipId,
      ipAddress: options?.ipAddress,
    });
  }

  return { member: m, membership };
}

export async function canExportRoster(
  userId: string | undefined,
  organizationId: string,
) {
  const m = await requireTeamRole(userId, organizationId, [...EXPORT_ROLES]);
  await requireCoachSafeSportCurrent(userId, organizationId);
  return m;
}

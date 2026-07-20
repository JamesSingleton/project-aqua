import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { invitation, member, user } from "../schema/auth";

export async function getTeamMembers(organizationId: string) {
  return db
    .select({
      memberId: member.id,
      userId: member.userId,
      role: member.role,
      title: member.title,
      createdAt: member.createdAt,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, organizationId));
}

export async function getTeamInvitations(organizationId: string) {
  return db
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      inviterId: invitation.inviterId,
    })
    .from(invitation)
    .where(
      and(
        eq(invitation.organizationId, organizationId),
        eq(invitation.status, "pending"),
      ),
    );
}

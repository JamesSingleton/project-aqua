import { db } from "@project-aqua/db/client";
import { createDefaultSubscription } from "@project-aqua/db/queries/billing";
import * as schema from "@project-aqua/db/schema";
import {
  sendCoachInvitation,
  sendCoachWelcome,
  sendInvitationAccepted,
  sendMemberJoined,
  sendRemovedFromTeam,
  sendResetPassword,
  sendRoleChanged,
  sendTeamWelcome,
  sendVerifyEmail,
} from "@project-aqua/emails";
import type { PlanTier } from "@project-aqua/swim-core/plans";
import { getPlanLimits } from "@project-aqua/swim-core/plans";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

function getOrgPlan(metadata: string | null): PlanTier {
  if (!metadata) return "free";
  try {
    const parsed = JSON.parse(metadata) as { plan?: PlanTier };
    return parsed.plan ?? "free";
  } catch {
    return "free";
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      organization: schema.organization,
      member: schema.member,
      invitation: schema.invitation,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPassword({ user, url });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerifyEmail({ user, url });
    },
  },
  databaseHooks: {
    user: {
      afterCreate: async ({ user }) => {
        await sendCoachWelcome({
          to: user.email,
          props: { name: user.name },
        });
      },
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      creatorRole: "owner",
      membershipLimit: async (_user, org) => {
        const plan = getOrgPlan(org?.metadata ?? null);
        return getPlanLimits(plan).maxCoaches as number;
      },
      sendInvitationEmail: async (data) => {
        await sendCoachInvitation({
          email: data.email,
          organization: data.organization,
          inviter: data.inviter,
          invitation: data.invitation,
          role: data.role ?? "assistant_coach",
        });
      },
      schema: {
        member: {
          additionalFields: {
            title: { type: "string", required: false },
          },
        },
      },
      hooks: {
        organization: {
          afterCreate: async ({ organization, user }) => {
            await createDefaultSubscription(organization.id);
            await sendTeamWelcome({
              to: user.email,
              props: {
                teamName: organization.name,
                teamId: organization.id,
                name: user.name,
              },
            });
          },
        },
        invitation: {
          afterAccept: async ({ invitation, user, organization, inviter }) => {
            if (inviter?.user?.email) {
              await sendInvitationAccepted(
                inviter.user.email,
                user.name,
                organization.name,
              );
            }
          },
        },
        member: {
          afterCreate: async ({ member, user, organization }) => {
            if (member.role === "owner") return;
            const { eq: eqOp } = await import("drizzle-orm");
            const owners = await db
              .select({ email: schema.user.email })
              .from(schema.member)
              .innerJoin(
                schema.user,
                eqOp(schema.member.userId, schema.user.id),
              )
              .where(eqOp(schema.member.organizationId, organization.id));
            for (const owner of owners.filter((o) => o.email !== user.email)) {
              await sendMemberJoined(owner.email, user.name, organization.name);
            }
          },
          afterUpdate: async ({ member, user, organization }) => {
            await sendRoleChanged(
              user.email,
              user.name,
              organization.name,
              member.role,
            );
          },
          afterDelete: async ({ member, user, organization }) => {
            await sendRemovedFromTeam(user.email, user.name, organization.name);
          },
        },
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;

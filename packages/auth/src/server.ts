import {
  checkout,
  polar,
  portal,
  usage,
  webhooks,
} from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { db } from "@project-aqua/db/client";
import {
  createDefaultSubscription,
  updateSubscription,
} from "@project-aqua/db/queries/billing";
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
import { organization, twoFactor } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { orgAc, orgRoles } from "./organization-ac";

function getOrgPlan(metadata: string | null): PlanTier {
  if (!metadata) return "free";
  try {
    const parsed = JSON.parse(metadata) as { plan?: PlanTier };
    return parsed.plan ?? "free";
  } catch {
    return "free";
  }
}

function asPlan(value: unknown): PlanTier | null {
  if (value === "pro" || value === "enterprise" || value === "free") {
    return value;
  }
  return null;
}

const polarAccessToken = process.env.POLAR_ACCESS_TOKEN?.trim() ?? "";
const polarConfigured = polarAccessToken.length > 0;

const polarProducts = [
  process.env.POLAR_PRODUCT_PRO
    ? { productId: process.env.POLAR_PRODUCT_PRO, slug: "pro" as const }
    : null,
  process.env.POLAR_PRODUCT_ENTERPRISE
    ? {
        productId: process.env.POLAR_PRODUCT_ENTERPRISE,
        slug: "enterprise" as const,
      }
    : null,
].filter(Boolean) as Array<{ productId: string; slug: "pro" | "enterprise" }>;

async function syncOrgPlanFromPolar(input: {
  organizationId?: string;
  plan?: PlanTier;
  status?: "active" | "canceled" | "past_due" | "trialing";
  polarCustomerId?: string;
  polarSubscriptionId?: string;
}) {
  if (!input.organizationId) return;
  if (input.plan) {
    await updateSubscription(input.organizationId, {
      plan: input.plan,
      status: input.status ?? "active",
      polarCustomerId: input.polarCustomerId,
      polarSubscriptionId: input.polarSubscriptionId,
    });
    await db
      .update(schema.organization)
      .set({ metadata: JSON.stringify({ plan: input.plan }) })
      .where(eq(schema.organization.id, input.organizationId));
  } else if (input.status) {
    await updateSubscription(input.organizationId, {
      status: input.status,
      polarCustomerId: input.polarCustomerId,
      polarSubscriptionId: input.polarSubscriptionId,
    });
  }
}

const globalForAuth = globalThis as unknown as {
  polarClient: Polar | undefined;
  auth: ReturnType<typeof createAuth> | undefined;
};

function createPolarClient() {
  return new Polar({
    accessToken: polarAccessToken,
    server:
      process.env.POLAR_SERVER === "production" ? "production" : "sandbox",
  });
}

function createAuth(polarClient: Polar) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
        twoFactor: schema.twoFactor,
        organization: schema.organization,
        member: schema.member,
        invitation: schema.invitation,
      },
    }),
    appName: "Project Aqua",
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
    socialProviders: {
      ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              accessType: "offline" as const,
              prompt: "select_account consent" as const,
              scope: ["openid", "email", "profile"],
            },
          }
        : {}),
      ...(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
        ? {
            microsoft: {
              clientId: process.env.MICROSOFT_CLIENT_ID,
              clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
              tenantId: process.env.MICROSOFT_TENANT_ID ?? "common",
              scope: ["openid", "email", "profile", "offline_access"],
            },
          }
        : {}),
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await sendCoachWelcome({
              to: user.email,
              props: { name: user.name },
            });
          },
        },
      },
    },
    plugins: [
      twoFactor({
        issuer: "Project Aqua",
      }),
      organization({
        ac: orgAc,
        roles: orgRoles,
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
        organizationHooks: {
          afterCreateOrganization: async ({ organization, user }) => {
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
          afterAcceptInvitation: async ({ invitation, user, organization }) => {
            if (!invitation.inviterId) return;
            const [inviter] = await db
              .select({ email: schema.user.email })
              .from(schema.user)
              .where(eq(schema.user.id, invitation.inviterId))
              .limit(1);
            if (inviter?.email) {
              await sendInvitationAccepted(
                inviter.email,
                user.name,
                organization.name,
              );
            }
          },
          afterAddMember: async ({ member, user, organization }) => {
            if (member.role === "owner") return;
            const owners = await db
              .select({ email: schema.user.email })
              .from(schema.member)
              .innerJoin(schema.user, eq(schema.member.userId, schema.user.id))
              .where(eq(schema.member.organizationId, organization.id));
            for (const owner of owners.filter((o) => o.email !== user.email)) {
              await sendMemberJoined(owner.email, user.name, organization.name);
            }
          },
          afterUpdateMemberRole: async ({ member, user, organization }) => {
            await sendRoleChanged(
              user.email,
              user.name,
              organization.name,
              member.role,
            );
          },
          afterRemoveMember: async ({ user, organization }) => {
            await sendRemovedFromTeam(user.email, user.name, organization.name);
          },
        },
      }),
      polar({
        client: polarClient,
        // Requires a valid POLAR_ACCESS_TOKEN; otherwise signup fails with 401.
        createCustomerOnSignUp: polarConfigured,
        use: [
          checkout({
            products: polarProducts,
            successUrl: "/onboarding?checkout=success",
            authenticatedUsersOnly: true,
          }),
          portal(),
          usage(),
          webhooks({
            secret: process.env.POLAR_WEBHOOK_SECRET ?? "",
            onOrderPaid: async (payload) => {
              const data = payload.data as Record<string, unknown>;
              const metadata = (data.metadata ?? {}) as Record<string, string>;
              const organizationId =
                metadata.organizationId ??
                metadata.referenceId ??
                (data.externalCustomerId as string | undefined);
              const plan =
                asPlan(metadata.plan) ??
                (metadata.slug === "enterprise" ? "enterprise" : "pro");
              await syncOrgPlanFromPolar({
                organizationId,
                plan,
                status: "active",
                polarCustomerId: data.customerId as string | undefined,
                polarSubscriptionId: data.id as string | undefined,
              });
            },
            onSubscriptionActive: async (payload) => {
              const data = payload.data as Record<string, unknown>;
              const metadata = (data.metadata ?? {}) as Record<string, string>;
              const organizationId =
                metadata.organizationId ??
                metadata.referenceId ??
                (data.externalCustomerId as string | undefined);
              await syncOrgPlanFromPolar({
                organizationId,
                plan: asPlan(metadata.plan) ?? "pro",
                status: "active",
                polarCustomerId: data.customerId as string | undefined,
                polarSubscriptionId: data.id as string | undefined,
              });
            },
            onSubscriptionCanceled: async (payload) => {
              const data = payload.data as Record<string, unknown>;
              const metadata = (data.metadata ?? {}) as Record<string, string>;
              const organizationId =
                metadata.organizationId ??
                metadata.referenceId ??
                (data.externalCustomerId as string | undefined);
              await syncOrgPlanFromPolar({
                organizationId,
                plan: "free",
                status: "canceled",
              });
            },
          }),
        ],
      }),
    ],
  });
}

const polarClient = globalForAuth.polarClient ?? createPolarClient();
export const auth = globalForAuth.auth ?? createAuth(polarClient);

if (process.env.NODE_ENV !== "production") {
  globalForAuth.polarClient = polarClient;
  globalForAuth.auth = auth;
}

export type Session = typeof auth.$Infer.Session;

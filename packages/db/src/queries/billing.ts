import type { PlanTier } from "@project-aqua/swim-core/plans";
import { eq } from "drizzle-orm";
import { db } from "../client";
import { subscriptions } from "../schema/index";

function generateId(): string {
  return crypto.randomUUID();
}

export async function getTeamSubscription(organizationId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, organizationId))
    .limit(1);
  return sub ?? null;
}

export async function getTeamPlan(organizationId: string): Promise<PlanTier> {
  const sub = await getTeamSubscription(organizationId);
  return (sub?.plan as PlanTier) ?? "free";
}

export async function createDefaultSubscription(organizationId: string) {
  const existing = await getTeamSubscription(organizationId);
  if (existing) return existing;

  const id = generateId();
  await db.insert(subscriptions).values({
    id,
    organizationId,
    plan: "free",
    status: "active",
  });

  return getTeamSubscription(organizationId);
}

export async function updateSubscription(
  organizationId: string,
  data: {
    plan?: PlanTier;
    status?: "active" | "canceled" | "past_due" | "trialing";
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    polarCustomerId?: string;
    polarSubscriptionId?: string;
    currentPeriodEnd?: Date;
  },
) {
  await db
    .update(subscriptions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(subscriptions.organizationId, organizationId));
}

export async function getOwnerEmail(
  organizationId: string,
): Promise<string | null> {
  const { member, user } = await import("../schema/index");
  const { and } = await import("drizzle-orm");
  const rows = await db
    .select({ email: user.email })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(
      and(eq(member.organizationId, organizationId), eq(member.role, "owner")),
    )
    .limit(1);

  return rows[0]?.email ?? null;
}

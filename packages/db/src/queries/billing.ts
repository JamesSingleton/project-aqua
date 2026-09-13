import type { PlanTier } from "@project-aqua/swim-core/plans";
import { eq, inArray } from "drizzle-orm";
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

export async function getTeamPlans(
  organizationIds: readonly string[],
): Promise<ReadonlyMap<string, PlanTier>> {
  const uniqueIds = [...new Set(organizationIds)];
  const plans = new Map<string, PlanTier>(
    uniqueIds.map((id) => [id, "free"] as const),
  );
  if (uniqueIds.length === 0) {
    return plans;
  }

  const rows = await db
    .select({
      organizationId: subscriptions.organizationId,
      plan: subscriptions.plan,
    })
    .from(subscriptions)
    .where(inArray(subscriptions.organizationId, uniqueIds));

  for (const row of rows) {
    plans.set(row.organizationId, row.plan as PlanTier);
  }

  return plans;
}

export async function getTeamPlan(organizationId: string): Promise<PlanTier> {
  const plans = await getTeamPlans([organizationId]);
  return plans.get(organizationId) ?? "free";
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

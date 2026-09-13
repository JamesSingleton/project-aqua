import {
  getOwnerEmail,
  getTeamPlan,
  updateSubscription,
} from "@project-aqua/db/queries/billing";
import {
  getPlanLimits,
  type PlanFeature,
  type PlanTier,
  planHasFeature,
} from "@project-aqua/swim-core/plans";

export type { PlanFeature, PlanTier } from "@project-aqua/swim-core/plans";
export {
  getPlanLimits,
  PLAN_LIMITS,
  planHasFeature,
} from "@project-aqua/swim-core/plans";

export async function assertFeature(
  organizationId: string,
  feature: PlanFeature,
): Promise<void> {
  const plan = await getTeamPlan(organizationId);
  if (!planHasFeature(plan, feature)) {
    throw new Error(`Feature "${feature}" not available on ${plan} plan`);
  }
}

export async function getTeamPlanLimits(organizationId: string) {
  const plan = await getTeamPlan(organizationId);
  return getPlanLimits(plan);
}

export async function canAddSwimmer(organizationId: string): Promise<boolean> {
  const limits = await getTeamPlanLimits(organizationId);
  if (limits.maxSwimmers === Number.POSITIVE_INFINITY) return true;
  const { getRosterStats } = await import("@project-aqua/db/queries/roster");
  const stats = await getRosterStats(organizationId);
  return stats.totalSwimmers < (limits.maxSwimmers as number);
}

export { getOwnerEmail, getTeamPlan, updateSubscription };

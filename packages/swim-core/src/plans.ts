export const PLAN_TIERS = ["free", "pro", "enterprise"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const PLAN_LIMITS = {
  free: {
    maxSwimmers: 25,
    maxCoaches: 1,
    meetImport: true,
    progression: true,
    swimsSync: false,
    aiGenerationsIncluded: 5,
    aiOverageAllowed: false,
  },
  pro: {
    maxSwimmers: 150,
    maxCoaches: 5,
    meetImport: true,
    progression: true,
    swimsSync: false,
    aiGenerationsIncluded: 20,
    aiOverageAllowed: true,
  },
  enterprise: {
    maxSwimmers: Number.POSITIVE_INFINITY,
    maxCoaches: Number.POSITIVE_INFINITY,
    meetImport: true,
    progression: true,
    swimsSync: true,
    aiGenerationsIncluded: 100,
    aiOverageAllowed: true,
  },
} as const satisfies Record<PlanTier, Record<string, boolean | number>>;

export type PlanFeature = "meet_import" | "progression" | "swims_sync";

export function planHasFeature(plan: PlanTier, feature: PlanFeature): boolean {
  switch (feature) {
    case "meet_import":
      return PLAN_LIMITS[plan].meetImport;
    case "progression":
      return PLAN_LIMITS[plan].progression;
    case "swims_sync":
      return PLAN_LIMITS[plan].swimsSync;
    default:
      return false;
  }
}

export function getPlanLimits(plan: PlanTier) {
  return PLAN_LIMITS[plan];
}

export function getAiQuotaRemaining(
  plan: PlanTier,
  usedThisMonth: number,
): number {
  const included = PLAN_LIMITS[plan].aiGenerationsIncluded;
  return Math.max(0, included - usedThisMonth);
}

export function canUseAiGeneration(
  plan: PlanTier,
  usedThisMonth: number,
): { allowed: boolean; remaining: number; reason?: string } {
  const limits = PLAN_LIMITS[plan];
  const remaining = getAiQuotaRemaining(plan, usedThisMonth);
  if (remaining > 0) {
    return { allowed: true, remaining };
  }
  if (limits.aiOverageAllowed) {
    return { allowed: true, remaining: 0 };
  }
  return {
    allowed: false,
    remaining: 0,
    reason:
      "Free plan AI generations are used up for this month. Upgrade to continue.",
  };
}

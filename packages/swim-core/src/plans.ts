export const PLAN_TIERS = ["free", "pro", "enterprise"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const PLAN_LIMITS = {
  free: {
    maxSwimmers: 25,
    maxCoaches: 1,
    meetImport: false,
    progression: false,
    swimsSync: false,
    hy3Import: false,
  },
  pro: {
    maxSwimmers: 150,
    maxCoaches: 5,
    meetImport: true,
    progression: true,
    swimsSync: false,
    hy3Import: false,
  },
  enterprise: {
    maxSwimmers: Number.POSITIVE_INFINITY,
    maxCoaches: Number.POSITIVE_INFINITY,
    meetImport: true,
    progression: true,
    swimsSync: true,
    hy3Import: true,
  },
} as const satisfies Record<PlanTier, Record<string, boolean | number>>;

export type PlanFeature =
  | "meet_import"
  | "progression"
  | "swims_sync"
  | "hy3_import";

export function planHasFeature(plan: PlanTier, feature: PlanFeature): boolean {
  switch (feature) {
    case "meet_import":
      return PLAN_LIMITS[plan].meetImport;
    case "progression":
      return PLAN_LIMITS[plan].progression;
    case "swims_sync":
      return PLAN_LIMITS[plan].swimsSync;
    case "hy3_import":
      return PLAN_LIMITS[plan].hy3Import;
    default:
      return false;
  }
}

export function getPlanLimits(plan: PlanTier) {
  return PLAN_LIMITS[plan];
}

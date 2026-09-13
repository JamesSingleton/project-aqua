export type SharedDraftQuota = {
  remaining: number;
  included: number;
  used: number;
  allowed: boolean;
  overageAllowed: boolean;
};

export type DraftQuotaSurface = "relay" | "workout";

const SURFACE_LABEL: Record<DraftQuotaSurface, string> = {
  relay: "relay suggestion",
  workout: "workout draft",
};

const SURFACE_LABEL_PLURAL: Record<DraftQuotaSurface, string> = {
  relay: "relay suggestions",
  workout: "workout drafts",
};

const SHARED_WITH: Record<DraftQuotaSurface, string> = {
  relay: "workout drafts",
  workout: "relay suggestions",
};

export function canUseSharedDraftQuota(quota: SharedDraftQuota): boolean {
  return quota.allowed || quota.overageAllowed;
}

export function formatSharedDraftQuotaHint(
  surface: DraftQuotaSurface,
  quota: SharedDraftQuota,
): string | null {
  if (quota.included === Number.POSITIVE_INFINITY) {
    return null;
  }

  if (quota.remaining > 0) {
    const label =
      quota.remaining === 1
        ? SURFACE_LABEL[surface]
        : SURFACE_LABEL_PLURAL[surface];
    return `${quota.remaining} ${label} left this month (shared with ${SHARED_WITH[surface]}).`;
  }

  if (quota.overageAllowed) {
    return null;
  }

  if (!quota.allowed) {
    return `No ${SURFACE_LABEL_PLURAL[surface]} left this month. Upgrade to Pro for more.`;
  }

  return null;
}

export function sharedDraftQuotaExhaustedMessage(): string {
  return "No relay suggestions or workout drafts left this month. Upgrade to Pro for more.";
}

import type { SharedDraftQuota } from "@lane4hq/swim-core/draft-quota";
import {
  canUseSharedDraftQuota,
  type DraftQuotaSurface,
  formatSharedDraftQuotaHint,
} from "@lane4hq/swim-core/draft-quota";

export function DraftQuotaHint({
  surface,
  quota,
}: {
  surface: DraftQuotaSurface;
  quota: SharedDraftQuota;
}) {
  const hint = formatSharedDraftQuotaHint(surface, quota);
  if (!hint) return null;
  return <p className="text-muted-foreground text-xs">{hint}</p>;
}

export function isDraftQuotaBlocked(quota: SharedDraftQuota): boolean {
  return !canUseSharedDraftQuota(quota);
}

export type { DraftQuotaSurface, SharedDraftQuota };

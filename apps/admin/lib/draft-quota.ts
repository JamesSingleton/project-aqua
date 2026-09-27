import type { SharedDraftQuota } from "@lane4hq/swim-core/draft-quota";

export function toSharedDraftQuota(input: {
  remaining: number;
  included: number;
  used: number;
  allowed: boolean;
  overageAllowed: boolean;
}): SharedDraftQuota {
  return {
    remaining: input.remaining,
    included: input.included,
    used: input.used,
    allowed: input.allowed,
    overageAllowed: input.overageAllowed,
  };
}

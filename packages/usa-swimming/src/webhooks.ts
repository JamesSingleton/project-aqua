import { syncMemberFromSwims } from "./sync";
import type { SwimsWebhookPayload } from "./types";

export function verifySwimsWebhook(
  thumbprint: string | null,
  expectedThumbprint: string,
): boolean {
  if (!thumbprint || !expectedThumbprint) return false;
  return thumbprint === expectedThumbprint;
}

export async function handleSwimsWebhook(
  payload: SwimsWebhookPayload,
  organizationId: string,
): Promise<void> {
  switch (payload.event) {
    case "member.register":
    case "member.renew":
    case "member.transfer_to":
      await syncMemberFromSwims(
        organizationId,
        payload.clubId,
        payload.memberId,
      );
      break;
    case "member.transfer_from":
    case "member.cancel":
      // Mark swimmer inactive if on roster — handled in sync
      await syncMemberFromSwims(
        organizationId,
        payload.clubId,
        payload.memberId,
        {
          inactive: payload.event === "member.cancel",
        },
      );
      break;
  }
}

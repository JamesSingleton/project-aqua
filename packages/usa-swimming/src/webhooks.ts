import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "@lane4hq/db/client";
import { organization, usaSwimmingWebhookDelivery } from "@lane4hq/db/schema";
import { eq } from "drizzle-orm";
import { syncMemberFromSwims } from "./sync";
import type { SwimsWebhookPayload } from "./types";

/** Reject webhooks with explicit timestamps older than this (replay protection). */
export const SWIMS_WEBHOOK_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function verifySwimsWebhook(
  thumbprint: string | null,
  expectedThumbprint: string,
): boolean {
  if (!thumbprint || !expectedThumbprint) return false;
  const received = Buffer.from(thumbprint, "utf8");
  const expected = Buffer.from(expectedThumbprint, "utf8");
  if (received.length !== expected.length) return false;
  return timingSafeEqual(received, expected);
}

export function getSwimsWebhookDeliveryId(
  payload: SwimsWebhookPayload,
): string {
  const explicit =
    payload.deliveryId?.trim() || payload.eventId?.trim() || payload.id?.trim();
  if (explicit) return explicit;
  return createHash("sha256")
    .update(stableWebhookPayloadJson(payload))
    .digest("hex");
}

function stableWebhookPayloadJson(payload: SwimsWebhookPayload): string {
  return JSON.stringify({
    event: payload.event,
    clubId: payload.clubId,
    memberId: payload.memberId,
    recordId: payload.recordId ?? null,
    data: payload.data ?? null,
  });
}

export function getSwimsWebhookTimestampMs(
  payload: SwimsWebhookPayload,
): number | null {
  const raw =
    payload.timestamp ?? payload.occurredAt ?? payload.eventTime ?? null;
  if (raw == null) return null;
  if (typeof raw === "number") {
    return raw < 1e12 ? raw * 1000 : raw;
  }
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

export function isSwimsWebhookStale(
  payload: SwimsWebhookPayload,
  nowMs = Date.now(),
  maxAgeMs = SWIMS_WEBHOOK_MAX_AGE_MS,
): boolean {
  const ts = getSwimsWebhookTimestampMs(payload);
  if (ts == null) return false;
  return nowMs - ts > maxAgeMs;
}

export async function findOrganizationIdsByUsaSwimmingClubId(
  clubId: string,
): Promise<string[]> {
  const rows = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.usaSwimmingClubId, clubId));
  return rows.map((row) => row.id);
}

export type SwimsWebhookProcessResult =
  | { kind: "duplicate" }
  | { kind: "stale" }
  | { kind: "unknown_club"; clubId: string }
  | {
      kind: "processed";
      organizationIds: string[];
      failedOrganizationIds: string[];
    };

async function claimWebhookDelivery(
  deliveryId: string,
  payload: SwimsWebhookPayload,
): Promise<boolean> {
  const inserted = await db
    .insert(usaSwimmingWebhookDelivery)
    .values({
      id: deliveryId,
      event: payload.event,
      clubId: payload.clubId,
    })
    .onConflictDoNothing()
    .returning({ id: usaSwimmingWebhookDelivery.id });
  return inserted.length > 0;
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

export async function processSwimsWebhook(
  payload: SwimsWebhookPayload,
): Promise<SwimsWebhookProcessResult> {
  if (isSwimsWebhookStale(payload)) {
    return { kind: "stale" };
  }

  const deliveryId = getSwimsWebhookDeliveryId(payload);
  const claimed = await claimWebhookDelivery(deliveryId, payload);
  if (!claimed) {
    return { kind: "duplicate" };
  }

  const organizationIds = await findOrganizationIdsByUsaSwimmingClubId(
    payload.clubId,
  );

  if (organizationIds.length === 0) {
    console.warn(
      "SWIMS webhook: no organization linked to clubId",
      payload.clubId,
      deliveryId,
    );
    return { kind: "unknown_club", clubId: payload.clubId };
  }

  const failedOrganizationIds: string[] = [];
  for (const organizationId of organizationIds) {
    try {
      await handleSwimsWebhook(payload, organizationId);
    } catch (error) {
      failedOrganizationIds.push(organizationId);
      console.error(
        "SWIMS webhook org processing error:",
        organizationId,
        error,
      );
    }
  }

  return {
    kind: "processed",
    organizationIds,
    failedOrganizationIds,
  };
}

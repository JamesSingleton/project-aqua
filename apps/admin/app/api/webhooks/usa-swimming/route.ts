import type { SwimsWebhookPayload } from "@lane4hq/usa-swimming";
import {
  processSwimsWebhook,
  verifySwimsWebhook,
} from "@lane4hq/usa-swimming/webhooks";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const headersList = await headers();
  const thumbprint = headersList.get("x-vendor-thumbprint");
  const expected = process.env.USA_SWIMMING_VENDOR_THUMBPRINT ?? "";

  if (!verifySwimsWebhook(thumbprint, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: SwimsWebhookPayload;
  try {
    payload = (await request.json()) as SwimsWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.clubId?.trim()) {
    return NextResponse.json({ error: "Missing clubId" }, { status: 400 });
  }
  if (!payload.memberId?.trim() || !payload.event) {
    return NextResponse.json(
      { error: "Missing event or memberId" },
      { status: 400 },
    );
  }

  try {
    const result = await processSwimsWebhook(payload);

    if (result.kind === "duplicate") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    if (result.kind === "stale") {
      return NextResponse.json({ error: "Stale webhook" }, { status: 400 });
    }
    if (result.kind === "unknown_club") {
      return NextResponse.json({
        received: true,
        skipped: "unknown_club",
        clubId: result.clubId,
      });
    }

    if (result.failedOrganizationIds.length === result.organizationIds.length) {
      return NextResponse.json(
        { error: "Webhook processing failed for all organizations" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      received: true,
      organizationIds: result.organizationIds,
      ...(result.failedOrganizationIds.length > 0
        ? { failedOrganizationIds: result.failedOrganizationIds }
        : {}),
    });
  } catch (error) {
    console.error("SWIMS webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook failed" },
      { status: 500 },
    );
  }
}

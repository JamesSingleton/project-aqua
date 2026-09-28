import {
  parseSwimsWebhookBody,
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

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = parseSwimsWebhookBody(raw);
  if (!payload) {
    return NextResponse.json(
      { error: "Unrecognized or incomplete webhook payload" },
      { status: 400 },
    );
  }

  try {
    const result = await processSwimsWebhook(payload);

    if (result.kind === "duplicate") {
      return NextResponse.json({ received: true, duplicate: true });
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

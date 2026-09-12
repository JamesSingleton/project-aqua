import type { SwimsWebhookPayload } from "@project-aqua/usa-swimming";
import {
  handleSwimsWebhook,
  verifySwimsWebhook,
} from "@project-aqua/usa-swimming/webhooks";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const headersList = await headers();
  const thumbprint = headersList.get("x-vendor-thumbprint");
  const expected = process.env.USA_SWIMMING_VENDOR_THUMBPRINT ?? "";

  if (!verifySwimsWebhook(thumbprint, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as SwimsWebhookPayload & {
    organizationId: string;
  };

  if (!payload.organizationId) {
    return NextResponse.json(
      { error: "Missing organizationId" },
      { status: 400 },
    );
  }

  try {
    await handleSwimsWebhook(payload, payload.organizationId);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("SWIMS webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook failed" },
      { status: 500 },
    );
  }
}

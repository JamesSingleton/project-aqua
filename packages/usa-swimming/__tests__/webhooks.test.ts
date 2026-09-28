import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SwimsWebhookPayload } from "../src/types";
import {
  findOrganizationIdsByUsaSwimmingClubId,
  getSwimsWebhookDeliveryId,
  processSwimsWebhook,
  verifySwimsWebhook,
} from "../src/webhooks";

const mockSelectWhere = vi.fn();
const mockInsertReturning = vi.fn();

vi.mock("@lane4hq/db/client", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => mockSelectWhere(),
      }),
    }),
    insert: () => ({
      values: () => ({
        onConflictDoNothing: () => ({
          returning: () => mockInsertReturning(),
        }),
      }),
    }),
  },
}));

vi.mock("../src/sync", () => ({
  syncMemberFromSwims: vi.fn().mockResolvedValue(undefined),
}));

const basePayload: SwimsWebhookPayload = {
  event: "member.register",
  clubId: "club-123",
  memberId: "member-456",
};

describe("verifySwimsWebhook", () => {
  it("accepts a matching thumbprint", () => {
    expect(verifySwimsWebhook("secret-thumb", "secret-thumb")).toBe(true);
  });

  it("rejects thumbprints with different lengths without throwing", () => {
    expect(verifySwimsWebhook("short", "much-longer-secret")).toBe(false);
  });

  it("rejects a wrong thumbprint of the same length", () => {
    expect(verifySwimsWebhook("aaaaaaaa", "bbbbbbbb")).toBe(false);
  });

  it("rejects missing values", () => {
    expect(verifySwimsWebhook(null, "expected")).toBe(false);
    expect(verifySwimsWebhook("value", "")).toBe(false);
  });
});

describe("findOrganizationIdsByUsaSwimmingClubId", () => {
  beforeEach(() => {
    mockSelectWhere.mockReset();
  });

  it("returns no ids when no organization matches", async () => {
    mockSelectWhere.mockResolvedValueOnce([]);
    await expect(
      findOrganizationIdsByUsaSwimmingClubId("unknown-club"),
    ).resolves.toEqual([]);
  });

  it("returns a single organization id", async () => {
    mockSelectWhere.mockResolvedValueOnce([{ id: "org-1" }]);
    await expect(
      findOrganizationIdsByUsaSwimmingClubId("club-123"),
    ).resolves.toEqual(["org-1"]);
  });

  it("returns all matching organization ids", async () => {
    mockSelectWhere.mockResolvedValueOnce([{ id: "org-a" }, { id: "org-b" }]);
    await expect(
      findOrganizationIdsByUsaSwimmingClubId("shared-club"),
    ).resolves.toEqual(["org-a", "org-b"]);
  });
});

describe("processSwimsWebhook", () => {
  beforeEach(() => {
    mockSelectWhere.mockReset();
    mockInsertReturning.mockReset();
  });

  it("skips duplicate deliveries when the id was already processed", async () => {
    mockInsertReturning.mockResolvedValueOnce([]);

    await expect(
      processSwimsWebhook({
        ...basePayload,
        deliveryId: "delivery-1",
      }),
    ).resolves.toEqual({ kind: "duplicate" });

    expect(mockSelectWhere).not.toHaveBeenCalled();
  });

  it("uses explicit delivery ids for deduplication keys", () => {
    expect(
      getSwimsWebhookDeliveryId({
        ...basePayload,
        deliveryId: "vendor-delivery-99",
      }),
    ).toBe("vendor-delivery-99");
  });
});

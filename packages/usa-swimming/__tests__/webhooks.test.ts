import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SwimsWebhookPayload } from "../src/types";
import {
  findOrganizationIdsByUsaSwimmingClubId,
  getSwimsWebhookDeliveryKey,
  parseSwimsWebhookBody,
  processSwimsWebhook,
  verifySwimsWebhook,
} from "../src/webhooks";

const mockSelectWhere = vi.fn();
const mockInsertReturning = vi.fn();
const mockUpdateReturning = vi.fn();

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
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => mockUpdateReturning(),
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

describe("parseSwimsWebhookBody", () => {
  it("parses Swagger SwimsEvent payloads", () => {
    expect(
      parseSwimsWebhookBody({
        eventSequence: 9001,
        eventTypeId: 3,
        eventType: "member.renew",
        clubId: "club-123",
        modifiedDatetime: "2026-09-28T12:00:00Z",
        eventData: {
          memberIds: ["member-456"],
          vendorRecordId: "rec-1",
        },
      }),
    ).toMatchObject({
      event: "member.renew",
      clubId: "club-123",
      memberId: "member-456",
      eventSequence: 9001,
      modifiedDatetime: "2026-09-28T12:00:00Z",
      recordId: "rec-1",
    });
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

describe("getSwimsWebhookDeliveryKey", () => {
  it("uses eventSequence when documented on the payload", () => {
    expect(
      getSwimsWebhookDeliveryKey({
        ...basePayload,
        eventSequence: 42,
      }),
    ).toEqual({ id: "seq:42", strategy: "sequence" });
  });

  it("includes modifiedDatetime so repeat renewals are not deduped together", () => {
    const key2025 = getSwimsWebhookDeliveryKey({
      ...basePayload,
      event: "member.renew",
      modifiedDatetime: "2025-09-01T00:00:00Z",
    });
    const key2026 = getSwimsWebhookDeliveryKey({
      ...basePayload,
      event: "member.renew",
      modifiedDatetime: "2026-09-01T00:00:00Z",
    });
    expect(key2025.id).not.toEqual(key2026.id);
    expect(key2025.strategy).toBe("occurrence");
  });
});

describe("processSwimsWebhook", () => {
  beforeEach(() => {
    mockSelectWhere.mockReset();
    mockInsertReturning.mockReset();
    mockUpdateReturning.mockReset();
  });

  it("skips duplicate deliveries when eventSequence was already processed", async () => {
    mockInsertReturning.mockResolvedValueOnce([]);

    await expect(
      processSwimsWebhook({
        ...basePayload,
        eventSequence: 100,
      }),
    ).resolves.toEqual({ kind: "duplicate" });

    expect(mockSelectWhere).not.toHaveBeenCalled();
  });
});

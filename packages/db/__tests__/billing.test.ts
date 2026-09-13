import { beforeEach, describe, expect, it, vi } from "vitest";

const where = vi.fn();
const from = vi.fn(() => ({ where }));
const select = vi.fn(() => ({ from }));

vi.mock("../src/client", () => ({
  db: {
    select: (...args: unknown[]) => select(...args),
  },
}));

const { getTeamPlan, getTeamPlans } = await import("../src/queries/billing");

describe("getTeamPlans", () => {
  beforeEach(() => {
    select.mockClear();
    from.mockClear();
    where.mockReset();
  });

  it("returns an empty map for empty input without querying", async () => {
    await expect(getTeamPlans([])).resolves.toEqual(new Map());
    expect(select).not.toHaveBeenCalled();
  });

  it("defaults missing subscriptions to free", async () => {
    where.mockResolvedValueOnce([]);
    const result = await getTeamPlans(["org-a", "org-b"]);
    expect(result.get("org-a")).toBe("free");
    expect(result.get("org-b")).toBe("free");
    expect(result.size).toBe(2);
  });

  it("uses one IN query and deduplicates input ids", async () => {
    where.mockResolvedValueOnce([{ organizationId: "org-a", plan: "pro" }]);
    const result = await getTeamPlans(["org-a", "org-a", "org-b"]);
    expect(select).toHaveBeenCalledTimes(1);
    expect(result.get("org-a")).toBe("pro");
    expect(result.get("org-b")).toBe("free");
    expect(result.size).toBe(2);
  });
});

describe("getTeamPlan", () => {
  beforeEach(() => {
    select.mockClear();
    from.mockClear();
    where.mockReset();
  });

  it("returns the plan for a subscribed organization", async () => {
    where.mockResolvedValueOnce([
      { organizationId: "org-a", plan: "enterprise" },
    ]);
    await expect(getTeamPlan("org-a")).resolves.toBe("enterprise");
  });

  it("returns free when no subscription row exists", async () => {
    where.mockResolvedValueOnce([]);
    await expect(getTeamPlan("org-a")).resolves.toBe("free");
  });
});

import { currentSeasonRange } from "@project-aqua/swim-core/age";
import { beforeEach, describe, expect, it, vi } from "vitest";

const limit = vi.fn();
const where = vi.fn(() => ({ limit }));
const from = vi.fn(() => ({ where }));
const select = vi.fn(() => ({ from }));

const returning = vi.fn();
const onConflictDoNothing = vi.fn(() => ({ returning }));
const values = vi.fn(() => ({ onConflictDoNothing }));
const insert = vi.fn(() => ({ values }));

const updateWhere = vi.fn().mockResolvedValue(undefined);
const updateSet = vi.fn(() => ({ where: updateWhere }));
const update = vi.fn(() => ({ set: updateSet }));
const transaction = vi.fn(
  async (callback: (tx: { update: typeof update }) => unknown) =>
    callback({ update }),
);

vi.mock("../src/client", () => ({
  db: {
    select: (...args: unknown[]) => select(...args),
    insert: (...args: unknown[]) => insert(...args),
    transaction: (...args: unknown[]) => transaction(...args),
  },
}));

const { ensureCurrentSeason } = await import("../src/queries/seasons");

const range = currentSeasonRange();
const orgId = "LRTECiOS0JGHDDrIA64JyQ0RCnTU7fYt";

function seasonRow(overrides: { id?: string; isCurrent?: boolean } = {}) {
  return {
    id: overrides.id ?? "season-1",
    organizationId: orgId,
    label: range.label,
    startsOn: range.startsOn,
    endsOn: range.endsOn,
    isCurrent: overrides.isCurrent ?? true,
    createdAt: new Date("2026-09-13T00:00:00.000Z"),
    updatedAt: new Date("2026-09-13T00:00:00.000Z"),
  };
}

describe("ensureCurrentSeason", () => {
  beforeEach(() => {
    select.mockClear();
    from.mockClear();
    where.mockClear();
    limit.mockReset();
    insert.mockClear();
    values.mockClear();
    onConflictDoNothing.mockClear();
    returning.mockReset();
    update.mockClear();
    updateSet.mockClear();
    updateWhere.mockClear();
    transaction.mockClear();
  });

  it("returns the existing current season without inserting", async () => {
    const current = seasonRow();
    limit.mockResolvedValueOnce([current]);

    await expect(ensureCurrentSeason(orgId)).resolves.toEqual(current);
    expect(insert).not.toHaveBeenCalled();
  });

  it("inserts the calendar season on first visit and marks it current", async () => {
    const created = seasonRow({ id: "new-season", isCurrent: false });
    limit.mockResolvedValueOnce([]).mockResolvedValueOnce([created]);
    returning.mockResolvedValueOnce([created]);

    await expect(ensureCurrentSeason(orgId)).resolves.toEqual({
      ...created,
      isCurrent: true,
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        label: range.label,
        startsOn: range.startsOn,
        endsOn: range.endsOn,
        isCurrent: false,
      }),
    );
    expect(onConflictDoNothing).toHaveBeenCalled();
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it("adopts the winner when a concurrent insert already created the label", async () => {
    const winner = seasonRow({ id: "winner", isCurrent: false });
    limit
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([winner])
      .mockResolvedValueOnce([winner]);
    returning.mockResolvedValueOnce([]);

    await expect(ensureCurrentSeason(`${orgId}-race`)).resolves.toEqual({
      ...winner,
      isCurrent: true,
    });
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it("treats unique violations as a concurrent insert and adopts the row", async () => {
    const winner = seasonRow({ id: "winner", isCurrent: false });
    limit
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([winner])
      .mockResolvedValueOnce([winner]);
    returning.mockRejectedValueOnce({
      cause: { code: "23505", constraint_name: "team_seasons_org_label_idx" },
    });

    await expect(ensureCurrentSeason(`${orgId}-23505`)).resolves.toEqual({
      ...winner,
      isCurrent: true,
    });
  });

  it("coalesces concurrent callers for the same org", async () => {
    const current = seasonRow({ id: "shared" });
    let release!: (rows: unknown[]) => void;
    limit.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );

    const first = ensureCurrentSeason(`${orgId}-inflight`);
    const second = ensureCurrentSeason(`${orgId}-inflight`);
    release([current]);

    await expect(first).resolves.toEqual(current);
    await expect(second).resolves.toEqual(current);
    expect(limit).toHaveBeenCalledTimes(1);
    expect(insert).not.toHaveBeenCalled();
  });
});

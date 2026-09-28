import { beforeEach, describe, expect, it, vi } from "vitest";

type Chain = Record<string, ReturnType<typeof vi.fn>> & PromiseLike<unknown>;

function chain(result: unknown): Chain {
  const c = {} as Chain;
  for (const method of [
    "from",
    "innerJoin",
    "leftJoin",
    "where",
    "orderBy",
    "limit",
    "set",
    "values",
    "onConflictDoNothing",
    "onConflictDoUpdate",
  ]) {
    c[method] = vi.fn(() => c);
  }
  // biome-ignore lint/suspicious/noThenProperty: drizzle builders are thenable
  (c as { then: PromiseLike<unknown>["then"] }).then = (resolve, reject) =>
    Promise.resolve(result).then(resolve, reject);
  return c;
}

const selectQueue: unknown[][] = [];
const updates: Chain[] = [];
const inserts: { table: unknown; chain: Chain }[] = [];

const select = vi.fn(() => chain(selectQueue.shift() ?? []));
const update = vi.fn(() => {
  const c = chain(undefined);
  updates.push(c);
  return c;
});
const insert = vi.fn((table: unknown) => {
  const c = chain(undefined);
  inserts.push({ table, chain: c });
  return c;
});
const transaction = vi.fn(async (callback: (tx: unknown) => unknown) =>
  callback({ select, update, insert }),
);

vi.mock("../src/client", () => ({
  db: {
    select: (...args: unknown[]) => select(...(args as [])),
    update: (...args: unknown[]) => update(...(args as [])),
    insert: (table: unknown) => insert(table),
    transaction: (cb: (tx: unknown) => unknown) => transaction(cb),
  },
}));

const ensureCurrentSeason = vi.fn(async () => ({ id: "season-current" }));
const getEnrollmentForMembershipInSeason = vi.fn();
const enrollMembershipInSeason = vi.fn(async () => "enrollment-new");
const updateSeasonEnrollment = vi.fn(async () => true);

vi.mock("../src/queries/seasons", () => ({
  ensureCurrentSeason: () => ensureCurrentSeason(),
  getEnrollmentForMembershipInSeason: (...args: unknown[]) =>
    getEnrollmentForMembershipInSeason(...args),
  enrollMembershipInSeason: (...args: unknown[]) =>
    enrollMembershipInSeason(...(args as [])),
  updateSeasonEnrollment: (...args: unknown[]) =>
    updateSeasonEnrollment(...(args as [])),
}));

const { swimmers, teamSwimmerMemberships } = await import(
  "../src/schema/swimmers"
);
const { addSwimmer, findArchivedTeamSwimmers, reactivateSwimmerOnTeam } =
  await import("../src/queries/roster");

const orgId = "org-1";

const archivedRow = {
  swimmerId: "swimmer-1",
  membershipId: "membership-1",
  firstName: "Avery",
  lastName: "Okafor",
  preferredName: null,
  dateOfBirth: "2011-04-17",
  governingBodyId: null,
  leftAt: new Date("2026-03-04T00:00:00.000Z"),
};

const newSwimmerInput = {
  firstName: "Avery",
  lastName: "Okafor",
  dateOfBirth: "2011-04-17",
  gender: "female" as const,
};

function membershipUpdates() {
  return updates
    .flatMap((c) => c.set.mock.calls.map((call) => call[0]))
    .filter((set) => set && "status" in set);
}

beforeEach(() => {
  selectQueue.length = 0;
  updates.length = 0;
  inserts.length = 0;
  vi.clearAllMocks();
  getEnrollmentForMembershipInSeason.mockResolvedValue(null);
});

describe("reactivateSwimmerOnTeam", () => {
  it("restores the membership and enrolls in the current season", async () => {
    selectQueue.push([{ id: "membership-1", status: "inactive" }]);

    await expect(reactivateSwimmerOnTeam("swimmer-1", orgId)).resolves.toEqual({
      status: "reactivated",
      swimmerId: "swimmer-1",
      membershipId: "membership-1",
    });

    expect(membershipUpdates()).toEqual([
      expect.objectContaining({ status: "active", leftAt: null }),
    ]);
    expect(enrollMembershipInSeason).toHaveBeenCalledWith(
      "season-current",
      expect.objectContaining({ membershipId: "membership-1" }),
    );
    expect(updateSeasonEnrollment).not.toHaveBeenCalled();
  });

  it("reopens an existing inactive enrollment in the target season", async () => {
    selectQueue.push([{ id: "membership-1", status: "inactive" }]);
    getEnrollmentForMembershipInSeason.mockResolvedValue({
      id: "enrollment-1",
      status: "inactive",
    });

    await reactivateSwimmerOnTeam("swimmer-1", orgId, {
      seasonId: "season-past",
    });

    expect(getEnrollmentForMembershipInSeason).toHaveBeenCalledWith(
      "membership-1",
      "season-past",
    );
    expect(updateSeasonEnrollment).toHaveBeenCalledWith(
      "enrollment-1",
      orgId,
      expect.objectContaining({ status: "active", leftAt: null }),
    );
    expect(enrollMembershipInSeason).not.toHaveBeenCalled();
  });

  it("returns not_found when the swimmer never belonged to the team", async () => {
    selectQueue.push([]);

    await expect(reactivateSwimmerOnTeam("stranger", orgId)).resolves.toEqual({
      status: "not_found",
      swimmerId: "stranger",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("is a no-op for swimmers already active this season", async () => {
    selectQueue.push([{ id: "membership-1", status: "active" }]);
    getEnrollmentForMembershipInSeason.mockResolvedValue({
      id: "enrollment-1",
      status: "active",
    });

    const result = await reactivateSwimmerOnTeam("swimmer-1", orgId);

    expect(result.status).toBe("already_active");
    expect(update).not.toHaveBeenCalled();
    expect(updateSeasonEnrollment).not.toHaveBeenCalled();
  });
});

describe("findArchivedTeamSwimmers", () => {
  it("keeps only rows whose name and DOB match", async () => {
    selectQueue.push([
      archivedRow,
      { ...archivedRow, swimmerId: "swimmer-2", lastName: "Lindqvist" },
    ]);

    const matches = await findArchivedTeamSwimmers(orgId, newSwimmerInput);

    expect(matches.map((m) => m.swimmerId)).toEqual(["swimmer-1"]);
  });

  it("skips the query without a USA ID or full identity", async () => {
    await expect(
      findArchivedTeamSwimmers(orgId, { firstName: "Avery" }),
    ).resolves.toEqual([]);
    expect(select).not.toHaveBeenCalled();
  });
});

describe("addSwimmer with an archived teammate", () => {
  it("reactivates the archived membership instead of creating a person", async () => {
    selectQueue.push([archivedRow]);

    const result = await addSwimmer(orgId, newSwimmerInput);

    expect(result).toEqual({
      swimmerId: "swimmer-1",
      membershipId: "membership-1",
      reactivated: true,
    });
    expect(inserts.some((i) => i.table === swimmers)).toBe(false);
    expect(membershipUpdates()).toEqual([
      expect.objectContaining({ status: "active", leftAt: null }),
    ]);
    expect(enrollMembershipInSeason).toHaveBeenCalled();
  });

  it("creates a new person when the coach chose Create as new person", async () => {
    const result = await addSwimmer(orgId, {
      ...newSwimmerInput,
      forceNewPerson: true,
    });

    expect(result).not.toHaveProperty("reactivated");
    expect(inserts.some((i) => i.table === swimmers)).toBe(true);
    expect(inserts.some((i) => i.table === teamSwimmerMemberships)).toBe(true);
  });

  it("reactivates when the USA Swimming ID belongs to an archived teammate", async () => {
    selectQueue.push(
      [{ id: "swimmer-1", governingBodyId: "ABC123" }],
      [{ id: "membership-1", status: "inactive" }],
    );

    const result = await addSwimmer(orgId, {
      ...newSwimmerInput,
      usaMemberId: "ABC123",
    });

    expect(result).toMatchObject({
      membershipId: "membership-1",
      reactivated: true,
    });
    expect(inserts.some((i) => i.table === teamSwimmerMemberships)).toBe(false);
  });

  it("still rejects swimmers who are already active on the team", async () => {
    selectQueue.push(
      [{ id: "swimmer-1", governingBodyId: "ABC123" }],
      [{ id: "membership-1", status: "active" }],
    );

    await expect(
      addSwimmer(orgId, { ...newSwimmerInput, usaMemberId: "ABC123" }),
    ).rejects.toThrow("already on this team");
  });
});

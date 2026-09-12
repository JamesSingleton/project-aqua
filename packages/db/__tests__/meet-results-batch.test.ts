import { beforeEach, describe, expect, it, vi } from "vitest";

const values = vi.fn();
const insert = vi.fn(() => ({ values }));
const transaction = vi.fn(
  async (callback: (tx: { insert: typeof insert }) => unknown) =>
    callback({ insert }),
);
const recomputeBestTimesForSwimmers = vi.fn();

vi.mock("../src/client", () => ({
  db: {
    transaction: (...args: unknown[]) => transaction(...args),
  },
}));

vi.mock("../src/queries/progression", () => ({
  findSwimmerBestTime: vi.fn(),
  recomputeBestTimesForSwimmers: (...args: unknown[]) =>
    recomputeBestTimesForSwimmers(...args),
  upsertBestTime: vi.fn(),
}));

const { addResolvedMeetResults } = await import("../src/queries/meets");

describe("addResolvedMeetResults", () => {
  beforeEach(() => {
    insert.mockClear();
    values.mockReset();
    transaction.mockClear();
    recomputeBestTimesForSwimmers.mockReset();
  });

  it("does not open a transaction for no resolved rows", async () => {
    await expect(addResolvedMeetResults("meet-1", [], [])).resolves.toEqual([]);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("inserts all rows in one transaction", async () => {
    values.mockResolvedValueOnce(undefined);

    const ids = await addResolvedMeetResults(
      "meet-1",
      [
        {
          meetEventId: "event-1",
          swimmerId: "swimmer-1",
          timeMs: 32150,
          place: 1,
          previousBestTimeMs: 33000,
        },
        {
          meetEventId: "event-2",
          swimmerId: "swimmer-2",
          timeMs: 35500,
          place: null,
          previousBestTimeMs: null,
        },
      ],
      ["swimmer-1", "swimmer-2"],
    );

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(recomputeBestTimesForSwimmers).toHaveBeenCalledWith(
      ["swimmer-1", "swimmer-2"],
      expect.anything(),
    );
    expect(values).toHaveBeenCalledWith([
      expect.objectContaining({
        meetId: "meet-1",
        meetEventId: "event-1",
        swimmerId: "swimmer-1",
        timeMs: 32150,
        place: 1,
        previousBestTimeMs: 33000,
      }),
      expect.objectContaining({
        meetId: "meet-1",
        meetEventId: "event-2",
        swimmerId: "swimmer-2",
        timeMs: 35500,
        place: null,
        previousBestTimeMs: null,
      }),
    ]);
    expect(ids).toHaveLength(2);
  });

  it("fails the transaction when best-time recomputation fails", async () => {
    values.mockResolvedValueOnce(undefined);
    recomputeBestTimesForSwimmers.mockRejectedValueOnce(
      new Error("recompute failed"),
    );

    await expect(
      addResolvedMeetResults(
        "meet-1",
        [
          {
            meetEventId: "event-1",
            swimmerId: "swimmer-1",
            timeMs: 32150,
            place: 1,
            previousBestTimeMs: 33000,
          },
        ],
        ["swimmer-1"],
      ),
    ).rejects.toThrow("recompute failed");
  });
});

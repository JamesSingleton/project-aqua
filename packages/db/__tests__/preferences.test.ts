import { beforeEach, describe, expect, it, vi } from "vitest";

const limit = vi.fn();
const where = vi.fn(() => ({ limit }));
const from = vi.fn(() => ({ where }));
const select = vi.fn(() => ({ from }));

const onConflictDoUpdate = vi.fn();
const values = vi.fn(() => ({ onConflictDoUpdate }));
const insert = vi.fn(() => ({ values }));

vi.mock("../src/client", () => ({
  db: {
    select: (...args: unknown[]) => select(...args),
    insert: (...args: unknown[]) => insert(...args),
  },
}));

const {
  getTeamUiPreferences,
  getUserPreferences,
  isThemePreference,
  patchTeamUiPreferences,
  upsertUserTheme,
} = await import("../src/queries/preferences");

describe("isThemePreference", () => {
  it("accepts light, dark, and system", () => {
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("system")).toBe(true);
    expect(isThemePreference("neon")).toBe(false);
  });
});

describe("getUserPreferences", () => {
  beforeEach(() => {
    select.mockClear();
    from.mockClear();
    where.mockClear();
    limit.mockReset();
    insert.mockClear();
    values.mockClear();
    onConflictDoUpdate.mockReset();
  });

  it("returns defaults when no row exists", async () => {
    limit.mockResolvedValueOnce([]);
    await expect(getUserPreferences("user-1")).resolves.toEqual({
      userId: "user-1",
      theme: "system",
      updatedAt: null,
    });
  });

  it("returns the stored row when present", async () => {
    const row = {
      userId: "user-1",
      theme: "dark" as const,
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    limit.mockResolvedValueOnce([row]);
    await expect(getUserPreferences("user-1")).resolves.toEqual(row);
  });
});

describe("upsertUserTheme", () => {
  beforeEach(() => {
    select.mockClear();
    from.mockClear();
    where.mockClear();
    limit.mockReset();
    insert.mockClear();
    values.mockClear();
    onConflictDoUpdate.mockReset();
  });

  it("upserts theme and returns refreshed preferences", async () => {
    onConflictDoUpdate.mockResolvedValueOnce(undefined);
    const row = {
      userId: "user-1",
      theme: "light" as const,
      updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    };
    limit.mockResolvedValueOnce([row]);

    await expect(upsertUserTheme("user-1", "light")).resolves.toEqual(row);
    expect(insert).toHaveBeenCalled();
    expect(values).toHaveBeenCalledWith({ userId: "user-1", theme: "light" });
    expect(onConflictDoUpdate).toHaveBeenCalled();
  });
});

describe("team UI preferences", () => {
  beforeEach(() => {
    select.mockClear();
    from.mockClear();
    where.mockClear();
    limit.mockReset();
    insert.mockClear();
    values.mockClear();
    onConflictDoUpdate.mockReset();
  });

  it("returns empty object when no team UI row exists", async () => {
    limit.mockResolvedValueOnce([]);
    await expect(getTeamUiPreferences("user-1", "org-1")).resolves.toEqual({});
  });

  it("returns stored team UI state", async () => {
    limit.mockResolvedValueOnce([
      { ui: { roster: { columnVisibility: { name: true } } } },
    ]);
    await expect(getTeamUiPreferences("user-1", "org-1")).resolves.toEqual({
      roster: { columnVisibility: { name: true } },
    });
  });

  it("patches and merges roster UI state", async () => {
    limit.mockResolvedValueOnce([
      {
        ui: {
          roster: {
            columnVisibility: { name: true },
            sorting: [{ id: "name", desc: false }],
          },
        },
      },
    ]);
    onConflictDoUpdate.mockResolvedValueOnce(undefined);

    const result = await patchTeamUiPreferences("user-1", "org-1", {
      roster: { columnVisibility: { age: false } },
    });

    expect(result).toEqual({
      roster: {
        columnVisibility: { age: false },
        sorting: [{ id: "name", desc: false }],
      },
    });
    expect(values).toHaveBeenCalledWith({
      userId: "user-1",
      organizationId: "org-1",
      ui: result,
    });
  });

  it("patches without roster key leaves existing ui unchanged shape", async () => {
    limit.mockResolvedValueOnce([
      { ui: { roster: { columnVisibility: { name: true } } } },
    ]);
    onConflictDoUpdate.mockResolvedValueOnce(undefined);

    const result = await patchTeamUiPreferences("user-1", "org-1", {});
    expect(result).toEqual({
      roster: { columnVisibility: { name: true } },
    });
  });
});

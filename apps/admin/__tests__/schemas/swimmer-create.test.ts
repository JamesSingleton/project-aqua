import { describe, expect, it } from "vitest";
import {
  BILLING_STEP_FIELDS,
  COACH_STEP_FIELDS,
  TEAM_STEP_FIELDS,
} from "../../schemas";
import { createSwimmerFormSchema } from "../../schemas/swimmer-create";

describe("schemas barrel / swimmer-create re-exports", () => {
  it("re-exports step field constants", () => {
    expect(TEAM_STEP_FIELDS).toContain("teamName");
    expect(COACH_STEP_FIELDS).toContain("coachName");
    expect(BILLING_STEP_FIELDS).toContain("plan");
  });

  it("exposes createSwimmerFormSchema from swim-core", () => {
    const parsed = createSwimmerFormSchema.safeParse({
      firstName: "Ada",
      lastName: "Lovelace",
      dateOfBirth: "1990-01-01",
      gender: "female",
    });
    expect(parsed.success).toBe(true);
  });
});

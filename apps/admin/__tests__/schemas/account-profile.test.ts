import { describe, expect, it } from "vitest";
import { accountProfileFormSchema } from "../../schemas/account-profile";

describe("accountProfileFormSchema", () => {
  it("trims valid profile names", () => {
    expect(
      accountProfileFormSchema.parse({
        firstName: "  James ",
        lastName: " Singleton  ",
        title: " Head Coach ",
      }),
    ).toEqual({
      firstName: "James",
      lastName: "Singleton",
      title: "Head Coach",
    });
  });

  it("requires both name parts", () => {
    expect(() =>
      accountProfileFormSchema.parse({
        firstName: "James",
        lastName: "",
        title: "",
      }),
    ).toThrow();
  });
});

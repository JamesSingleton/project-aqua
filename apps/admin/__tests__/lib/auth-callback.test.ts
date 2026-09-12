import { describe, expect, it } from "vitest";
import { getCallbackURL } from "@/lib/auth-callback";

describe("getCallbackURL", () => {
  it("returns fallback when callbackUrl is missing", () => {
    const params = new URLSearchParams();
    expect(getCallbackURL(params)).toBe("/");
    expect(getCallbackURL(params, "/onboarding")).toBe("/onboarding");
  });

  it("allows safe in-app paths", () => {
    const params = new URLSearchParams({
      callbackUrl: "/accept-invite?id=abc",
    });
    expect(getCallbackURL(params)).toBe("/accept-invite?id=abc");
  });

  it("rejects open redirects", () => {
    const params = new URLSearchParams({
      callbackUrl: "https://evil.example",
    });
    expect(getCallbackURL(params)).toBe("/");
  });
});

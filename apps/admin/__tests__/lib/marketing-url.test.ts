import { describe, expect, it } from "vitest";
import { getMarketingUrl } from "@/lib/marketing-url";

describe("getMarketingUrl", () => {
  it("uses NEXT_PUBLIC_MARKETING_URL when set", () => {
    const original = process.env.NEXT_PUBLIC_MARKETING_URL;
    process.env.NEXT_PUBLIC_MARKETING_URL = "https://projectaqua.com";
    expect(getMarketingUrl()).toBe("https://projectaqua.com");
    process.env.NEXT_PUBLIC_MARKETING_URL = original;
  });

  it("defaults to local web app", () => {
    const original = process.env.NEXT_PUBLIC_MARKETING_URL;
    delete process.env.NEXT_PUBLIC_MARKETING_URL;
    expect(getMarketingUrl()).toBe("http://localhost:3000");
    process.env.NEXT_PUBLIC_MARKETING_URL = original;
  });
});

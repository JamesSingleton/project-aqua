import { afterEach, describe, expect, it } from "vitest";
import { getDocsUrl } from "@/lib/docs-url";

const originalDocsUrl = process.env.NEXT_PUBLIC_DOCS_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_DOCS_URL = originalDocsUrl;
});

describe("getDocsUrl", () => {
  it("uses NEXT_PUBLIC_DOCS_URL when set", () => {
    process.env.NEXT_PUBLIC_DOCS_URL = "https://docs.example.com";

    expect(getDocsUrl()).toBe("https://docs.example.com");
  });

  it("uses the local Mintlify server by default", () => {
    delete process.env.NEXT_PUBLIC_DOCS_URL;

    expect(getDocsUrl()).toBe("http://localhost:3004");
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import {
  objectKeyFromPublicUrl,
  publicObjectPath,
  storageObjectUrl,
} from "../src/object";

beforeEach(() => {
  process.env.AWS_ENDPOINT_URL_S3 =
    "https://branch.storage.c-2.us-east-2.aws.neon.tech";
});

describe("public object URLs", () => {
  it("round-trips encoded object keys", () => {
    const key = "team id/logo (final).png";
    const path = publicObjectPath("team-logos", key);

    expect(path).toBe("/api/storage/team-logos/team%20id/logo%20(final).png");
    expect(objectKeyFromPublicUrl("team-logos", path)).toBe(key);
    expect(storageObjectUrl("team-logos", key)).toBe(
      "https://branch.storage.c-2.us-east-2.aws.neon.tech/team-logos/team%20id/logo%20(final).png",
    );
  });

  it("does not treat external or other-bucket URLs as managed objects", () => {
    expect(
      objectKeyFromPublicUrl(
        "team-logos",
        "https://images.example.com/team-logos/a/logo.png",
      ),
    ).toBeNull();
    expect(
      objectKeyFromPublicUrl(
        "team-logos",
        "https://branch.storage.c-2.us-east-2.aws.neon.tech/user-avatars/a/avatar.png",
      ),
    ).toBeNull();
  });
});

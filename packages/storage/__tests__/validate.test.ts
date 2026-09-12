import { describe, expect, it } from "vitest";
import {
  extensionForMimeType,
  ImageValidationError,
  isAllowedImageMimeType,
  MAX_IMAGE_BYTES,
  validateImageFile,
} from "../src/validate";

describe("validateImageFile", () => {
  it("accepts allowed images", () => {
    const result = validateImageFile({
      data: new Uint8Array([1, 2, 3]),
      mimeType: "image/png",
    });
    expect(result).toEqual({ mimeType: "image/png", size: 3, ext: "png" });
    expect(isAllowedImageMimeType("image/jpeg")).toBe(true);
    expect(extensionForMimeType("image/webp")).toBe("webp");
  });

  it("rejects empty, oversized, and bad mime", () => {
    expect(() =>
      validateImageFile({ data: new Uint8Array(), mimeType: "image/png" }),
    ).toThrow(ImageValidationError);

    expect(() =>
      validateImageFile({
        data: new Uint8Array([1]),
        mimeType: "image/png",
        size: MAX_IMAGE_BYTES + 1,
      }),
    ).toThrow(/MB or smaller/);

    expect(() =>
      validateImageFile({
        data: new Uint8Array([1]),
        mimeType: "application/pdf",
      }),
    ).toThrow(/JPEG/);
  });

  it("reads ArrayBuffer and Buffer sizes and strips mime params", () => {
    const buf = new ArrayBuffer(4);
    expect(
      validateImageFile({
        data: buf,
        mimeType: "image/jpeg; charset=binary",
      }).ext,
    ).toBe("jpg");

    expect(
      validateImageFile({
        data: Buffer.from([1, 2, 3, 4, 5]),
        mimeType: "image/png",
      }).size,
    ).toBe(5);

    expect(() =>
      validateImageFile({
        data: new Uint8Array([1]),
        mimeType: ";",
      }),
    ).toThrow(/JPEG/);
  });
});

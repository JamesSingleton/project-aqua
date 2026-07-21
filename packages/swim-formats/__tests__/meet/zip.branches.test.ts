import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import {
  extractMeetFileFromZip,
  isZipBytes,
  isZipFilename,
} from "../../src/meet/zip";

describe("zip helpers", () => {
  it("detects zip filenames and magic bytes", () => {
    expect(isZipFilename("meet.ZIP")).toBe(true);
    expect(isZipFilename("meet.ev3")).toBe(false);
    expect(isZipBytes(new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).toBe(true);
    expect(isZipBytes(new Uint8Array([0x00, 0x00, 0x00, 0x00]))).toBe(false);
  });

  it("rejects invalid or unreadable zip archives", () => {
    expect(() => extractMeetFileFromZip(new Uint8Array([1, 2, 3]))).toThrow(
      /Not a valid ZIP/,
    );
    expect(() =>
      extractMeetFileFromZip(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0xff])),
    ).toThrow(/Could not read ZIP/);
  });
});

describe("extractMeetFileFromZip formats", () => {
  it("selects hy3, sdif, and cl2 when higher-priority formats are absent", () => {
    const hy3 = "A102Meet Entries             Hy-Tek";
    const bytes = zipSync({
      "nested/meet.hy3": strToU8(hy3),
      "nested/meet.sd3": strToU8("A0V3 SDIF"),
      "nested/meet.cl2": strToU8("A01V3      02Meet Entries"),
    });
    expect(extractMeetFileFromZip(bytes).format).toBe("hy3");

    const sdifOnly = zipSync({ "a.sd3": strToU8("A0V3 SDIF") });
    expect(extractMeetFileFromZip(sdifOnly).format).toBe("sdif");

    const cl2Only = zipSync({ "a.cl2": strToU8("A01V3      02Meet Entries") });
    expect(extractMeetFileFromZip(cl2Only).format).toBe("cl2");
  });
});

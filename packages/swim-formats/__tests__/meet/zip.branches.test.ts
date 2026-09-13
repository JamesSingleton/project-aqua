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
    expect(isZipBytes(new Uint8Array([0x50, 0x4b, 0x05, 0x06]))).toBe(true);
    expect(isZipBytes(new Uint8Array([0x50, 0x4b, 0x07, 0x08]))).toBe(true);
    expect(isZipBytes(new Uint8Array([0x00, 0x00, 0x00, 0x00]))).toBe(false);
  });

  it("rejects invalid or unreadable zip archives", () => {
    expect(() => extractMeetFileFromZip(new Uint8Array([1, 2, 3]))).toThrow(
      /doesn't look like a ZIP/,
    );
    expect(() =>
      extractMeetFileFromZip(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0xff])),
    ).toThrow(/Couldn't read this ZIP/);
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

  it("skips empty files, directory entries, and prefers xls when alone", () => {
    const withEmpty = zipSync({
      "dir/": new Uint8Array(0),
      "empty.ev3": new Uint8Array(0),
      "real.hyv": strToU8("Meet;1/1/2025;1/2/2025;;Y;Pool\n1A;F;F;I;0;18;50;1"),
    });
    expect(extractMeetFileFromZip(withEmpty).format).toBe("hyv");

    const xlsOnly = zipSync({ "results.xlsx": strToU8("not-really-xls") });
    expect(extractMeetFileFromZip(xlsOnly).format).toBe("xls");
  });
});

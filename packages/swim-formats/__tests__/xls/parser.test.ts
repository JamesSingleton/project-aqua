import * as XLSX from "xlsx";
import { describe, expect, it, vi } from "vitest";
import {
  ExportXlsParseError,
  parseEventExportXls,
} from "../../src/xls/parser";

vi.mock("xlsx", async (importOriginal) => {
  const actual = await importOriginal<typeof import("xlsx")>();
  return {
    ...actual,
    read: vi.fn((data: Uint8Array, opts?: XLSX.ParsingOptions) => {
      if (data[0] === 0x99) {
        return { SheetNames: [], Sheets: {} };
      }
      if (data[0] === 0x98) {
        return { SheetNames: ["Missing"], Sheets: {} };
      }
      return actual.read(data, opts);
    }),
  };
});

function makeWorkbook(rows: unknown[][], bookType: XLSX.BookType = "xlsx"): Uint8Array {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return new Uint8Array(XLSX.write(wb, { type: "buffer", bookType }));
}

const validRows = [
  ["meta"],
  ["100 Free Event"],
  [
    "name",
    "age",
    "team",
    "seed time",
    "x",
    "x",
    "prelim time",
    "x",
    "x",
    "finals time",
    "x",
    "x",
    "pad",
    "pad2",
  ],
  [
    "1",
    "Jane Doe",
    "16",
    "TST",
    "30.00",
    "",
    "",
    "",
    "",
    "29.50",
    "",
    "",
    "",
    "",
    "29.00",
  ],
  [
    "2",
    "Bob Smith",
    "17",
    "TST",
    "31.00",
    "",
    "",
    "",
    "",
    "30.50",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ],
];

describe("parseEventExportXls", () => {
  it("parses individual event results with finals time", () => {
    const meet = parseEventExportXls(makeWorkbook(validRows));
    expect(meet.name).toBe("100 Free Event");
    expect(meet.results).toHaveLength(2);
    expect(meet.results[0]).toMatchObject({
      swimmerName: "Jane Doe",
      place: 1,
      resultType: "finals",
    });
    expect(meet.results[1]?.resultType).toBe("prelim");
  });

  it("skips final placeholder row and uses seed time fallback", () => {
    const rows = [
      ["meta"],
      ["200 IM"],
      ["name", "age", "team", "seed time", "x", "x"],
      ["Final Results"],
      ["1", "Pat Jones", "15", "TST", "2:30.00", ""],
    ];
    const meet = parseEventExportXls(makeWorkbook(rows));
    expect(meet.results[0]).toMatchObject({
      swimmerName: "Pat Jones",
      place: 1,
    });
  });

  it("accepts colon-formatted times and --- place rows", () => {
    const rows = [
      ["meta"],
      ["50 Free"],
      [
        "name",
        "age",
        "team",
        "seed time",
        "x",
        "x",
        "prelim time",
        "x",
        "x",
        "finals time",
        "x",
        "x",
        "pad",
        "pad2",
      ],
      [
        "---",
        "No Time Swimmer",
        "12",
        "TST",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "1:05.50",
        "",
        "",
        "",
        "",
      ],
    ];
    const meet = parseEventExportXls(makeWorkbook(rows));
    expect(meet.results[0]?.place).toBeUndefined();
    expect(meet.results[0]?.time).toMatch(/1:05/);
  });

  it("filters parsing elements to header times only", () => {
    const rows = [
      ["meta"],
      ["50 Free"],
      ["name", "age", "team", "seed time", "x", "x"],
      ["1", "Ada Lovelace", "14", "TST", "28.50", ""],
    ];
    const meet = parseEventExportXls(makeWorkbook(rows), [
      "name",
      "age",
      "team",
      "seed time",
      "prelim time",
      "finals time",
    ]);
    expect(meet.results[0]?.swimmerName).toBe("Ada Lovelace");
  });

  it("throws ExportXlsParseError for invalid workbooks", () => {
    expect(() => parseEventExportXls(new Uint8Array([0, 1, 2]))).toThrow(
      ExportXlsParseError,
    );

    expect(() => parseEventExportXls(new Uint8Array([0x99]))).toThrow(/no sheets/i);
    expect(() => parseEventExportXls(new Uint8Array([0x98]))).toThrow(
      /Missing first sheet/i,
    );

    const noHeader = makeWorkbook([
      ["meta"],
      ["Event"],
      ["place", "swimmer"],
    ]);
    expect(() => parseEventExportXls(noHeader)).toThrow(/header row/i);

    const badOffset = makeWorkbook([
      ["meta"],
      ["Event"],
      ["name"],
      ["1"],
    ]);
    expect(() => parseEventExportXls(badOffset)).toThrow(/Invalid header row offset/);
  });

  it("uses seed time when prelim and finals columns are empty", () => {
    const rows = [
      ["meta"],
      ["50 Free"],
      ["name", "age", "team", "seed time", "x", "x"],
      ["1", "Seed Only", "14", "TST", "28.50", ""],
    ];
    const meet = parseEventExportXls(makeWorkbook(rows));
    expect(meet.results[0]?.time).toBe("28.50");
    expect(meet.results[0]?.resultType).toBeUndefined();
  });

  it("returns no result when all time cells are invalid", () => {
    const rows = [
      ["meta"],
      ["50 Free"],
      ["name", "age", "team", "seed time", "x", "x", "prelim time", "x", "x", "finals time", "x", "x"],
      ["1", "Bad Time", "14", "TST", "abc", "", "", "bad", "", "", "nope", "", ""],
    ];
    expect(parseEventExportXls(makeWorkbook(rows)).results).toEqual([]);
  });

  it("sets ExportXlsParseError name", () => {
    const err = new ExportXlsParseError("test");
    expect(err.name).toBe("ExportXlsParseError");
    expect(err.message).toBe("test");
  });
});

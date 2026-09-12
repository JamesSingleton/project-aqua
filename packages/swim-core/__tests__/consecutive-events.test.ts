import { describe, expect, it } from "vitest";
import {
  consecutivePairsForMember,
  consecutiveProgramPairs,
  previousSameGenderEvent,
} from "../src/consecutive-events";

const ungendered = [
  { id: "e1", eventNumber: 1 },
  { id: "e2", eventNumber: 2 },
  { id: "e4", eventNumber: 4 },
  { id: "e3", eventNumber: 3 },
  { id: "skip", eventNumber: null },
];

describe("consecutiveProgramPairs", () => {
  it("pairs adjacent numbered events when gender is omitted", () => {
    expect(consecutiveProgramPairs(ungendered)).toEqual([
      {
        firstEventId: "e1",
        secondEventId: "e2",
        firstEventNumber: 1,
        secondEventNumber: 2,
      },
      {
        firstEventId: "e2",
        secondEventId: "e3",
        firstEventNumber: 2,
        secondEventNumber: 3,
      },
      {
        firstEventId: "e3",
        secondEventId: "e4",
        firstEventNumber: 3,
        secondEventNumber: 4,
      },
    ]);
  });

  it("pairs same-gender events across opposite-sex events in between", () => {
    expect(
      consecutiveProgramPairs([
        { id: "m1", eventNumber: 1, gender: "male" },
        { id: "f2", eventNumber: 2, gender: "female" },
        { id: "m3", eventNumber: 3, gender: "male" },
        { id: "f4", eventNumber: 4, gender: "female" },
      ]),
    ).toEqual([
      {
        firstEventId: "m1",
        secondEventId: "m3",
        firstEventNumber: 1,
        secondEventNumber: 3,
      },
      {
        firstEventId: "f2",
        secondEventId: "f4",
        firstEventNumber: 2,
        secondEventNumber: 4,
      },
    ]);
  });

  it("keeps mixed in its own lane", () => {
    expect(
      consecutiveProgramPairs([
        { id: "f1", eventNumber: 1, gender: "female" },
        { id: "x2", eventNumber: 2, gender: "mixed" },
        { id: "f3", eventNumber: 3, gender: "female" },
        { id: "x4", eventNumber: 4, gender: "mixed" },
      ]),
    ).toEqual([
      {
        firstEventId: "f1",
        secondEventId: "f3",
        firstEventNumber: 1,
        secondEventNumber: 3,
      },
      {
        firstEventId: "x2",
        secondEventId: "x4",
        firstEventNumber: 2,
        secondEventNumber: 4,
      },
    ]);
  });

  it("returns nothing for a single event", () => {
    expect(
      consecutiveProgramPairs([{ id: "a", eventNumber: 1, gender: "male" }]),
    ).toEqual([]);
  });
});

describe("consecutivePairsForMember", () => {
  it("returns only pairs the swimmer is in", () => {
    expect(consecutivePairsForMember(["e1", "e2", "e4"], ungendered)).toEqual([
      {
        firstEventId: "e1",
        secondEventId: "e2",
        firstEventNumber: 1,
        secondEventNumber: 2,
      },
    ]);
  });

  it("does not treat opposite-gender neighbors as consecutive", () => {
    const interleaved = [
      { id: "m1", eventNumber: 1, gender: "male" },
      { id: "f2", eventNumber: 2, gender: "female" },
      { id: "m3", eventNumber: 3, gender: "male" },
    ];
    expect(consecutivePairsForMember(["m1", "f2"], interleaved)).toEqual([]);
    expect(consecutivePairsForMember(["m1", "m3"], interleaved)).toEqual([
      {
        firstEventId: "m1",
        secondEventId: "m3",
        firstEventNumber: 1,
        secondEventNumber: 3,
      },
    ]);
  });

  it("accepts a Set of event ids", () => {
    expect(
      consecutivePairsForMember(new Set(["e1", "e2"]), ungendered),
    ).toHaveLength(1);
  });
});

describe("previousSameGenderEvent", () => {
  it("returns the prior event in that gender's program", () => {
    const events = [
      { id: "m1", eventNumber: 1, gender: "male" },
      { id: "f2", eventNumber: 2, gender: "female" },
      { id: "m3", eventNumber: 3, gender: "male" },
    ];
    expect(previousSameGenderEvent("m3", events)).toEqual({
      firstEventId: "m1",
      secondEventId: "m3",
      firstEventNumber: 1,
      secondEventNumber: 3,
    });
    expect(previousSameGenderEvent("m1", events)).toBeNull();
    expect(previousSameGenderEvent("f2", events)).toBeNull();
  });
});

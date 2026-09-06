import { describe, expect, it } from "vitest";
import {
  formatSplitCaptureLabel,
  splitCapturePlan,
  splitCaptureStrokeHint,
} from "../src/split-capture";

function distances(plan: ReturnType<typeof splitCapturePlan>): number[] {
  return plan.marks.map((mark) => mark.cumulativeDistance);
}

describe("splitCapturePlan", () => {
  it("returns no marks for non-positive distance", () => {
    expect(splitCapturePlan({ distance: 0, course: "SCY" })).toEqual({
      interval: 0,
      marks: [],
    });
    expect(splitCapturePlan({ distance: -50, course: "SCY" }).marks).toEqual(
      [],
    );
  });

  it("uses 25s for a SCY or SCM 50, and one 50 for LCM", () => {
    expect(
      distances(splitCapturePlan({ distance: 50, course: "SCY" })),
    ).toEqual([25, 50]);
    expect(
      distances(splitCapturePlan({ distance: 50, course: "SCM" })),
    ).toEqual([25, 50]);
    expect(
      distances(splitCapturePlan({ distance: 50, course: "LCM" })),
    ).toEqual([50]);
    expect(splitCapturePlan({ distance: 50, course: "SCY" }).interval).toBe(25);
    expect(splitCapturePlan({ distance: 50, course: "LCM" }).interval).toBe(50);
  });

  it("uses 50s through 500", () => {
    expect(
      distances(splitCapturePlan({ distance: 100, course: "SCY" })),
    ).toEqual([50, 100]);
    expect(
      distances(splitCapturePlan({ distance: 200, course: "SCY" })),
    ).toEqual([50, 100, 150, 200]);
    expect(
      distances(splitCapturePlan({ distance: 400, course: "LCM" })),
    ).toEqual([50, 100, 150, 200, 250, 300, 350, 400]);
    const fiveHundred = splitCapturePlan({ distance: 500, course: "SCY" });
    expect(fiveHundred.interval).toBe(50);
    expect(fiveHundred.marks).toHaveLength(10);
    expect(fiveHundred.marks.at(-1)).toEqual({
      cumulativeDistance: 500,
      isFinal: true,
    });
    expect(fiveHundred.marks[0]?.isFinal).toBe(false);
  });

  it("uses 100s above 500, with a leftover 50 on 1650", () => {
    expect(
      distances(splitCapturePlan({ distance: 800, course: "LCM" })),
    ).toEqual([100, 200, 300, 400, 500, 600, 700, 800]);
    expect(
      distances(splitCapturePlan({ distance: 1000, course: "SCY" })),
    ).toHaveLength(10);
    const mile = splitCapturePlan({ distance: 1650, course: "SCY" });
    expect(mile.interval).toBe(100);
    expect(mile.marks).toHaveLength(17);
    expect(mile.marks.at(-2)?.cumulativeDistance).toBe(1600);
    expect(mile.marks.at(-1)).toEqual({
      cumulativeDistance: 1650,
      isFinal: true,
    });
  });

  it("builds one mark per relay racing leg", () => {
    const relay = splitCapturePlan({
      distance: 200,
      course: "SCY",
      isRelay: true,
    });
    expect(relay.interval).toBe(50);
    expect(distances(relay)).toEqual([50, 100, 150, 200]);
    expect(relay.marks.at(-1)?.isFinal).toBe(true);

    const fourHundred = splitCapturePlan({
      distance: 400,
      course: "SCY",
      isRelay: true,
    });
    expect(distances(fourHundred)).toEqual([100, 200, 300, 400]);
  });

  it("returns no relay marks when leg count is below 1", () => {
    expect(
      splitCapturePlan({
        distance: 200,
        course: "SCY",
        isRelay: true,
        relayLegCount: 0,
      }),
    ).toEqual({ interval: 0, marks: [] });
  });
});

describe("splitCaptureStrokeHint", () => {
  it("returns null for free events and free relays", () => {
    expect(
      splitCaptureStrokeHint({
        stroke: "free",
        distance: 200,
        cumulativeDistance: 50,
        interval: 50,
      }),
    ).toBeNull();
    expect(
      splitCaptureStrokeHint({
        stroke: "free_relay",
        distance: 200,
        cumulativeDistance: 50,
        interval: 50,
        isRelay: true,
        relayLegOrder: 1,
      }),
    ).toBeNull();
  });

  it("labels 200 IM 50s as fly, back, breast, free", () => {
    const plan = splitCapturePlan({ distance: 200, course: "SCY" });
    expect(
      plan.marks.map((mark) =>
        formatSplitCaptureLabel(
          mark.cumulativeDistance,
          splitCaptureStrokeHint({
            stroke: "im",
            distance: 200,
            cumulativeDistance: mark.cumulativeDistance,
            interval: plan.interval,
          }),
        ),
      ),
    ).toEqual(["50 (Fly)", "100 (Back)", "150 (Breast)", "200 (Free)"]);
  });

  it("repeats each stroke across two 50s in a 400 IM", () => {
    expect(
      splitCaptureStrokeHint({
        stroke: "im",
        distance: 400,
        cumulativeDistance: 50,
        interval: 50,
      }),
    ).toBe("Fly");
    expect(
      splitCaptureStrokeHint({
        stroke: "im",
        distance: 400,
        cumulativeDistance: 100,
        interval: 50,
      }),
    ).toBe("Fly");
    expect(
      splitCaptureStrokeHint({
        stroke: "im",
        distance: 400,
        cumulativeDistance: 150,
        interval: 50,
      }),
    ).toBe("Back");
    expect(
      splitCaptureStrokeHint({
        stroke: "im",
        distance: 400,
        cumulativeDistance: 400,
        interval: 50,
      }),
    ).toBe("Free");
  });

  it("combines strokes when a 100 IM is captured in 50s", () => {
    expect(
      splitCaptureStrokeHint({
        stroke: "im",
        distance: 100,
        cumulativeDistance: 50,
        interval: 50,
      }),
    ).toBe("Fly/Back");
    expect(
      splitCaptureStrokeHint({
        stroke: "im",
        distance: 100,
        cumulativeDistance: 100,
        interval: 50,
      }),
    ).toBe("Breast/Free");
  });

  it("labels medley relay racing legs and skips alts", () => {
    expect(
      splitCaptureStrokeHint({
        stroke: "medley_relay",
        distance: 200,
        cumulativeDistance: 50,
        interval: 50,
        isRelay: true,
      }),
    ).toBe("Back");
    expect(
      splitCaptureStrokeHint({
        stroke: "medley_relay",
        distance: 200,
        cumulativeDistance: 150,
        interval: 50,
        isRelay: true,
        relayLegOrder: 3,
      }),
    ).toBe("Fly");
    expect(
      splitCaptureStrokeHint({
        stroke: "medley_relay",
        distance: 200,
        cumulativeDistance: 200,
        interval: 50,
        isRelay: true,
        relayLegOrder: 5,
      }),
    ).toBeNull();
  });

  it("returns null for invalid IM math and clamps stroke index", () => {
    expect(
      splitCaptureStrokeHint({
        stroke: "im",
        distance: 200,
        cumulativeDistance: 0,
        interval: 50,
      }),
    ).toBe("Fly");
    expect(
      splitCaptureStrokeHint({
        stroke: "im",
        distance: 200,
        cumulativeDistance: 10_000,
        interval: 50,
      }),
    ).toBe("Free");
    expect(
      splitCaptureStrokeHint({
        stroke: "im",
        distance: 0,
        cumulativeDistance: 50,
        interval: 50,
      }),
    ).toBeNull();
    expect(
      splitCaptureStrokeHint({
        stroke: "im",
        distance: 200,
        cumulativeDistance: 50,
        interval: 0,
      }),
    ).toBeNull();
  });

  it("formats labels with or without a stroke", () => {
    expect(formatSplitCaptureLabel(50, null)).toBe("50");
    expect(formatSplitCaptureLabel(50, "Fly")).toBe("50 (Fly)");
  });
});

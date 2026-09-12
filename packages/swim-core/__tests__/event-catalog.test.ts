import { describe, expect, it } from "vitest";
import { EVENT_CATALOG, getCatalogEvent } from "../src/event-catalog";

describe("EVENT_CATALOG", () => {
  it("contains individual and relay events", () => {
    expect(EVENT_CATALOG.length).toBeGreaterThan(0);
    expect(EVENT_CATALOG.some((e) => e.eventType === "individual")).toBe(true);
    expect(EVENT_CATALOG.some((e) => e.eventType === "relay")).toBe(true);
    expect(EVENT_CATALOG.some((e) => e.gender === "mixed")).toBe(true);
  });

  it("includes course-specific distance overrides", () => {
    expect(
      EVENT_CATALOG.some(
        (e) => e.course === "SCY" && e.stroke === "free" && e.distance === 1650,
      ),
    ).toBe(true);
    expect(
      EVENT_CATALOG.some(
        (e) => e.course === "LCM" && e.stroke === "im" && e.distance === 200,
      ),
    ).toBe(true);
    expect(
      EVENT_CATALOG.some(
        (e) => e.stroke === "free_relay" && e.distance === 800,
      ),
    ).toBe(true);
  });
});

describe("getCatalogEvent", () => {
  it("finds events by key", () => {
    const event = getCatalogEvent("50_free_scy_m");
    expect(event).toBeDefined();
    expect(event?.label).toBe("50 Freestyle");
    expect(getCatalogEvent("missing_key")).toBeUndefined();
  });
});

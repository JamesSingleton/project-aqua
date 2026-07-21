import { describe, expect, it } from "vitest";
import {
  attendanceStatusSchema,
  createMeetSchema,
  meetCommitmentStatusSchema,
  meetEntryRowSchema,
  meetEntryStatusSchema,
  normalizeCreateSwimmerFormValues,
  rosterRowSchema,
  rsvpStatusSchema,
} from "../src/validators";

const adultBase = {
  firstName: "Alex",
  lastName: "Rivera",
  dateOfBirth: "1990-01-01",
  gender: "male" as const,
};

describe("rosterRowSchema", () => {
  it("accepts valid adult swimmer", () => {
    expect(rosterRowSchema.safeParse(adultBase).success).toBe(true);
  });

  it("requires parent info for minor without link", () => {
    const result = rosterRowSchema.safeParse({
      ...adultBase,
      dateOfBirth: "2015-01-01",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("Parent/guardian");
    }
  });

  it("rejects member id when linking existing swimmer", () => {
    const result = rosterRowSchema.safeParse({
      ...adultBase,
      governingBodyId: "123",
      linkExistingSwimmerId: "swimmer-1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("Cannot link");
    }
  });

  it("rejects usaMemberId when linking existing swimmer", () => {
    const result = rosterRowSchema.safeParse({
      ...adultBase,
      usaMemberId: "123",
      linkExistingSwimmerId: "swimmer-1",
    });
    expect(result.success).toBe(false);
  });

  it("allows minor with parent contact info", () => {
    expect(
      rosterRowSchema.safeParse({
        ...adultBase,
        dateOfBirth: "2015-01-01",
        contacts: {
          parentName: "Parent Name",
          parentEmail: "parent@example.com",
        },
      }).success,
    ).toBe(true);
  });

  it("allows minor with linkExistingSwimmerId without parent", () => {
    expect(
      rosterRowSchema.safeParse({
        ...adultBase,
        dateOfBirth: "2015-01-01",
        linkExistingSwimmerId: "swimmer-1",
      }).success,
    ).toBe(true);
  });
});

describe("normalizeCreateSwimmerFormValues", () => {
  it("trims empties and drops empty contact/medical blocks", () => {
    const normalized = normalizeCreateSwimmerFormValues({
      ...adultBase,
      middleName: "  ",
      preferredName: "Al",
      email: "",
      phone: " 555 ",
      contacts: {
        parentName: "  ",
        parentEmail: "",
      },
      medical: {
        notes: "  ",
      },
    });

    expect(normalized.middleName).toBeUndefined();
    expect(normalized.preferredName).toBe("Al");
    expect(normalized.email).toBeUndefined();
    expect(normalized.phone).toBe("555");
    expect(normalized.contacts).toBeUndefined();
    expect(normalized.medical).toBeUndefined();
  });

  it("leaves contacts undefined when omitted", () => {
    const normalized = normalizeCreateSwimmerFormValues({
      ...adultBase,
      preferredName: "Al",
    });
    expect(normalized.contacts).toBeUndefined();
    expect(normalized.medical).toBeUndefined();
  });

  it("keeps medical block when notes are present", () => {
    const normalized = normalizeCreateSwimmerFormValues({
      ...adultBase,
      medical: {
        notes: "Asthma",
      },
    });
    expect(normalized.medical?.notes).toBe("Asthma");
  });

  it("keeps contacts when boolean consent is set", () => {
    const normalized = normalizeCreateSwimmerFormValues({
      ...adultBase,
      contacts: {
        minorDirectContactConsent: true,
      },
    });
    expect(normalized.contacts?.minorDirectContactConsent).toBe(true);
  });
});

describe("other schemas", () => {
  it("validates meet entry row", () => {
    expect(
      meetEntryRowSchema.safeParse({
        swimmerId: "550e8400-e29b-41d4-a716-446655440000",
        eventKey: "50_free_scy_m",
      }).success,
    ).toBe(true);
  });

  it("validates create meet schema", () => {
    expect(
      createMeetSchema.safeParse({
        name: "City Meet",
        startDate: "2026-03-01",
        course: "SCY",
      }).success,
    ).toBe(true);
  });

  it("parses status enums", () => {
    expect(attendanceStatusSchema.parse("present")).toBe("present");
    expect(rsvpStatusSchema.parse("attending")).toBe("attending");
    expect(meetCommitmentStatusSchema.parse("committed")).toBe("committed");
    expect(meetEntryStatusSchema.parse("approved")).toBe("approved");
  });
});

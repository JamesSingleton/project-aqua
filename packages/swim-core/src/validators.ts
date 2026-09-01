import { z } from "zod";
import { isMinorSwimmer } from "./age";
import { COURSES, EVENT_GENDERS, GENDERS } from "./events";

export const MANUAL_EVENT_STROKES = [
  "free",
  "back",
  "breast",
  "fly",
  "im",
  "free_relay",
  "medley_relay",
] as const;

export const swimmerContactsSchema = z.object({
  parentName: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal("")),
  parentPhone: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  minorDirectContactConsent: z.boolean().optional(),
  minorDirectContactConsentedBy: z.string().optional(),
});

export const swimmerMedicalSchema = z.object({
  allergies: z.string().optional(),
  medications: z.string().optional(),
  conditions: z.string().optional(),
  notes: z.string().optional(),
});

export const rosterRowSchema = z
  .object({
    firstName: z.string().min(1),
    middleName: z.string().optional(),
    lastName: z.string().min(1),
    preferredName: z.string().optional(),
    dateOfBirth: z.string().min(1),
    gender: z.enum(GENDERS),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    practiceGroup: z.string().optional(),
    trainingGroups: z.array(z.string()).optional(),
    classYear: z.enum(["FR", "SO", "JR", "SR"]).optional(),
    usaMemberId: z.string().optional(),
    governingBodyId: z.string().optional(),
    contacts: swimmerContactsSchema.optional(),
    medical: swimmerMedicalSchema.optional(),
    linkExistingSwimmerId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const memberId = data.governingBodyId ?? data.usaMemberId;
    if (isMinorSwimmer(data.dateOfBirth) && !data.linkExistingSwimmerId) {
      const parentEmail = data.contacts?.parentEmail;
      const parentName = data.contacts?.parentName;
      if (!parentEmail || !parentName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Parent/guardian name and email are required for minor swimmers",
          path: ["contacts", "parentEmail"],
        });
      }
    }
    if (memberId && data.linkExistingSwimmerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cannot link existing swimmer and provide a new member ID",
      });
    }
  });

export type RosterRow = z.infer<typeof rosterRowSchema>;
export type SwimmerContactsInput = z.infer<typeof swimmerContactsSchema>;
export type SwimmerMedicalInput = z.infer<typeof swimmerMedicalSchema>;

function emptyToUndefined(value: string | undefined) {
  return value?.trim() ? value.trim() : undefined;
}

function hasStringValues(
  record: Record<string, string | boolean | undefined> | undefined,
) {
  if (!record) return false;
  return Object.values(record).some((value) => {
    if (typeof value === "boolean") return value;
    return Boolean(value?.trim());
  });
}

/** Trim empties and drop empty contact/medical blocks before persist. */
export function normalizeCreateSwimmerFormValues(values: RosterRow): RosterRow {
  const contacts = values.contacts
    ? {
        parentName: emptyToUndefined(values.contacts.parentName),
        parentEmail: emptyToUndefined(values.contacts.parentEmail),
        parentPhone: emptyToUndefined(values.contacts.parentPhone),
        emergencyName: emptyToUndefined(values.contacts.emergencyName),
        emergencyPhone: emptyToUndefined(values.contacts.emergencyPhone),
        addressLine1: emptyToUndefined(values.contacts.addressLine1),
        addressLine2: emptyToUndefined(values.contacts.addressLine2),
        city: emptyToUndefined(values.contacts.city),
        state: emptyToUndefined(values.contacts.state),
        postalCode: emptyToUndefined(values.contacts.postalCode),
        country: emptyToUndefined(values.contacts.country),
        minorDirectContactConsent: values.contacts.minorDirectContactConsent,
        minorDirectContactConsentedBy: emptyToUndefined(
          values.contacts.minorDirectContactConsentedBy,
        ),
      }
    : undefined;

  const medical = values.medical
    ? {
        allergies: emptyToUndefined(values.medical.allergies),
        medications: emptyToUndefined(values.medical.medications),
        conditions: emptyToUndefined(values.medical.conditions),
        notes: emptyToUndefined(values.medical.notes),
      }
    : undefined;

  return {
    ...values,
    middleName: emptyToUndefined(values.middleName),
    preferredName: emptyToUndefined(values.preferredName),
    practiceGroup: emptyToUndefined(values.practiceGroup),
    usaMemberId: emptyToUndefined(values.usaMemberId),
    email: emptyToUndefined(values.email),
    phone: emptyToUndefined(values.phone),
    contacts: hasStringValues(contacts) ? contacts : undefined,
    medical: hasStringValues(medical) ? medical : undefined,
    linkExistingSwimmerId: emptyToUndefined(values.linkExistingSwimmerId),
  };
}

export const meetEntryRowSchema = z.object({
  swimmerId: z.string().uuid(),
  eventKey: z.string().min(1),
  seedTime: z.string().optional(),
  entryNotes: z.string().optional(),
});

export type MeetEntryRow = z.infer<typeof meetEntryRowSchema>;

export const createMeetSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  /** Host entry deadline (YYYY-MM-DD). Empty clears. */
  entryDeadline: z.string().optional(),
  course: z.enum(COURSES),
  location: z.string().optional(),
  address: z.string().optional(),
});

export type CreateMeetInput = z.infer<typeof createMeetSchema>;

export const attendanceStatusSchema = z.enum([
  "present",
  "absent",
  "excused",
  "late",
]);

export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

export const rsvpStatusSchema = z.enum([
  "unknown",
  "attending",
  "absent",
  "maybe",
]);

export type RsvpStatus = z.infer<typeof rsvpStatusSchema>;

export const meetCommitmentStatusSchema = z.enum([
  "pending",
  "committed",
  "declined",
  "not_going",
  "not_eligible",
]);

export type MeetCommitmentStatus = z.infer<typeof meetCommitmentStatusSchema>;

/** Statuses coaches set to exclude a swimmer from meet entries / export. */
export const meetAttendanceStatusSchema = z.enum(["not_going", "not_eligible"]);

export type MeetAttendanceStatus = z.infer<typeof meetAttendanceStatusSchema>;

export const meetEntryStatusSchema = z.enum(["draft", "approved", "scratched"]);

export type MeetEntryStatus = z.infer<typeof meetEntryStatusSchema>;

export const manualMeetEventSchema = z.object({
  eventNumber: z.coerce.number().int().positive(),
  stroke: z.enum(MANUAL_EVENT_STROKES),
  distance: z.coerce.number().int().nonnegative(),
  gender: z.enum(EVENT_GENDERS),
  ageGroup: z.string().optional(),
  qualifyingTime: z.string().optional(),
});

export type ManualMeetEventInput = z.infer<typeof manualMeetEventSchema>;

export const meetEventTemplateNameSchema = z
  .string()
  .trim()
  .min(1, "Template name is required")
  .max(80);

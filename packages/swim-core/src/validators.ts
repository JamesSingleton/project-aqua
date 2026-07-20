import { z } from "zod";
import { isMinorSwimmer } from "./age";
import { COURSES, GENDERS } from "./events";

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
]);

export type MeetCommitmentStatus = z.infer<typeof meetCommitmentStatusSchema>;

export const meetEntryStatusSchema = z.enum(["draft", "approved", "scratched"]);

export type MeetEntryStatus = z.infer<typeof meetEntryStatusSchema>;

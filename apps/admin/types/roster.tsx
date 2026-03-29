// app/team/[teamId]/roster/_types/roster.ts
// Shared types across all roster pages.

export type Gender = "M" | "F" | "X" | "U";
export type CourseCode = "Y" | "S" | "L";
export type CoachRole =
  | "head_coach"
  | "assistant_coach"
  | "volunteer"
  | "admin";

export const GENDER_LABEL: Record<Gender, string> = {
  M: "Male",
  F: "Female",
  X: "Non-binary",
  U: "Unknown",
};

export const COURSE_LABEL: Record<CourseCode, string> = {
  Y: "SCY",
  S: "SCM",
  L: "LCM",
};

export const COACH_ROLE_LABEL: Record<CoachRole, string> = {
  head_coach: "Head Coach",
  assistant_coach: "Assistant Coach",
  volunteer: "Volunteer",
  admin: "Admin",
};

export interface Athlete {
  active: boolean;
  age: number;
  birthDate: string; // ISO YYYY-MM-DD
  displayName: string; // "Last, First"
  firstName: string;
  gender: Gender;
  group: string; // e.g. "Senior", "Junior A", "10 & Under"
  id: string;
  joinedAt: string; // ISO date
  lastName: string;
  preferredStroke?: string;
  usaSwimmingId?: string;
}

export interface Coach {
  active: boolean;
  certStatus: "current" | "expiring_soon" | "expired" | "unknown";
  displayName: string;
  email: string;
  firstName: string;
  groups: string[]; // which groups they coach
  id: string;
  joinedAt: string;
  lastName: string;
  phone?: string;
  role: CoachRole;
  usaSwimmingCertExpiry?: string; // ISO date
}

export interface RosterGroup {
  athleteCount: number;
  coach: string; // primary coach name
  femaleCount: number;
  maleCount: number;
  name: string;
}

export interface RosterStats {
  activeAthletes: number;
  femaleCount: number;
  groupCount: number;
  maleCount: number;
  totalAthletes: number;
  totalCoaches: number;
}

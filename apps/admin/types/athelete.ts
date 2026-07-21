export interface PersonalRecord {
  event: string;
  time: string;
}

export interface BaseContact {
  name: string;
  phone_number: string;
}

interface Parent extends BaseContact {
  email: string;
}

interface EmergencyContact extends BaseContact {
  relationship: string;
}

export interface Athlete {
  id: string;
  membershipId: string;
  enrollmentId?: string;
  seasonId?: string;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  /** Display name for sheets / detail views */
  name: string;
  gender: "Male" | "Female";
  age: number;
  dateOfBirth: string;
  trainingGroup: string;
  trainingGroups: string[];
  practiceGroup: string;
  groupId?: string | null;
  classYear?: string | null;
  academicStanding?: string | null;
  eligibilityStatus?: string | null;
  seasonsOfCompetitionUsed?: number | null;
  eligibilityNotes?: string | null;
  usaId?: string | null;
  status: string;
  personalRecords: PersonalRecord[];
  parents: Parent[];
  emergencyContacts: EmergencyContact[];
}

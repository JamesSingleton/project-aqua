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
  name: string;
  gender: "Male" | "Female";
  age: number;
  dateOfBirth: string;
  trainingGroups: string[];
  practiceGroup: string;
  personalRecords: PersonalRecord[];
  parents: Parent[];
  emergencyContacts: EmergencyContact[];
}

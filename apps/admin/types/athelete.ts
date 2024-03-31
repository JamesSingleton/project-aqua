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
  gender: string;
  age: number;
  date_of_birth: string;
  training_groups: string[];
  practice_group: string;
  personal_records: PersonalRecord[];
  parents: Parent[];
  emergency_contacts: EmergencyContact[];
}

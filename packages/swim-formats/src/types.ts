export interface ParsedMeet {
  name: string;
  startDate?: string;
  course: "SCY" | "SCM" | "LCM";
  location?: string;
  events: ParsedEvent[];
  entries: ParsedEntry[];
  results: ParsedResult[];
}

export interface ParsedEvent {
  eventNumber?: number;
  stroke: string;
  distance: number;
  gender: string;
  ageGroup?: string;
  eventKey: string;
}

export interface ParsedEntry {
  eventNumber?: number;
  swimmerName: string;
  seedTime?: string;
  usaMemberId?: string;
}

export interface ParsedResult {
  eventNumber?: number;
  swimmerName: string;
  time: string;
  place?: number;
  isDq?: boolean;
}

export interface ParsedRosterRow {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female";
  practiceGroup?: string;
  usaMemberId?: string;
}

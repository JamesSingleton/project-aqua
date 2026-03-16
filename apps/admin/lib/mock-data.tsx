// ---
// Types
// ---

interface UpcomingMeet {
  date: string;
  deadlineUrgency: "ok" | "soon" | "urgent";
  entriesSubmitted: number;
  entriesTotal: number;
  entryDeadline: string;
  id: string;
  location: string;
  name: string;
}

interface RecentDrop {
  athleteName: string;
  date: string;
  dropSeconds: number;
  event: string;
  id: string;
  newTime: string;
  previousTime: string;
}

interface ActionItem {
  description: string;
  href: string;
  id: string;
  title: string;
  type: "entry_deadline" | "missing_times" | "import_needed" | "attendance";
  urgency: "high" | "medium" | "low";
}

interface AttendanceSummary {
  date: string;
  present: number;
  total: number;
}

// ---
// Mock data (replace with real queries)
// ---

export const upcomingMeets: UpcomingMeet[] = [
  {
    id: "1",
    name: "Desert Classic Invitational",
    date: "Mar 22, 2026",
    location: "Peoria Aquatic Center",
    entriesSubmitted: 18,
    entriesTotal: 24,
    entryDeadline: "Mar 18, 2026",
    deadlineUrgency: "urgent",
  },
  {
    id: "2",
    name: "AIA 5A State Championship",
    date: "Apr 11, 2026",
    location: "Skyline Aquatic Center, Mesa",
    entriesSubmitted: 0,
    entriesTotal: 24,
    entryDeadline: "Apr 1, 2026",
    deadlineUrgency: "soon",
  },
  {
    id: "3",
    name: "Maricopa Dual vs. Casa Grande",
    date: "Mar 28, 2026",
    location: "Copper Sky Aquatic Center",
    entriesSubmitted: 24,
    entriesTotal: 24,
    entryDeadline: "Mar 25, 2026",
    deadlineUrgency: "ok",
  },
];

export const recentDrops: RecentDrop[] = [
  {
    id: "1",
    athleteName: "Jordan Alvarez",
    event: "200 Free",
    previousTime: "1:58.42",
    newTime: "1:55.87",
    dropSeconds: 2.55,
    date: "Mar 14",
  },
  {
    id: "2",
    athleteName: "Maya Chen",
    event: "100 Fly",
    previousTime: "1:02.18",
    newTime: "1:01.04",
    dropSeconds: 1.14,
    date: "Mar 14",
  },
  {
    id: "3",
    athleteName: "Tyler Brooks",
    event: "500 Free",
    previousTime: "5:12.33",
    newTime: "5:09.01",
    dropSeconds: 3.32,
    date: "Mar 13",
  },
  {
    id: "4",
    athleteName: "Sofia Reyes",
    event: "100 Back",
    previousTime: "1:05.90",
    newTime: "1:04.22",
    dropSeconds: 1.68,
    date: "Mar 12",
  },
  {
    id: "5",
    athleteName: "Ethan Park",
    event: "200 IM",
    previousTime: "2:18.44",
    newTime: "2:15.99",
    dropSeconds: 2.45,
    date: "Mar 12",
  },
];

export const actionItems: ActionItem[] = [
  {
    id: "1",
    type: "entry_deadline",
    title: "Desert Classic entries due in 3 days",
    description: "6 athletes still need event assignments",
    urgency: "high",
    href: "/meets/entries",
  },
  {
    id: "2",
    type: "missing_times",
    title: "4 athletes missing seed times",
    description: "Required for State Championship entries",
    urgency: "high",
    href: "/times/personal-bests",
  },
  {
    id: "3",
    type: "import_needed",
    title: "State meet package available",
    description: "Import .ev3 file to set up event list",
    urgency: "medium",
    href: "/roster/import",
  },
  {
    id: "4",
    type: "attendance",
    title: "3 athletes missed 5+ practices",
    description: "May affect eligibility for State",
    urgency: "medium",
    href: "/practice/attendance",
  },
];

export const attendanceThisWeek: AttendanceSummary[] = [
  { date: "Mon", present: 21, total: 24 },
  { date: "Tue", present: 19, total: 24 },
  { date: "Wed", present: 23, total: 24 },
  { date: "Thu", present: 20, total: 24 },
  { date: "Fri", present: 22, total: 24 },
];

export const mockAthleteData: Athlete[] = [
  {
    id: "a1b2c3",
    name: "Emily Johnson",
    gender: "Female",
    age: 16,
    dateOfBirth: "2008-05-12",
    trainingGroups: ["Junior Squad", "Freestyle Masters", "Butterfly Training"],
    practiceGroup: "Group A",
    personalRecords: [
      { event: "50 Free", time: "26.45" },
      { event: "100 Breaststroke", time: "1:15.78" },
      { event: "200 Butterfly", time: "2:15.76" },
      { event: "4x100 Freestyle Relay", time: "3:52.34" },
      { event: "200 Individual Medley", time: "2:25.67" },
    ],
    parents: [
      {
        name: "John Johnson",
        email: "john@example.com",
        phone_number: "123-456-7890",
      },
      {
        name: "Jane Johnson",
        email: "jane@example.com",
        phone_number: "987-654-3210",
      },
    ],
    emergencyContacts: [
      {
        name: "Sarah Smith",
        relationship: "Aunt",
        phone_number: "456-789-0123",
      },
      {
        name: "David Johnson",
        relationship: "Uncle",
        phone_number: "789-012-3456",
      },
    ],
  },
  {
    id: "d4e5f6",
    name: "Michael Smith",
    gender: "Male",
    age: 18,
    dateOfBirth: "2006-09-23",
    trainingGroups: ["Senior Squad", "Backstroke Champions"],
    practiceGroup: "Group B",
    personalRecords: [
      { event: "200 Backstroke", time: "2:20.34" },
      { event: "50 Backstroke", time: "30.21" },
      { event: "100 Backstroke", time: "1:05.76" },
      { event: "4x100 Medley Relay", time: "4:05.89" },
      { event: "400 Individual Medley", time: "5:10.45" },
    ],
    parents: [
      {
        name: "Robert Smith",
        email: "robert@example.com",
        phone_number: "111-222-3333",
      },
      {
        name: "Jessica Smith",
        email: "jessica@example.com",
        phone_number: "444-555-6666",
      },
    ],
    emergencyContacts: [
      {
        name: "Alice Jones",
        relationship: "Grandmother",
        phone_number: "777-888-9999",
      },
      {
        name: "Tom Smith",
        relationship: "Cousin",
        phone_number: "222-333-4444",
      },
    ],
  },
  {
    id: "g7h8i9",
    name: "Sophia Nguyen",
    gender: "Female",
    age: 14,
    dateOfBirth: "2010-03-08",
    trainingGroups: ["Development Squad", "Breaststroke Prospects"],
    practiceGroup: "Group C",
    personalRecords: [
      { event: "200 Breaststroke", time: "2:45.78" },
      { event: "100 Breaststroke", time: "1:16.45" },
      { event: "50 Breaststroke", time: "34.89" },
      { event: "4x100 Medley Relay", time: "4:20.56" },
      { event: "200 Individual Medley", time: "2:35.21" },
    ],
    parents: [
      {
        name: "David Nguyen",
        email: "david@example.com",
        phone_number: "555-666-7777",
      },
      {
        name: "Linda Nguyen",
        email: "linda@example.com",
        phone_number: "888-999-0000",
      },
    ],
    emergencyContacts: [
      {
        name: "Mark Nguyen",
        relationship: "Uncle",
        phone_number: "111-222-3333",
      },
      {
        name: "Anna Nguyen",
        relationship: "Aunt",
        phone_number: "444-555-6666",
      },
    ],
  },
  {
    id: "j0k1l2",
    name: "James Wilson",
    gender: "Male",
    age: 15,
    dateOfBirth: "2009-11-15",
    trainingGroups: ["Junior Squad", "Freestyle Masters"],
    practiceGroup: "Group A",
    personalRecords: [
      { event: "50 Free", time: "25.98" },
      { event: "100 Free", time: "56.34" },
      { event: "200 Free", time: "2:03.21" },
      { event: "4x100 Freestyle Relay", time: "3:45.67" },
      { event: "400 Individual Medley", time: "5:20.98" },
    ],
    parents: [
      {
        name: "Michael Wilson",
        email: "michael@example.com",
        phone_number: "222-333-4444",
      },
      {
        name: "Sarah Wilson",
        email: "sarah@example.com",
        phone_number: "555-666-7777",
      },
    ],
    emergencyContacts: [
      {
        name: "Emily Wilson",
        relationship: "Sister",
        phone_number: "888-999-0000",
      },
      {
        name: "Robert Wilson",
        relationship: "Grandfather",
        phone_number: "111-222-3333",
      },
    ],
  },
  {
    id: "m3n4o5",
    name: "Emma Thompson",
    gender: "Female",
    age: 17,
    dateOfBirth: "2007-07-19",
    trainingGroups: ["Senior Squad", "Butterfly Training"],
    practiceGroup: "Group B",
    personalRecords: [
      { event: "50 Butterfly", time: "27.45" },
      { event: "100 Butterfly", time: "1:00.12" },
      { event: "200 Butterfly", time: "2:15.76" },
      { event: "4x100 Medley Relay", time: "4:10.23" },
      { event: "200 Individual Medley", time: "2:30.45" },
    ],
    parents: [
      {
        name: "John Thompson",
        email: "john@example.com",
        phone_number: "111-222-3333",
      },
      {
        name: "Mary Thompson",
        email: "mary@example.com",
        phone_number: "444-555-6666",
      },
    ],
    emergencyContacts: [
      {
        name: "Anna Thompson",
        relationship: "Sister",
        phone_number: "777-888-9999",
      },
      {
        name: "Mark Thompson",
        relationship: "Brother",
        phone_number: "222-333-4444",
      },
    ],
  },
  {
    id: "p6q7r8",
    name: "Daniel Brown",
    gender: "Male",
    age: 13,
    dateOfBirth: "2011-02-28",
    trainingGroups: ["Development Squad", "Backstroke Champions"],
    practiceGroup: "Group C",
    personalRecords: [
      { event: "50 Backstroke", time: "32.87" },
      { event: "100 Backstroke", time: "1:10.45" },
      { event: "200 Backstroke", time: "2:35.21" },
      { event: "4x100 Freestyle Relay", time: "4:05.34" },
      { event: "400 Individual Medley", time: "5:40.12" },
    ],
    parents: [
      {
        name: "Michael Brown",
        email: "michael@example.com",
        phone_number: "333-444-5555",
      },
      {
        name: "Jennifer Brown",
        email: "jennifer@example.com",
        phone_number: "666-777-8888",
      },
    ],
    emergencyContacts: [
      {
        name: "Jessica Brown",
        relationship: "Sister",
        phone_number: "999-000-1111",
      },
      {
        name: "David Brown",
        relationship: "Brother",
        phone_number: "222-333-4444",
      },
    ],
  },
  {
    id: "s9t0u1",
    name: "Olivia Davis",
    gender: "Female",
    age: 19,
    dateOfBirth: "2005-12-03",
    trainingGroups: ["Senior Squad", "Breaststroke Prospects"],
    practiceGroup: "Group A",
    personalRecords: [
      { event: "50 Breaststroke", time: "33.56" },
      { event: "100 Breaststroke", time: "1:15.78" },
      { event: "200 Breaststroke", time: "2:40.12" },
      { event: "4x100 Freestyle Relay", time: "3:50.89" },
      { event: "200 Individual Medley", time: "2:32.76" },
    ],
    parents: [
      {
        name: "Thomas Davis",
        email: "thomas@example.com",
        phone_number: "777-888-9999",
      },
      {
        name: "Elizabeth Davis",
        email: "elizabeth@example.com",
        phone_number: "111-222-3333",
      },
    ],
    emergencyContacts: [
      {
        name: "Peter Davis",
        relationship: "Brother",
        phone_number: "444-555-6666",
      },
      {
        name: "Karen Davis",
        relationship: "Sister",
        phone_number: "555-666-7777",
      },
    ],
  },
  {
    id: "v2w3x4",
    name: "Ethan Miller",
    gender: "Male",
    age: 16,
    dateOfBirth: "2008-04-27",
    trainingGroups: ["Junior Squad", "Freestyle Masters"],
    practiceGroup: "Group B",
    personalRecords: [
      { event: "50 Free", time: "24.76" },
      { event: "100 Free", time: "53.21" },
      { event: "200 Free", time: "1:57.89" },
      { event: "4x100 Medley Relay", time: "3:58.45" },
      { event: "200 Individual Medley", time: "2:18.34" },
    ],
    parents: [
      {
        name: "Andrew Miller",
        email: "andrew@example.com",
        phone_number: "888-999-0000",
      },
      {
        name: "Melissa Miller",
        email: "melissa@example.com",
        phone_number: "222-333-4444",
      },
    ],
    emergencyContacts: [
      {
        name: "Steven Miller",
        relationship: "Brother",
        phone_number: "111-222-3333",
      },
      {
        name: "Michelle Miller",
        relationship: "Sister",
        phone_number: "444-555-6666",
      },
    ],
  },
  {
    id: "y5z6a7",
    name: "Lily Martinez",
    gender: "Female",
    age: 12,
    dateOfBirth: "2012-08-14",
    trainingGroups: ["Development Squad", "Breaststroke Prospects"],
    practiceGroup: "Group C",
    personalRecords: [
      { event: "50 Breaststroke", time: "36.12" },
      { event: "100 Breaststroke", time: "1:19.34" },
      { event: "200 Breaststroke", time: "2:52.45" },
      { event: "4x100 Medley Relay", time: "4:25.67" },
      { event: "200 Individual Medley", time: "2:45.89" },
    ],
    parents: [
      {
        name: "Carlos Martinez",
        email: "carlos@example.com",
        phone_number: "666-777-8888",
      },
      {
        name: "Maria Martinez",
        email: "maria@example.com",
        phone_number: "999-000-1111",
      },
    ],
    emergencyContacts: [
      {
        name: "Jose Martinez",
        relationship: "Brother",
        phone_number: "777-888-9999",
      },
      {
        name: "Ana Martinez",
        relationship: "Sister",
        phone_number: "222-333-4444",
      },
    ],
  },
  {
    id: "b8c9d0",
    name: "Noah White",
    gender: "Male",
    age: 14,
    dateOfBirth: "2010-06-20",
    trainingGroups: ["Junior Squad", "Backstroke Champions"],
    practiceGroup: "Group A",
    personalRecords: [
      { event: "50 Backstroke", time: "29.45" },
      { event: "100 Backstroke", time: "1:03.89" },
      { event: "200 Backstroke", time: "2:25.67" },
      { event: "4x100 Freestyle Relay", time: "3:55.12" },
      { event: "200 Individual Medley", time: "2:35.76" },
    ],
    parents: [
      {
        name: "Matthew White",
        email: "matthew@example.com",
        phone_number: "555-666-7777",
      },
      {
        name: "Rachel White",
        email: "rachel@example.com",
        phone_number: "777-888-9999",
      },
    ],
    emergencyContacts: [
      {
        name: "Christopher White",
        relationship: "Brother",
        phone_number: "888-999-0000",
      },
      {
        name: "Jessica White",
        relationship: "Sister",
        phone_number: "111-222-3333",
      },
    ],
  },
];

export const mockTeams = [
  {
    id: "a55773d4-f2c0-4b17-b36a-1f69f4a361d1",
    name: "Team A",
    logo: (
      <svg
        height="50"
        viewBox="0 0 24 24"
        width="50"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" fill="blue" r="10" />
      </svg>
    ),
  },
  {
    id: "7d13f58d-8a1e-4e7d-89d6-bb8a16881e9b",
    name: "Team B",
    logo: (
      <svg
        height="50"
        viewBox="0 0 24 24"
        width="50"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect fill="green" height="24" width="24" />
      </svg>
    ),
  },
  {
    id: "ef7d4b7c-08b9-4e13-9f9e-0450a19b6054",
    name: "Team C",
    logo: (
      <svg
        height="50"
        viewBox="0 0 24 24"
        width="50"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"
          fill="orange"
        />
      </svg>
    ),
  },
];

// app/team/[teamId]/roster/_lib/mock-data.ts
// Replace all of this with real Supabase queries.

import type {
  Athlete,
  Coach,
  RosterGroup,
  RosterStats,
} from "../_types/roster";

export const MOCK_ATHLETES: Athlete[] = [
  {
    id: "1",
    firstName: "Jordan",
    lastName: "Alvarez",
    displayName: "Alvarez, Jordan",
    gender: "M",
    birthDate: "2010-03-14",
    age: 16,
    group: "Senior",
    preferredStroke: "Freestyle",
    usaSwimmingId: "123456A",
    active: true,
    joinedAt: "2021-09-01",
  },
  {
    id: "2",
    firstName: "Maya",
    lastName: "Chen",
    displayName: "Chen, Maya",
    gender: "F",
    birthDate: "2009-07-22",
    age: 16,
    group: "Senior",
    preferredStroke: "Butterfly",
    usaSwimmingId: "234567B",
    active: true,
    joinedAt: "2020-08-15",
  },
  {
    id: "3",
    firstName: "Tyler",
    lastName: "Brooks",
    displayName: "Brooks, Tyler",
    gender: "M",
    birthDate: "2011-01-09",
    age: 15,
    group: "Junior A",
    preferredStroke: "Freestyle",
    usaSwimmingId: "345678C",
    active: true,
    joinedAt: "2022-09-01",
  },
  {
    id: "4",
    firstName: "Sofia",
    lastName: "Reyes",
    displayName: "Reyes, Sofia",
    gender: "F",
    birthDate: "2010-11-30",
    age: 15,
    group: "Junior A",
    preferredStroke: "Backstroke",
    usaSwimmingId: "456789D",
    active: true,
    joinedAt: "2021-09-01",
  },
  {
    id: "5",
    firstName: "Ethan",
    lastName: "Park",
    displayName: "Park, Ethan",
    gender: "M",
    birthDate: "2008-05-18",
    age: 17,
    group: "Senior",
    preferredStroke: "IM",
    usaSwimmingId: "567890E",
    active: true,
    joinedAt: "2019-09-01",
  },
  {
    id: "6",
    firstName: "Chloe",
    lastName: "Martinez",
    displayName: "Martinez, Chloe",
    gender: "F",
    birthDate: "2012-08-03",
    age: 13,
    group: "Junior B",
    preferredStroke: "Breaststroke",
    active: true,
    joinedAt: "2023-09-01",
  },
  {
    id: "7",
    firstName: "Liam",
    lastName: "Thompson",
    displayName: "Thompson, Liam",
    gender: "M",
    birthDate: "2013-02-14",
    age: 13,
    group: "Junior B",
    preferredStroke: "Backstroke",
    active: true,
    joinedAt: "2023-01-10",
  },
  {
    id: "8",
    firstName: "Aisha",
    lastName: "Johnson",
    displayName: "Johnson, Aisha",
    gender: "F",
    birthDate: "2014-06-25",
    age: 11,
    group: "10 & Under",
    active: true,
    joinedAt: "2024-01-15",
  },
  {
    id: "9",
    firstName: "Noah",
    lastName: "Garcia",
    displayName: "Garcia, Noah",
    gender: "M",
    birthDate: "2015-09-12",
    age: 10,
    group: "10 & Under",
    active: true,
    joinedAt: "2024-09-01",
  },
  {
    id: "10",
    firstName: "Emma",
    lastName: "Wilson",
    displayName: "Wilson, Emma",
    gender: "F",
    birthDate: "2009-12-01",
    age: 16,
    group: "Senior",
    preferredStroke: "Freestyle",
    usaSwimmingId: "678901F",
    active: true,
    joinedAt: "2020-09-01",
  },
  {
    id: "11",
    firstName: "Lucas",
    lastName: "Davis",
    displayName: "Davis, Lucas",
    gender: "M",
    birthDate: "2011-04-17",
    age: 14,
    group: "Junior A",
    active: true,
    joinedAt: "2022-09-01",
  },
  {
    id: "12",
    firstName: "Olivia",
    lastName: "Kim",
    displayName: "Kim, Olivia",
    gender: "F",
    birthDate: "2012-10-08",
    age: 13,
    group: "Junior B",
    preferredStroke: "Butterfly",
    active: true,
    joinedAt: "2023-09-01",
  },
  {
    id: "13",
    firstName: "Mason",
    lastName: "Lee",
    displayName: "Lee, Mason",
    gender: "M",
    birthDate: "2008-01-23",
    age: 18,
    group: "Senior",
    preferredStroke: "Backstroke",
    usaSwimmingId: "789012G",
    active: false,
    joinedAt: "2018-09-01",
  },
  {
    id: "14",
    firstName: "Isabella",
    lastName: "White",
    displayName: "White, Isabella",
    gender: "F",
    birthDate: "2013-07-14",
    age: 12,
    group: "Junior B",
    active: true,
    joinedAt: "2023-09-01",
  },
  {
    id: "15",
    firstName: "Jackson",
    lastName: "Harris",
    displayName: "Harris, Jackson",
    gender: "M",
    birthDate: "2014-03-30",
    age: 11,
    group: "10 & Under",
    active: true,
    joinedAt: "2024-09-01",
  },
  {
    id: "16",
    firstName: "Ava",
    lastName: "Clark",
    displayName: "Clark, Ava",
    gender: "F",
    birthDate: "2010-09-05",
    age: 15,
    group: "Junior A",
    preferredStroke: "IM",
    usaSwimmingId: "890123H",
    active: true,
    joinedAt: "2021-09-01",
  },
  {
    id: "17",
    firstName: "Elijah",
    lastName: "Lewis",
    displayName: "Lewis, Elijah",
    gender: "M",
    birthDate: "2009-11-11",
    age: 16,
    group: "Senior",
    preferredStroke: "Breaststroke",
    usaSwimmingId: "901234I",
    active: true,
    joinedAt: "2020-09-01",
  },
  {
    id: "18",
    firstName: "Mia",
    lastName: "Robinson",
    displayName: "Robinson, Mia",
    gender: "F",
    birthDate: "2015-04-22",
    age: 10,
    group: "10 & Under",
    active: true,
    joinedAt: "2024-01-15",
  },
  {
    id: "19",
    firstName: "Sebastian",
    lastName: "Walker",
    displayName: "Walker, Sebastian",
    gender: "M",
    birthDate: "2012-12-19",
    age: 13,
    group: "Junior B",
    active: true,
    joinedAt: "2023-09-01",
  },
  {
    id: "20",
    firstName: "Zoe",
    lastName: "Hall",
    displayName: "Hall, Zoe",
    gender: "F",
    birthDate: "2011-06-02",
    age: 14,
    group: "Junior A",
    preferredStroke: "Freestyle",
    active: true,
    joinedAt: "2022-09-01",
  },
  {
    id: "21",
    firstName: "Carter",
    lastName: "Young",
    displayName: "Young, Carter",
    gender: "M",
    birthDate: "2010-08-16",
    age: 15,
    group: "Junior A",
    preferredStroke: "Butterfly",
    usaSwimmingId: "012345J",
    active: true,
    joinedAt: "2021-09-01",
  },
  {
    id: "22",
    firstName: "Lily",
    lastName: "Allen",
    displayName: "Allen, Lily",
    gender: "F",
    birthDate: "2008-02-28",
    age: 18,
    group: "Senior",
    preferredStroke: "Freestyle",
    usaSwimmingId: "123456K",
    active: true,
    joinedAt: "2019-09-01",
  },
  {
    id: "23",
    firstName: "Dylan",
    lastName: "Scott",
    displayName: "Scott, Dylan",
    gender: "M",
    birthDate: "2013-10-07",
    age: 12,
    group: "Junior B",
    active: true,
    joinedAt: "2023-09-01",
  },
  {
    id: "24",
    firstName: "Nora",
    lastName: "Adams",
    displayName: "Adams, Nora",
    gender: "F",
    birthDate: "2014-01-18",
    age: 11,
    group: "10 & Under",
    active: true,
    joinedAt: "2024-09-01",
  },
];

export const MOCK_COACHES: Coach[] = [
  {
    id: "c1",
    firstName: "Sarah",
    lastName: "Mitchell",
    displayName: "Mitchell, Sarah",
    email: "s.mitchell@team.com",
    phone: "(480) 555-0101",
    role: "head_coach",
    groups: ["Senior", "Junior A"],
    usaSwimmingCertExpiry: "2026-08-01",
    certStatus: "current",
    active: true,
    joinedAt: "2018-06-01",
  },
  {
    id: "c2",
    firstName: "Marcus",
    lastName: "Rivera",
    displayName: "Rivera, Marcus",
    email: "m.rivera@team.com",
    phone: "(480) 555-0102",
    role: "assistant_coach",
    groups: ["Junior A", "Junior B"],
    usaSwimmingCertExpiry: "2025-06-15",
    certStatus: "expiring_soon",
    active: true,
    joinedAt: "2020-09-01",
  },
  {
    id: "c3",
    firstName: "Priya",
    lastName: "Patel",
    displayName: "Patel, Priya",
    email: "p.patel@team.com",
    role: "assistant_coach",
    groups: ["10 & Under", "Junior B"],
    usaSwimmingCertExpiry: "2024-12-01",
    certStatus: "expired",
    active: true,
    joinedAt: "2022-01-15",
  },
  {
    id: "c4",
    firstName: "Tom",
    lastName: "Bradley",
    displayName: "Bradley, Tom",
    email: "t.bradley@team.com",
    role: "volunteer",
    groups: ["10 & Under"],
    certStatus: "unknown",
    active: true,
    joinedAt: "2023-09-01",
  },
];

export const MOCK_GROUPS: RosterGroup[] = [
  {
    name: "Senior",
    athleteCount: 7,
    maleCount: 4,
    femaleCount: 3,
    coach: "Mitchell, Sarah",
  },
  {
    name: "Junior A",
    athleteCount: 6,
    maleCount: 3,
    femaleCount: 3,
    coach: "Rivera, Marcus",
  },
  {
    name: "Junior B",
    athleteCount: 7,
    maleCount: 3,
    femaleCount: 4,
    coach: "Rivera, Marcus",
  },
  {
    name: "10 & Under",
    athleteCount: 4,
    maleCount: 2,
    femaleCount: 2,
    coach: "Patel, Priya",
  },
];

export const MOCK_STATS: RosterStats = {
  totalAthletes: 24,
  activeAthletes: 23,
  maleCount: 12,
  femaleCount: 12,
  totalCoaches: 4,
  groupCount: 4,
};

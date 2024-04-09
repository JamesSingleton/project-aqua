import type { Athlete } from "@/types";

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
        xmlns="http://www.w3.org/2000/svg"
        width="50"
        height="50"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" fill="blue" />
      </svg>
    ),
  },
  {
    id: "7d13f58d-8a1e-4e7d-89d6-bb8a16881e9b",
    name: "Team B",
    logo: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="50"
        height="50"
        viewBox="0 0 24 24"
      >
        <rect width="24" height="24" fill="green" />
      </svg>
    ),
  },
  {
    id: "ef7d4b7c-08b9-4e13-9f9e-0450a19b6054",
    name: "Team C",
    logo: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="50"
        height="50"
        viewBox="0 0 24 24"
      >
        <path
          fill="orange"
          d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"
        />
      </svg>
    ),
  },
];

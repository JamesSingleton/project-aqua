import type { Athlete } from "@/types";

export const mockAthleteData: Athlete[] = [
  {
    id: "a1b2c3",
    name: "Emily Johnson",
    gender: "female",
    age: 16,
    date_of_birth: "2008-05-12",
    training_groups: [
      "Junior Squad",
      "Freestyle Masters",
      "Butterfly Training",
    ],
    practice_group: "Group A",
    personal_records: [
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
    emergency_contacts: [
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
    gender: "male",
    age: 18,
    date_of_birth: "2006-09-23",
    training_groups: ["Senior Squad", "Backstroke Champions"],
    practice_group: "Group B",
    personal_records: [
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
    emergency_contacts: [
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
    gender: "female",
    age: 14,
    date_of_birth: "2010-03-08",
    training_groups: ["Development Squad", "Breaststroke Prospects"],
    practice_group: "Group C",
    personal_records: [
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
    emergency_contacts: [
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
    gender: "male",
    age: 15,
    date_of_birth: "2009-11-15",
    training_groups: ["Junior Squad", "Freestyle Masters"],
    practice_group: "Group A",
    personal_records: [
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
    emergency_contacts: [
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
    gender: "female",
    age: 17,
    date_of_birth: "2007-07-19",
    training_groups: ["Senior Squad", "Butterfly Training"],
    practice_group: "Group B",
    personal_records: [
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
    emergency_contacts: [
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
    gender: "male",
    age: 13,
    date_of_birth: "2011-02-28",
    training_groups: ["Development Squad", "Backstroke Champions"],
    practice_group: "Group C",
    personal_records: [
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
    emergency_contacts: [
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
    gender: "female",
    age: 19,
    date_of_birth: "2005-12-03",
    training_groups: ["Senior Squad", "Breaststroke Prospects"],
    practice_group: "Group A",
    personal_records: [
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
    emergency_contacts: [
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
    gender: "male",
    age: 16,
    date_of_birth: "2008-04-27",
    training_groups: ["Junior Squad", "Freestyle Masters"],
    practice_group: "Group B",
    personal_records: [
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
    emergency_contacts: [
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
    gender: "female",
    age: 12,
    date_of_birth: "2012-08-14",
    training_groups: ["Development Squad", "Breaststroke Prospects"],
    practice_group: "Group C",
    personal_records: [
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
    emergency_contacts: [
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
    gender: "male",
    age: 14,
    date_of_birth: "2010-06-20",
    training_groups: ["Junior Squad", "Backstroke Champions"],
    practice_group: "Group A",
    personal_records: [
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
    emergency_contacts: [
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

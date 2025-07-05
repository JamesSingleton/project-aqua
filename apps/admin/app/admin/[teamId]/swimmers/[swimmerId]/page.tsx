import Link from "next/link";
import {
  User,
  Calendar,
  Phone,
  Users,
  Trophy,
  TrendingUp,
  Edit,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@project-aqua/ui/components/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@project-aqua/ui/components/avatar";
import { Button, buttonVariants } from "@project-aqua/ui/components/button";
import { Input } from "@project-aqua/ui/components/input";
import { Label } from "@project-aqua/ui/components/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@project-aqua/ui/components/table";

interface Swimmer {
  id: string;
  name: string;
  avatar: string;
  birthday: string;
  joinDate: string;
  group: string;
  emergencyContacts: {
    name: string;
    relation: string;
    phone: string;
  }[];
}

interface MeetResult {
  id: string;
  date: string;
  meetName: string;
  event: string;
  time: string;
  place: number;
}

async function getSwimmerData(
  swimmerId: string,
): Promise<{ swimmer: Swimmer; meetResults: MeetResult[] }> {
  // In a real application, this would be an API call or database query
  const swimmer: Swimmer = {
    id: "1",
    name: "Alice Johnson",
    avatar: "/placeholder.svg?height=128&width=128",
    birthday: "2008-05-15",
    joinDate: "2019-09-01",
    group: "Junior Competitive",
    emergencyContacts: [
      { name: "John Johnson", relation: "Father", phone: "(555) 123-4567" },
      { name: "Mary Johnson", relation: "Mother", phone: "(555) 987-6543" },
    ],
  };

  const meetResults: MeetResult[] = [
    {
      id: "1",
      date: "2023-06-15",
      meetName: "Summer Invitational",
      event: "50m Freestyle",
      time: "28.5",
      place: 2,
    },
    {
      id: "2",
      date: "2023-07-22",
      meetName: "Regional Championship",
      event: "100m Butterfly",
      time: "1:05.23",
      place: 3,
    },
    {
      id: "3",
      date: "2023-08-10",
      meetName: "State Finals",
      event: "200m Individual Medley",
      time: "2:25.11",
      place: 1,
    },
  ];

  return { swimmer, meetResults };
}

export default async function AthletePage({
  params,
}: {
  params: Promise<{ teamId: string; swimmerId: string }>;
}) {
  const { teamId, swimmerId } = await params;
  const { swimmer, meetResults } = await getSwimmerData(swimmerId);
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={swimmer.avatar} alt={swimmer.name} />
            <AvatarFallback>
              {swimmer.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{swimmer.name}</h1>
            <p className="text-xl text-muted-foreground">{swimmer.group}</p>
          </div>
        </div>
        <Link
          href={`/admin/${teamId}/swimmers/${swimmerId}/edit`}
          className={buttonVariants()}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Swimmer
        </Link>
      </div>
      <div>
        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="meet-results">Meet Results</TabsTrigger>
          </TabsList>
          <TabsContent value="info" className="space-y-8 md:space-y-12">
            <Card>
              <CardHeader>
                <CardTitle>Swimmer Info</CardTitle>
                <CardDescription>
                  Info about {swimmer.name} and their emergency contacts.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <Label>Full Name</Label>
                  <p>John Michael Smith</p>
                </div>
                <div className="space-y-1">
                  <Label>Preferred Name</Label>
                  <p>John</p>
                </div>
                <div className="space-y-1">
                  <Label>Phone Number</Label>
                  <p>+1 (555) 555-5555</p>
                </div>
                <div className="space-y-1">
                  <Label>Gender</Label>
                  <p>Male</p>
                </div>
                <div className="space-y-1">
                  <Label>Birthday</Label>
                  <p>1990-01-01</p>
                </div>
                <div className="space-y-1">
                  <Label>Date Joined</Label>
                  <p>2022-06-15</p>
                </div>
              </CardContent>
            </Card>
            <Card className="w-full max-w-3xl md:max-w-4xl lg:max-w-5xl">
              <CardHeader>
                <CardTitle>Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-lg font-semibold">Primary Contact</h3>
                  <div className="grid grid-cols-2 gap-4 pt-2 md:grid-cols-1">
                    <div className="space-y-1">
                      <Label>Name</Label>
                      <p>Jane Doe</p>
                    </div>
                    <div className="space-y-1">
                      <Label>Relationship</Label>
                      <p>Mother</p>
                    </div>
                    <div className="space-y-1">
                      <Label>Phone Number</Label>
                      <p>+1 (555) 555-5555</p>
                    </div>
                    <div className="space-y-1">
                      <Label>Email Address</Label>
                      <p>jane@example.com</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Secondary Contact</h3>
                  <div className="grid grid-cols-2 gap-4 pt-2 md:grid-cols-1">
                    <div className="space-y-1">
                      <Label>Name</Label>
                      <p>John Doe</p>
                    </div>
                    <div className="space-y-1">
                      <Label>Relationship</Label>
                      <p>Father</p>
                    </div>
                    <div className="space-y-1">
                      <Label>Phone Number</Label>
                      <p>+1 (555) 555-5555</p>
                    </div>
                    <div className="space-y-1">
                      <Label>Email Address</Label>
                      <p>john@example.com</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

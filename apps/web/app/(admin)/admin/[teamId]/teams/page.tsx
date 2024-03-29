import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { buttonVariants } from "@repo/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@repo/ui/card";

interface Team {
  id: string;
  name: string;
  location: string;
  swimmers: {
    total: number;
    boys: number;
    girls: number;
  };
  coach: string;
  assistantCoach: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
}

async function getTeams(): Promise<Team[]> {
  return [
    {
      id: "f92618d3-4431-4d6a-82e6-bc7dd20685f5",
      name: "Blue Dolphins",
      location: "Cityville",
      swimmers: {
        total: 25,
        boys: 12,
        girls: 13,
      },
      coach: "John Smith",
      assistantCoach: "Emily Johnson",
      contactEmail: "bluedolphins@example.com",
      contactPhone: "+1 (123) 456-7890",
      notes: "Highly competitive team with focus on butterfly stroke.",
    },
    {
      id: "a91e95e6-7726-4dbf-890d-4b91214fbc25",
      name: "Golden Sharks",
      location: "Townsville",
      swimmers: {
        total: 30,
        boys: 15,
        girls: 15,
      },
      coach: "Jessica Williams",
      assistantCoach: "Michael Davis",
      contactEmail: "goldensharks@example.com",
      contactPhone: "+1 (987) 654-3210",
      notes: "Training facility equipped with state-of-the-art technology.",
    },
  ];
}

export default async function TeamsPage() {
  const teams = await getTeams();

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Teams</h1>
        <Link className={buttonVariants()} href="/admin/teams/create">
          <PlusIcon className="mr-2 h-4 w-4" />
          New Team
        </Link>
      </div>
      {teams.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">
              You have no teams
            </h3>
            <p className="text-sm text-muted-foreground">
              You can start adding swimmers as soon as you add a team.
            </p>
            <Link
              className={cn(buttonVariants(), "mt-4")}
              href="/admin/teams/create"
            >
              Add Team
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <CardTitle>{team.name}</CardTitle>
                <CardDescription>{team.location}</CardDescription>
              </CardHeader>
              <CardContent></CardContent>
              <CardFooter>
                <Link
                  className={buttonVariants()}
                  href={`/admin/teams/${team.id}`}
                >
                  View Team
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

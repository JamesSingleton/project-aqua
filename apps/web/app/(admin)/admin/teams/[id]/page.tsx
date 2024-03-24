import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

type TeamInfo = {
  teamId: number;
  teamName: string;
  coach: string;
  location: string;
  members: string[];
};

async function getSwimTeamData(teamId: number) {
  const teamInfo = {
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
  };
  return teamInfo;
}

export default async function IndividualTeamPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const teamData = await getSwimTeamData(parseInt(id));
  console.log(teamData);

  if (!teamData) {
    notFound();
  }

  const { name, coach, location } = teamData;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">{name}</h1>
          <span className="text-sm text-muted-foreground">
            Coach: {coach}, Location: {location}
          </span>
        </div>
        <Link className={buttonVariants()} href={`/admin/teams/${id}/edit`}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Team
        </Link>
      </div>
    </>
  );
}

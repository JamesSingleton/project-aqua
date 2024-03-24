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

async function getSwimTeamData(teamId: number): Promise<TeamInfo | null> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      let teamInfo: TeamInfo | null = null;
      switch (teamId) {
        case 1:
          teamInfo = {
            teamId: 1,
            teamName: "Maricopa High School Swim Team",
            coach: "Coach Johnson",
            location: "Maricopa, AZ",
            members: ["John Smith", "Emily Johnson", "Michael Davis"],
          };
          break;
        case 2:
          teamInfo = {
            teamId: 2,
            teamName: "Arizona Seals Club Team",
            coach: "Coach Smith",
            location: "Phoenix, AZ",
            members: ["Samantha Brown", "David Martinez", "Michelle Lee"],
          };
          break;
        case 3:
          teamInfo = {
            teamId: 3,
            teamName: "Desert Sunrise High School Swim Team",
            coach: "Coach Thompson",
            location: "Scottsdale, AZ",
            members: ["Alex Rodriguez", "Jessica White", "Ryan Johnson"],
          };
          break;
        default:
          resolve(null);
          return;
      }
      resolve(teamInfo);
    }, 1000); // Simulating async delay
  });
}

export default async function IndividualTeamPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const teamData = await getSwimTeamData(parseInt(id));

  if (!teamData) {
    notFound();
  }

  const { teamName, coach, location } = teamData;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">{teamName}</h1>
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

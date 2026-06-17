import { getSession } from "@project-aqua/auth/session";
import { requireTeamMember } from "@project-aqua/db/authz";
import { db } from "@project-aqua/db/client";
import { getRoster } from "@project-aqua/db/queries/roster";
import { organization } from "@project-aqua/db/schema";
import { isMinorSwimmer } from "@project-aqua/swim-core/age";
import { buttonVariants } from "@project-aqua/ui/components/button";
import { Badge } from "@project-aqua/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import { UserPlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { columns } from "@/components/roster/columns";
import { DataTable } from "@/components/roster/data-table";
import type { Swimmer } from "@/types";
import { RosterImportExport } from "./roster-import-export";

function mapRosterToSwimmers(
  roster: Awaited<ReturnType<typeof getRoster>>,
): Swimmer[] {
  return roster.map((row) => ({
    id: row.swimmerId,
    name: row.preferredName
      ? `${row.preferredName} (${row.firstName} ${row.lastName})`
      : `${row.firstName} ${row.lastName}`,
    gender: row.gender === "male" ? "Male" : "Female",
    isMinor: isMinorSwimmer(row.dateOfBirth),
    age: row.dateOfBirth
      ? Math.floor(
          (Date.now() - new Date(row.dateOfBirth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000),
        )
      : 0,
    dateOfBirth: row.dateOfBirth ?? "",
    trainingGroups: row.trainingGroups ?? [],
    practiceGroup: row.practiceGroup ?? "",
    personalRecords: [],
    parents: [],
    emergencyContacts: [],
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  return {
    title: "Roster",
    alternates: { canonical: `/team/${teamId}/roster` },
  };
}

export default async function RosterPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const session = await getSession();
  await requireTeamMember(session?.user?.id, teamId);

  const roster = await getRoster(teamId);
  const swimmers = mapRosterToSwimmers(roster);

  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, teamId))
    .limit(1);
  const metadata = org?.metadata ? JSON.parse(org.metadata) : {};
  const teamType = (metadata.teamType as string) ?? "club";

  const maleSwimmers = swimmers.filter((s) => s.gender === "Male").length;
  const femaleSwimmers = swimmers.filter((s) => s.gender === "Female").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roster</h1>
          <p className="text-muted-foreground">
            Manage your team&apos;s swimmers ·{" "}
            <Badge variant="outline" className="capitalize">
              {teamType.replace("_", " ")}
            </Badge>
          </p>
        </div>
        <Link
          href={`/team/${teamId}/swimmers/create`}
          className={buttonVariants()}
        >
          <UserPlusIcon className="mr-2 size-4" />
          Add swimmer
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{swimmers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Male</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{maleSwimmers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Female</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{femaleSwimmers}</p>
          </CardContent>
        </Card>
      </div>

      <RosterImportExport teamId={teamId} />

      <Card>
        <CardHeader>
          <CardTitle>Swimmers</CardTitle>
          <CardDescription>
            {swimmers.length} active swimmers on roster
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns(teamId)} data={swimmers} />
        </CardContent>
      </Card>
    </div>
  );
}

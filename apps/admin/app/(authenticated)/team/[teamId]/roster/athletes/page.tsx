import { getAthletesByPublicId } from "@project-aqua/database/queries/athlete";
import { getTeamByPublicId } from "@project-aqua/database/queries/team";
import {
  Button,
  buttonVariants,
} from "@project-aqua/design-system/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@project-aqua/design-system/components/ui/empty";
import {
  ArrowUpRightIcon,
  UploadIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import { AthletesTable } from "@/components/roster/athletes/table";

interface AthletesPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function AthletesPage({ params }: AthletesPageProps) {
  const { teamId } = await params;
  const [team, athletes] = await Promise.all([
    getTeamByPublicId(teamId),
    getAthletesByPublicId(teamId),
  ]);

  return (
    <>
      <Header page="Athletes" pages={["Roster"]} />

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Athletes</h1>
          </div>
          {athletes?.length > 0 && (
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/team/${teamId}/roster/import`}>
                  <UploadIcon className="mr-1.5 h-4 w-4" />
                  Import
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href={`/team/${teamId}/roster/athletes/new`}>
                  <UserPlusIcon className="mr-1.5 h-4 w-4" />
                  Add athlete
                </Link>
              </Button>
            </div>
          )}
        </div>

        {athletes?.length > 0 ? (
          <AthletesTable data={athletes} team={team} />
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>No Athletes Yet</EmptyTitle>
              <EmptyDescription>
                You haven&apos;t added any athletes yet. Get started by adding
                your first athlete.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
              <Link
                className={buttonVariants()}
                href={`/team/${teamId}/roster/athletes/new`}
              >
                Add Athlete
              </Link>
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={`/team/${teamId}/roster/import`}
                prefetch={false}
              >
                Import Roster
              </Link>
            </EmptyContent>
            <Button
              asChild
              className="text-muted-foreground"
              size="sm"
              variant="link"
            >
              <Link href="#">
                Learn More <ArrowUpRightIcon />
              </Link>
            </Button>
          </Empty>
        )}
      </div>
    </>
  );
}

import { getSession } from "@project-aqua/auth/session";
import { getUserTeams } from "@project-aqua/db/authz";
import { getUpcomingMeetsForOrganizations } from "@project-aqua/db/queries/meets";
import { parseDateOnly } from "@project-aqua/swim-core/calendar-date";
import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardListRow } from "@/components/dashboard/dashboard-list-row";
import { PageHeader } from "@/components/page-header";
import { resolveTeamLandingPath } from "@/lib/resolve-team-landing";

export const metadata: Metadata = {
  title: "Home",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function localDateOnly(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default async function HomePage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const landing = await resolveTeamLandingPath(
    session.user.id,
    session.session.activeOrganizationId,
  );
  if (landing !== "/") {
    redirect(landing);
  }

  const teams = await getUserTeams(session.user.id);

  const todayKey = localDateOnly(new Date());
  const from = parseDateOnly(todayKey) ?? new Date();
  const upcoming = await getUpcomingMeetsForOrganizations(
    teams.map((t) => t.id),
    from,
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <PageHeader
        title="Your teams"
        description="Upcoming meets across every team you coach."
        actions={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/onboarding" />}
          >
            Add team
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>
            Open a workspace to manage roster and entries.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {teams.map((team) => (
            <DashboardListRow
              key={team.id}
              href={`/team/${team.id}`}
              title={team.name}
              meta={team.role.replaceAll("_", " ")}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming meets</CardTitle>
          <CardDescription>
            All teams, next on the calendar first.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {upcoming.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No upcoming meets. Import an event file from a team workspace.
            </p>
          ) : (
            upcoming.map((meet) => (
              <DashboardListRow
                key={meet.id}
                href={`/team/${meet.organizationId}/meets/${meet.id}`}
                title={meet.name}
                meta={[
                  meet.teamName,
                  meet.startDate.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  }),
                  meet.location,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

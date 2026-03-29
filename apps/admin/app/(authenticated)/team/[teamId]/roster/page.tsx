// app/team/[teamId]/roster/page.tsx

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@project-aqua/design-system/components/ui/breadcrumb";
import { Button } from "@project-aqua/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/design-system/components/ui/card";
import { Separator } from "@project-aqua/design-system/components/ui/separator";
import { SidebarTrigger } from "@project-aqua/design-system/components/ui/sidebar";
import {
  ChevronRightIcon,
  ShieldCheckIcon,
  UploadIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { MOCK_GROUPS, MOCK_STATS } from "@/lib/mock-data";

interface RosterPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function RosterPage({ params }: RosterPageProps) {
  const { teamId } = await params;
  const stats = MOCK_STATS;
  const groups = MOCK_GROUPS;

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-border border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator className="mx-2 h-4" orientation="vertical" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Roster</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-col gap-6 p-6">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Roster</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Manage athletes, coaches, and training groups.
            </p>
          </div>
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
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <UsersIcon className="h-3.5 w-3.5" />
                Total athletes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-3xl tabular-nums">
                {stats.totalAthletes}
              </div>
              <p className="mt-1 text-muted-foreground text-xs">
                {stats.activeAthletes} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Male / Female</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-3xl tabular-nums">
                {stats.maleCount}
                <span className="mx-1 font-normal text-lg text-muted-foreground">
                  /
                </span>
                {stats.femaleCount}
              </div>
              <p className="mt-1 text-muted-foreground text-xs">gender split</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                Coaches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-3xl tabular-nums">
                {stats.totalCoaches}
              </div>
              <p className="mt-1 text-muted-foreground text-xs">on staff</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Training groups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-3xl tabular-nums">
                {stats.groupCount}
              </div>
              <p className="mt-1 text-muted-foreground text-xs">
                active groups
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick nav cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            className="group block rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-muted/30"
            href={`/team/${teamId}/roster/athletes`}
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <UsersIcon className="h-5 w-5 text-primary" />
              </div>
              <ChevronRightIcon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
            </div>
            <h2 className="font-semibold">Athletes</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              {stats.totalAthletes} athletes across {stats.groupCount} groups
            </p>
          </Link>

          <Link
            className="group block rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-muted/30"
            href={`/team/${teamId}/roster/coaches`}
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ShieldCheckIcon className="h-5 w-5 text-primary" />
              </div>
              <ChevronRightIcon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
            </div>
            <h2 className="font-semibold">Coaches &amp; staff</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              {stats.totalCoaches} staff members, certifications &amp; roles
            </p>
          </Link>
        </div>

        {/* Groups breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Training groups</CardTitle>
                <CardDescription className="mt-0.5">
                  Athlete distribution by group
                </CardDescription>
              </div>
              <Button asChild className="h-7 text-xs" size="sm" variant="ghost">
                <Link href={`/team/${teamId}/roster/athletes`}>
                  View all athletes
                  <ChevronRightIcon className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {groups.map((group) => {
                const pct = Math.round(
                  (group.athleteCount / stats.totalAthletes) * 100
                );
                return (
                  <div
                    className="flex items-center gap-4 px-6 py-3.5"
                    key={group.name}
                  >
                    <div className="w-28 shrink-0">
                      <p className="font-medium text-sm">{group.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {group.coach}
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground text-xs">
                        <span className="tabular-nums">{group.maleCount}M</span>
                        <span className="tabular-nums">
                          {group.femaleCount}F
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-sm tabular-nums">
                        {group.athleteCount}
                      </p>
                      <p className="text-muted-foreground text-xs">athletes</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

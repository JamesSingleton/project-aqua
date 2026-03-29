import { Badge } from "@project-aqua/design-system/components/ui/badge";
import { Button } from "@project-aqua/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/design-system/components/ui/card";
import { Progress } from "@project-aqua/design-system/components/ui/progress";
import { Separator } from "@project-aqua/design-system/components/ui/separator";
import {
  AlertCircleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  ClipboardListIcon,
  ClockIcon,
  TrendingUpIcon,
  TrophyIcon,
  UploadIcon,
  UsersIcon,
  WavesIcon,
  XCircleIcon,
} from "lucide-react";
import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { RecentDropsTable } from "@/components/dashboard/recent-drops-table";
import { Header } from "@/components/header";
import {
  actionItems,
  attendanceThisWeek,
  recentDrops,
  upcomingMeets,
} from "@/lib/mock-data";

interface HomePageProps {
  params: Promise<{ teamId: string }>;
}

const urgencyConfig = {
  urgent: { label: "Urgent", variant: "destructive" as const },
  soon: { label: "Soon", variant: "secondary" as const },
  ok: { label: "On track", variant: "outline" as const },
};

const actionUrgencyConfig = {
  high: {
    icon: XCircleIcon,
    className: "text-destructive",
    badgeVariant: "destructive" as const,
  },
  medium: {
    icon: AlertCircleIcon,
    className: "text-yellow-500",
    badgeVariant: "secondary" as const,
  },
  low: {
    icon: CheckCircle2Icon,
    className: "text-muted-foreground",
    badgeVariant: "outline" as const,
  },
};

const actionTypeIcon = {
  entry_deadline: CalendarIcon,
  missing_times: ClockIcon,
  import_needed: UploadIcon,
  attendance: UsersIcon,
};

export async function generateMetadata(
  { params }: HomePageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { teamId } = await params;
  const previousMetadata = (await parent).title;

  return {
    ...previousMetadata,
    alternates: {
      canonical: `/team/${teamId}`,
    },
  };
}

export default async function AdminHomePage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const totalAthletes = 24;
  const activeMeets = upcomingMeets.length;
  const pbsThisMonth = recentDrops.length;
  const avgAttendance = Math.round(
    (attendanceThisWeek.reduce((sum, d) => sum + d.present, 0) /
      attendanceThisWeek.reduce((sum, d) => sum + d.total, 0)) *
      100
  );

  return (
    <>
      <Header page="Data Fetching" pages={["Building Your Application"]} />
      <div className="flex flex-1 flex-col gap-4 px-4 pb-4 md:gap-6 md:px-6 md:pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
            <p className="mt-0.5 text-muted-foreground text-sm">
              Sunday, March 15, 2026
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/team/${teamId}/roster/import`}>
                <UploadIcon className="mr-1.5 h-4 w-4" />
                Import file
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/team/${teamId}/meets/entries/new`}>
                <TrophyIcon className="mr-1.5 h-4 w-4" />
                New meet entry
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
                Athletes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-3xl tabular-nums">
                {totalAthletes}
              </div>
              <p className="mt-1 text-muted-foreground text-xs">
                Active on roster
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <TrophyIcon className="h-3.5 w-3.5" />
                Upcoming meets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-3xl tabular-nums">
                {activeMeets}
              </div>
              <p className="mt-1 text-muted-foreground text-xs">Next 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <TrendingUpIcon className="h-3.5 w-3.5" />
                PBs this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-3xl text-green-600 tabular-nums dark:text-green-400">
                {pbsThisMonth}
              </div>
              <p className="mt-1 text-muted-foreground text-xs">
                Personal bests set
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <WavesIcon className="h-3.5 w-3.5" />
                Avg attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-3xl tabular-nums">
                {avgAttendance}%
              </div>
              <p className="mt-1 text-muted-foreground text-xs">This week</p>
            </CardContent>
          </Card>
        </div>
        {/* Action items + Upcoming meets */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Action items */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Needs attention</CardTitle>
                <Badge className="text-xs" variant="destructive">
                  {actionItems.filter((a) => a.urgency === "high").length}{" "}
                  urgent
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {actionItems.map((item) => {
                  const { icon: UrgencyIcon, className } =
                    actionUrgencyConfig[item.urgency];
                  const TypeIcon = actionTypeIcon[item.type];
                  return (
                    <Link
                      className="flex items-start gap-3 px-6 py-3.5 transition-colors hover:bg-muted/50"
                      href={`/team/${teamId}${item.href}`}
                      key={item.id}
                    >
                      <UrgencyIcon
                        className={`mt-0.5 h-4 w-4 shrink-0 ${className}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm leading-snug">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-muted-foreground text-xs">
                          {item.description}
                        </p>
                      </div>
                      <TypeIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming meets */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Upcoming meets</CardTitle>
                <Button
                  asChild
                  className="h-7 text-xs"
                  size="sm"
                  variant="ghost"
                >
                  <Link href={`/team/${teamId}/meets/upcoming`}>
                    View all
                    <ChevronRightIcon className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {upcomingMeets.map((meet) => {
                  const { label, variant } =
                    urgencyConfig[meet.deadlineUrgency];
                  const entryPct = Math.round(
                    (meet.entriesSubmitted / meet.entriesTotal) * 100
                  );
                  return (
                    <Link
                      className="block px-6 py-3.5 transition-colors hover:bg-muted/50"
                      href={`/team/${teamId}/meets/${meet.id}`}
                      key={meet.id}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-sm leading-snug">
                            {meet.name}
                          </p>
                          <p className="mt-0.5 text-muted-foreground text-xs">
                            {meet.date} · {meet.location}
                          </p>
                        </div>
                        <Badge className="shrink-0 text-xs" variant={variant}>
                          {label}
                        </Badge>
                      </div>
                      <div className="mt-2.5">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-muted-foreground text-xs">
                            Entries: {meet.entriesSubmitted}/{meet.entriesTotal}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            Due {meet.entryDeadline}
                          </span>
                        </div>
                        <Progress className="h-1.5" value={entryPct} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent PBs + Attendance */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Recent PBs table — takes 2/3 width */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Recent personal bests
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    Times dropped in the last 7 days
                  </CardDescription>
                </div>
                <Button
                  asChild
                  className="h-7 text-xs"
                  size="sm"
                  variant="ghost"
                >
                  <Link href={`/team/${teamId}/times/personal-bests`}>
                    View all
                    <ChevronRightIcon className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <RecentDropsTable data={recentDrops} />
            </CardContent>
          </Card>

          {/* Attendance this week — takes 1/3 width */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Attendance this week</CardTitle>
              <CardDescription>
                {avgAttendance}% average turnout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {attendanceThisWeek.map((day) => {
                  const pct = Math.round((day.present / day.total) * 100);
                  return (
                    <div key={day.date}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="w-8 font-medium text-sm">
                          {day.date}
                        </span>
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {day.present}/{day.total}
                        </span>
                        <span className="w-8 text-right font-medium text-xs tabular-nums">
                          {pct}%
                        </span>
                      </div>
                      <Progress className="h-2" value={pct} />
                    </div>
                  );
                })}
              </div>
              <Separator className="my-4" />
              <Button
                asChild
                className="w-full text-xs"
                size="sm"
                variant="outline"
              >
                <Link href={`/team/${teamId}/practice/attendance`}>
                  <ClipboardListIcon className="mr-1.5 h-3.5 w-3.5" />
                  View full attendance log
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

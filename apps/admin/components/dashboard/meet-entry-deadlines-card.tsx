import {
  daysUntilDateOnly,
  deadlineUrgencyLevel,
  formatDateOnly,
} from "@project-aqua/swim-core/calendar-date";
import { Badge } from "@project-aqua/ui/components/badge";
import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import { cn } from "@project-aqua/ui/lib/utils";
import { AlertCircleIcon, ClipboardListIcon } from "lucide-react";
import Link from "next/link";

export type MeetEntryDeadlineItem = {
  id: string;
  name: string;
  entryDeadline: Date | null;
  startDate: Date;
  athletesEntered: number;
  entryCount: number;
};

export function MeetEntryDeadlinesCard({
  teamId,
  todayKey,
  meets,
}: {
  teamId: string;
  todayKey: string;
  meets: MeetEntryDeadlineItem[];
}) {
  return (
    <Card className="flex min-h-0 flex-1 flex-col gap-0">
      <CardHeader className="pb-(--card-spacing)">
        <CardTitle>Meet entry deadlines</CardTitle>
        <CardDescription>Submission status for upcoming meets</CardDescription>
        <CardAction>
          <Button
            size="sm"
            variant="ghost"
            nativeButton={false}
            render={<Link href={`/team/${teamId}/meets`} />}
          >
            All meets
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pb-(--card-spacing)">
        {meets.length === 0 ? (
          <p className="text-muted-foreground py-4 text-sm">
            No upcoming meets with entries to track.
          </p>
        ) : (
          meets.map((meet) => {
            const due = meet.entryDeadline ?? meet.startDate;
            const dueKey = formatDateOnly(due);
            const days = daysUntilDateOnly(dueKey, todayKey);
            const complete = meet.entryCount > 0;
            const urgency = deadlineUrgencyLevel(days, complete);
            const fillPct = complete ? 100 : 0;
            const dueLabel = meet.entryDeadline
              ? `Due: ${meet.entryDeadline.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                })}`
              : `Meet: ${meet.startDate.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                })}`;

            const badgeLabel = complete
              ? "Ready"
              : days < 0
                ? "Overdue"
                : days === 0
                  ? "Due today"
                  : `${days}d left`;

            return (
              <Link
                key={meet.id}
                href={`/team/${teamId}/meets/${meet.id}/entries`}
                className={cn(
                  "rounded-xl border p-3.5 transition-colors hover:bg-muted/40",
                  urgency === "urgent" &&
                    "border-destructive/30 bg-destructive/5",
                  urgency === "done" &&
                    "border-emerald-500/30 bg-emerald-500/5",
                  urgency === "soon" && "border-amber-500/30 bg-amber-500/5",
                  urgency === "ok" && "border-border",
                )}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {meet.name}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {dueLabel}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {urgency === "urgent" ? (
                      <AlertCircleIcon className="text-destructive size-3.5" />
                    ) : null}
                    <Badge
                      variant={
                        urgency === "done"
                          ? "secondary"
                          : urgency === "urgent"
                            ? "destructive"
                            : "outline"
                      }
                      className={cn(
                        "text-[10px]",
                        urgency === "soon" &&
                          "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                      )}
                    >
                      {badgeLabel}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        urgency === "done" && "bg-emerald-500",
                        urgency === "urgent" && "bg-destructive",
                        urgency === "soon" && "bg-amber-500",
                        urgency === "ok" && "bg-primary",
                      )}
                      style={{
                        width: `${fillPct}%`,
                      }}
                    />
                  </div>
                  <span className="text-muted-foreground shrink-0 text-[10px] tabular-nums">
                    {meet.entryCount > 0
                      ? `${meet.athletesEntered} athletes · ${meet.entryCount} entries`
                      : "No entries yet"}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
      <CardFooter className="mt-auto">
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          nativeButton={false}
          render={<Link href={`/team/${teamId}/meets`} />}
        >
          <ClipboardListIcon className="size-3.5" />
          Manage entries
        </Button>
      </CardFooter>
    </Card>
  );
}

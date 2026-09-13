import { formatTime } from "@project-aqua/swim-core/times";
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
import Link from "next/link";

export type RecentBestTime = {
  swimmerId: string;
  swimmerName: string;
  eventLabel: string;
  timeMs: number;
  achievedAt: string | null;
};

export function RecentBestTimesCard({
  teamId,
  times,
  seasonLabel,
  seasonPhase,
  seasonStartsLabel,
}: {
  teamId: string;
  times: RecentBestTime[];
  seasonLabel?: string;
  seasonPhase?: "before" | "during" | "after" | "none";
  seasonStartsLabel?: string;
}) {
  const description =
    seasonPhase === "before" && seasonStartsLabel
      ? `Season starts ${seasonStartsLabel}`
      : seasonPhase === "after" && seasonLabel
        ? `${seasonLabel} has ended`
        : seasonLabel
          ? `PBs dropped during ${seasonLabel}`
          : "Latest personal bests from your roster";

  const emptyMessage =
    seasonPhase === "before" && seasonStartsLabel
      ? `No season PBs yet — season starts ${seasonStartsLabel}.`
      : seasonPhase === "after"
        ? "No personal bests were recorded in this season."
        : "No personal bests in this season yet. Import meet results or add times from progression.";

  return (
    <Card className="h-full gap-0 lg:col-span-2">
      <CardHeader className="pb-(--card-spacing)">
        <CardTitle>Recent best times</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button
            size="sm"
            variant="ghost"
            nativeButton={false}
            render={<Link href={`/team/${teamId}/progression`} />}
          >
            Progression
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 pb-(--card-spacing)">
        {times.length === 0 ? (
          <p className="text-muted-foreground py-6 text-sm">{emptyMessage}</p>
        ) : (
          times.map((time, index) => (
            <Link
              key={`${time.swimmerId}-${time.eventLabel}-${time.timeMs}-${index}`}
              href={`/team/${teamId}/swimmers/${time.swimmerId}/progression`}
              className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5 transition-colors hover:bg-muted"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {time.swimmerName}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {time.eventLabel}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-timing text-sm font-semibold tabular-nums">
                  {formatTime(time.timeMs)}
                </p>
                {time.achievedAt ? (
                  <p className="text-muted-foreground text-xs">
                    {new Date(time.achievedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                ) : null}
              </div>
            </Link>
          ))
        )}
      </CardContent>
      <CardFooter className="justify-between gap-2">
        <span className="text-muted-foreground text-xs">
          {times.length > 0
            ? `${times.length} recent PB${times.length === 1 ? "" : "s"}`
            : "Season personal bests"}
        </span>
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={<Link href={`/team/${teamId}/analytics`} />}
        >
          Analytics
        </Button>
      </CardFooter>
    </Card>
  );
}

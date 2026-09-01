import { formatTime } from "@project-aqua/swim-core/times";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import Link from "next/link";

export type CutTrackerRow = {
  swimmerName: string;
  eventLabel: string;
  timeMs: number;
  cutTimeMs: number;
  setName: string;
};

export function CutTrackerCard({
  teamId,
  rows,
  available,
}: {
  teamId: string;
  rows: CutTrackerRow[];
  available: boolean;
}) {
  if (!available) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cut tracker</CardTitle>
        <CardDescription>
          Swimmers at or faster than an imported time standard.{" "}
          <Link
            href={`/team/${teamId}/meets/time-standards`}
            className="underline underline-offset-4"
          >
            Manage standards
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No cuts matched yet. Import a time-standard set, then record best
            times.
          </p>
        ) : (
          <ul className="divide-border divide-y">
            {rows.slice(0, 20).map((row) => (
              <li
                key={`${row.swimmerName}-${row.eventLabel}-${row.setName}`}
                className="flex items-baseline justify-between gap-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  {row.swimmerName}{" "}
                  <span className="text-muted-foreground">
                    {row.eventLabel} · {row.setName}
                  </span>
                </span>
                <span className="font-timing shrink-0 tabular-nums">
                  {formatTime(row.timeMs)}
                  <span className="text-muted-foreground">
                    {" "}
                    / {formatTime(row.cutTimeMs)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

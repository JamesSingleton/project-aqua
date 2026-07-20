"use client";

import { formatEventName } from "@project-aqua/swim-core/events";
import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@project-aqua/ui/components/table";
import { cn } from "@project-aqua/ui/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { updateMeetEntryStatusAction } from "../actions";

type MatrixEvent = {
  id: string;
  eventNumber: number | null;
  distance: number;
  stroke: string;
  gender: string;
};

type MatrixSwimmer = {
  membershipId: string;
  firstName: string;
  lastName: string;
};

type MatrixEntry = {
  id: string;
  meetEventId: string;
  membershipId: string;
  status: string;
};

function formatGenderShort(gender: string) {
  if (gender === "female" || gender === "f") return "F";
  if (gender === "mixed" || gender === "x") return "X";
  if (gender === "male" || gender === "m") return "M";
  return "";
}

export function EntryMatrix({
  teamId,
  meetId,
  events,
  swimmers,
  entries,
}: {
  teamId: string;
  meetId: string;
  events: MatrixEvent[];
  swimmers: MatrixSwimmer[];
  entries: MatrixEntry[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const entryByKey = useMemo(() => {
    const map = new Map<string, MatrixEntry>();
    for (const entry of entries) {
      map.set(`${entry.membershipId}:${entry.meetEventId}`, entry);
    }
    return map;
  }, [entries]);

  const draftEntries = useMemo(
    () => entries.filter((e) => e.status === "draft"),
    [entries],
  );

  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const an = a.eventNumber ?? Number.MAX_SAFE_INTEGER;
        const bn = b.eventNumber ?? Number.MAX_SAFE_INTEGER;
        return an - bn;
      }),
    [events],
  );

  function approveDrafts() {
    if (draftEntries.length === 0) return;
    setError("");
    startTransition(async () => {
      try {
        await Promise.all(
          draftEntries.map((entry) =>
            updateMeetEntryStatusAction(teamId, meetId, entry.id, "approved"),
          ),
        );
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to approve drafts",
        );
      }
    });
  }

  if (swimmers.length === 0 || events.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Entry matrix</CardTitle>
          <CardDescription>
            Committed swimmers × events. Draft cells can be bulk-approved.
          </CardDescription>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={pending || draftEntries.length === 0}
          onClick={approveDrafts}
        >
          {pending
            ? "Approving…"
            : `Approve drafts${draftEntries.length > 0 ? ` (${draftEntries.length})` : ""}`}
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-destructive mb-3 text-sm" role="alert">
            {error}
          </p>
        ) : null}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-background min-w-36">
                  Swimmer
                </TableHead>
                {sortedEvents.map((event) => (
                  <TableHead
                    key={event.id}
                    className="min-w-16 text-center text-xs whitespace-normal"
                  >
                    <span className="block font-medium">
                      #{event.eventNumber ?? "—"}
                    </span>
                    <span className="text-muted-foreground font-normal">
                      {formatGenderShort(event.gender)}{" "}
                      {formatEventName(event.distance, event.stroke)}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {swimmers.map((swimmer) => (
                <TableRow key={swimmer.membershipId}>
                  <TableCell className="sticky left-0 z-10 bg-background font-medium whitespace-nowrap">
                    {swimmer.firstName} {swimmer.lastName}
                  </TableCell>
                  {sortedEvents.map((event) => {
                    const entry = entryByKey.get(
                      `${swimmer.membershipId}:${event.id}`,
                    );
                    const status = entry?.status;
                    return (
                      <TableCell key={event.id} className="text-center">
                        <span
                          className={cn(
                            "inline-flex size-6 items-center justify-center rounded text-xs font-medium",
                            status === "approved" &&
                              "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                            status === "draft" &&
                              "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                            status === "scratched" &&
                              "bg-destructive/10 text-destructive line-through",
                            !status && "text-muted-foreground/40",
                          )}
                          title={status ?? "Not entered"}
                        >
                          {status === "approved"
                            ? "✓"
                            : status === "draft"
                              ? "D"
                              : status === "scratched"
                                ? "S"
                                : "·"}
                        </span>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

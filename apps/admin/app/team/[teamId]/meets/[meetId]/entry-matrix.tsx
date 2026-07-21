"use client";

import {
  formatEventName,
  formatGenderShort,
} from "@project-aqua/swim-core/events";
import { Badge } from "@project-aqua/ui/components/badge";
import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import { Label } from "@project-aqua/ui/components/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@project-aqua/ui/components/table";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState, useTransition } from "react";
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

type GroupBy = "swimmer" | "event";

const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "swimmer", label: "Swimmer" },
  { value: "event", label: "Event" },
];

function isGroupBy(value: string): value is GroupBy {
  return value === "swimmer" || value === "event";
}

function eventLabel(event: MatrixEvent) {
  const gender = formatGenderShort(event.gender);
  return `#${event.eventNumber ?? "—"} ${gender ? `${gender} ` : ""}${formatEventName(event.distance, event.stroke)}`.trim();
}

function statusBadge(status: string) {
  if (status === "approved") {
    return (
      <Badge
        variant="secondary"
        className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      >
        Approved
      </Badge>
    );
  }
  if (status === "draft") {
    return (
      <Badge
        variant="secondary"
        className="bg-amber-500/15 text-amber-700 dark:text-amber-400"
      >
        Draft
      </Badge>
    );
  }
  if (status === "scratched") {
    return (
      <Badge variant="destructive" className="line-through">
        Scratched
      </Badge>
    );
  }
  return <Badge variant="outline">{status}</Badge>;
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
  const [groupBy, setGroupBy] = useState<GroupBy>("swimmer");

  const eventById = useMemo(
    () => new Map(events.map((event) => [event.id, event])),
    [events],
  );

  const swimmerById = useMemo(
    () => new Map(swimmers.map((swimmer) => [swimmer.membershipId, swimmer])),
    [swimmers],
  );

  const draftEntries = useMemo(
    () => entries.filter((e) => e.status === "draft"),
    [entries],
  );

  const activeEntries = useMemo(
    () => entries.filter((e) => e.status !== "scratched"),
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

  const groups = useMemo(() => {
    if (groupBy === "swimmer") {
      const byMembership = new Map<string, MatrixEntry[]>();
      for (const entry of activeEntries) {
        const list = byMembership.get(entry.membershipId) ?? [];
        list.push(entry);
        byMembership.set(entry.membershipId, list);
      }

      return swimmers
        .map((swimmer) => {
          const rows = [...(byMembership.get(swimmer.membershipId) ?? [])].sort(
            (a: MatrixEntry, b: MatrixEntry) => {
              const ea = eventById.get(a.meetEventId);
              const eb = eventById.get(b.meetEventId);
              const an = ea?.eventNumber ?? Number.MAX_SAFE_INTEGER;
              const bn = eb?.eventNumber ?? Number.MAX_SAFE_INTEGER;
              return an - bn;
            },
          );
          return {
            key: swimmer.membershipId,
            label: `${swimmer.firstName} ${swimmer.lastName}`,
            rows,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    const byEvent = new Map<string, MatrixEntry[]>();
    for (const entry of activeEntries) {
      const list = byEvent.get(entry.meetEventId) ?? [];
      list.push(entry);
      byEvent.set(entry.meetEventId, list);
    }

    return sortedEvents
      .map((event) => {
        const rows = [...(byEvent.get(event.id) ?? [])].sort(
          (a: MatrixEntry, b: MatrixEntry) => {
            const sa = swimmerById.get(a.membershipId);
            const sb = swimmerById.get(b.membershipId);
            const na = sa ? `${sa.lastName} ${sa.firstName}` : "";
            const nb = sb ? `${sb.lastName} ${sb.firstName}` : "";
            return na.localeCompare(nb);
          },
        );
        return {
          key: event.id,
          label: eventLabel(event),
          rows,
        };
      })
      .filter((group) => group.rows.length > 0);
  }, [groupBy, swimmers, sortedEvents, activeEntries, eventById, swimmerById]);

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

  const showEventColumn = groupBy === "swimmer";
  const showSwimmerColumn = groupBy === "event";
  const columnCount = 2;

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>Entries</CardTitle>
          <CardDescription>
            Committed swimmers and their events. Group by swimmer or event;
            approve drafts in bulk.
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
      <CardContent className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-group-by">Group by</Label>
            <Select
              items={GROUP_BY_OPTIONS}
              value={groupBy}
              onValueChange={(value) => {
                if (value != null && isGroupBy(value)) setGroupBy(value);
              }}
            >
              <SelectTrigger id="entry-group-by" className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {GROUP_BY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}

        {groupBy === "event" && activeEntries.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No entries yet. Commit swimmers and add events from the board above.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {showSwimmerColumn ? <TableHead>Swimmer</TableHead> : null}
                {showEventColumn ? <TableHead>Event</TableHead> : null}
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <Fragment key={group.key}>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableCell colSpan={columnCount} className="font-medium">
                      {group.label}
                      <span className="text-muted-foreground ml-2 font-normal">
                        {group.rows.length}
                      </span>
                    </TableCell>
                  </TableRow>
                  {group.rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columnCount}
                        className="text-muted-foreground text-sm"
                      >
                        No events entered
                      </TableCell>
                    </TableRow>
                  ) : (
                    group.rows.map((entry) => {
                      const event = eventById.get(entry.meetEventId);
                      const swimmer = swimmerById.get(entry.membershipId);
                      return (
                        <TableRow key={entry.id}>
                          {showSwimmerColumn ? (
                            <TableCell>
                              {swimmer
                                ? `${swimmer.firstName} ${swimmer.lastName}`
                                : "—"}
                            </TableCell>
                          ) : null}
                          {showEventColumn ? (
                            <TableCell>
                              {event ? eventLabel(event) : "—"}
                            </TableCell>
                          ) : null}
                          <TableCell>{statusBadge(entry.status)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

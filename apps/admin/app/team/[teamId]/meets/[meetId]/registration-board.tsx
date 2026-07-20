"use client";

import {
  canAddMeetEntry,
  formatEntryLimitsSummary,
  isRelayStroke,
  type MeetEntryLimits,
} from "@project-aqua/swim-core/entry-limits";
import {
  formatEventName,
  isSwimmerEligibleForEvent,
} from "@project-aqua/swim-core/events";
import { formatTime, parseTime } from "@project-aqua/swim-core/times";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@project-aqua/ui/components/alert";
import { Button } from "@project-aqua/ui/components/button";
import { Input } from "@project-aqua/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/ui/components/select";
import { Spinner } from "@project-aqua/ui/components/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@project-aqua/ui/components/tooltip";
import { cn } from "@project-aqua/ui/lib/utils";
import {
  AlertTriangleIcon,
  Minus,
  Plus,
  Search,
  SquareCheckBig,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  addMeetEntryAction,
  deleteMeetEntryAction,
  setMeetCommitmentAction,
  setMeetCommitmentsBulkAction,
} from "../actions";

type RosterRow = {
  membershipId: string;
  swimmerId: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  practiceGroup: string | null;
  groupId: string | null;
  groupName: string | null;
  gender: "male" | "female";
  dateOfBirth: Date | string | null;
};

type EventRow = {
  id: string;
  eventNumber: number | null;
  distance: number;
  stroke: string;
  gender: string;
  ageGroup: string | null;
  eventKey: string;
  qualifyingTimeMs: number | null;
};

type EntryRow = {
  id: string;
  meetEventId: string;
  membershipId: string;
  seedTimeMs: number | null;
  status: string;
  firstName: string;
  lastName: string;
  distance: number;
  stroke: string;
  eventNumber: number | null;
  gender: string;
  eventKey?: string;
};

type CommitmentRow = {
  membershipId: string;
  status: string;
  firstName: string;
  lastName: string;
};

type BestTimeRow = {
  membershipId: string;
  eventKey: string;
  timeMs: number;
};

type CommitmentStatus = "pending" | "committed" | "declined";
type RosterFilter = "all" | "committed" | "pending" | "declined";

function commitmentLabel(status: string) {
  if (status === "committed") return "Committed";
  if (status === "declined") return "Declined";
  return "Pending";
}

const COMMITMENT_ITEMS = [
  { value: "pending", label: "Pending" },
  { value: "committed", label: "Committed" },
  { value: "declined", label: "Declined" },
] as const;

function formatGenderLabel(gender: string) {
  if (gender === "female" || gender === "f") return "Female";
  if (gender === "mixed" || gender === "x") return "Mixed";
  if (gender === "male" || gender === "m") return "Male";
  return gender;
}

function ageAsOf(dob: Date | string | null, asOf: Date): number | null {
  if (!dob) return null;
  const birth = typeof dob === "string" ? new Date(dob) : dob;
  if (Number.isNaN(birth.getTime())) return null;
  let age = asOf.getFullYear() - birth.getFullYear();
  const monthDiff = asOf.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

function formatEventLine(event: {
  eventNumber: number | null;
  distance: number;
  stroke: string;
  gender: string;
  ageGroup?: string | null;
}) {
  const gender = formatGenderLabel(event.gender);
  const genderShort =
    gender === "Female"
      ? "F"
      : gender === "Male"
        ? "M"
        : gender === "Mixed"
          ? "X"
          : "";
  const age = event.ageGroup ? ` ${event.ageGroup}` : "";
  return `#${event.eventNumber ?? "—"} ${genderShort}${age} ${formatEventName(event.distance, event.stroke)}`.replace(
    /\s+/g,
    " ",
  );
}

function seedDisplay(ms: number | null, course: string) {
  if (ms == null) return "NT";
  return `${formatTime(ms)}${course.charAt(0)}`;
}

function qtDisplay(ms: number | null | undefined) {
  if (ms == null || ms <= 0) return null;
  return formatTime(ms);
}

function groupLabel(row: RosterRow) {
  return row.groupName ?? row.practiceGroup ?? "No group";
}

function entryLimitAlert(args: {
  limits: MeetEntryLimits | null | undefined;
  entryCounts: { individual: number; relay: number };
  limitsSummary: string | null;
  availableEvents: EventRow[];
}): { title: string; description: string } | null {
  const { limits, entryCounts, limitsSummary, availableEvents } = args;
  if (!limits || availableEvents.length === 0) return null;

  const individualCheck = canAddMeetEntry(limits, entryCounts, false);
  const relayCheck = canAddMeetEntry(limits, entryCounts, true);
  if (individualCheck.ok && relayCheck.ok) return null;

  const hasIndividualAvailable = availableEvents.some(
    (event) => !isRelayStroke(event.stroke, event.eventKey),
  );
  const hasRelayAvailable = availableEvents.some((event) =>
    isRelayStroke(event.stroke, event.eventKey),
  );

  const blockingIndividual = !individualCheck.ok && hasIndividualAvailable;
  const blockingRelay = !relayCheck.ok && hasRelayAvailable;
  if (!blockingIndividual && !blockingRelay) return null;

  const current = `${entryCounts.individual} individual + ${entryCounts.relay} relay`;
  const limitLine = limitsSummary ? ` Meet limit: ${limitsSummary}.` : "";

  if (blockingIndividual && blockingRelay) {
    const reason = !individualCheck.ok
      ? individualCheck.reason
      : !relayCheck.ok
        ? relayCheck.reason
        : "Entry limits exceeded.";
    return {
      title: "Entry limit reached",
      description: `${reason} This swimmer has ${current}.${limitLine} Remove an entry to add another event.`,
    };
  }

  if (blockingIndividual) {
    return {
      title: "Individual entry limit reached",
      description: `${!individualCheck.ok ? individualCheck.reason : ""} This swimmer has ${current}.${limitLine}${
        hasRelayAvailable && relayCheck.ok
          ? " Relay events can still be added."
          : " Remove an individual entry to add another."
      }`,
    };
  }

  return {
    title: "Relay entry limit reached",
    description: `${!relayCheck.ok ? relayCheck.reason : ""} This swimmer has ${current}.${limitLine}${
      hasIndividualAvailable && individualCheck.ok
        ? " Individual events can still be added."
        : " Remove a relay entry to add another."
    }`,
  };
}

function AddEntryButton({
  disabled,
  limitReason,
  pending,
  onClick,
}: {
  disabled: boolean;
  limitReason?: string;
  pending: boolean;
  onClick: () => void;
}) {
  const button = (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={disabled}
      aria-label={
        limitReason ? `Add entry unavailable: ${limitReason}` : "Add entry"
      }
      onClick={onClick}
    >
      {pending ? <Spinner /> : <Plus className="size-4" />}
    </Button>
  );

  if (!limitReason) return button;

  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="inline-flex cursor-not-allowed" />}
      >
        {button}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{limitReason}</TooltipContent>
    </Tooltip>
  );
}

export function RegistrationBoard({
  teamId,
  meetId,
  course,
  meetStartDate,
  limits,
  roster,
  events,
  entries,
  commitments,
  bestTimes,
}: {
  teamId: string;
  meetId: string;
  course: string;
  meetStartDate: Date;
  limits?: MeetEntryLimits | null;
  roster: RosterRow[];
  events: EventRow[];
  entries: EntryRow[];
  commitments: CommitmentRow[];
  bestTimes: BestTimeRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RosterFilter>("committed");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [membershipId, setMembershipId] = useState(
    roster[0]?.membershipId ?? "",
  );
  const [seedDrafts, setSeedDrafts] = useState<Record<string, string>>({});

  const commitmentByMembership = useMemo(
    () => new Map(commitments.map((c) => [c.membershipId, c.status])),
    [commitments],
  );

  const entryCountByMembership = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of entries) {
      if (entry.status === "scratched") continue;
      map.set(entry.membershipId, (map.get(entry.membershipId) ?? 0) + 1);
    }
    return map;
  }, [entries]);

  const groups = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of roster) {
      if (row.groupId && row.groupName) {
        map.set(row.groupId, row.groupName);
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [roster]);

  const limitsSummary = formatEntryLimitsSummary(limits);

  const filteredRoster = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roster.filter((row) => {
      const status = commitmentByMembership.get(row.membershipId) ?? "pending";
      if (filter !== "all" && status !== filter) return false;
      if (groupFilter !== "all") {
        if (groupFilter === "none") {
          if (row.groupId) return false;
        } else if (row.groupId !== groupFilter) {
          return false;
        }
      }
      if (!q) return true;
      const name = `${row.firstName} ${row.lastName} ${row.preferredName ?? ""}`
        .toLowerCase()
        .trim();
      return name.includes(q);
    });
  }, [roster, search, filter, groupFilter, commitmentByMembership]);

  useEffect(() => {
    if (
      membershipId &&
      filteredRoster.some((r) => r.membershipId === membershipId)
    ) {
      return;
    }
    setMembershipId(filteredRoster[0]?.membershipId ?? "");
  }, [filteredRoster, membershipId]);

  const selectedSwimmer = roster.find((r) => r.membershipId === membershipId);
  const commitmentStatus =
    (membershipId ? commitmentByMembership.get(membershipId) : undefined) ??
    "pending";

  const swimmerEntries = useMemo(
    () =>
      entries.filter(
        (e) => e.membershipId === membershipId && e.status !== "scratched",
      ),
    [entries, membershipId],
  );

  const entryCounts = useMemo(() => {
    let individual = 0;
    let relay = 0;
    for (const entry of swimmerEntries) {
      if (isRelayStroke(entry.stroke, entry.eventKey)) relay += 1;
      else individual += 1;
    }
    return { individual, relay };
  }, [swimmerEntries]);

  const enteredEventIds = useMemo(
    () => new Set(swimmerEntries.map((e) => e.meetEventId)),
    [swimmerEntries],
  );

  const availableEvents = useMemo(() => {
    if (!selectedSwimmer) return [];
    return events.filter(
      (event) =>
        !enteredEventIds.has(event.id) &&
        isSwimmerEligibleForEvent(selectedSwimmer.gender, event.gender),
    );
  }, [events, enteredEventIds, selectedSwimmer]);

  const limitAlert = useMemo(
    () =>
      entryLimitAlert({
        limits,
        entryCounts,
        limitsSummary,
        availableEvents,
      }),
    [limits, entryCounts, limitsSummary, availableEvents],
  );

  function bestSeedFor(eventKey: string) {
    if (!membershipId) return null;
    return (
      bestTimes.find(
        (b) => b.membershipId === membershipId && b.eventKey === eventKey,
      )?.timeMs ?? null
    );
  }

  function seedInputValue(eventId: string, eventKey: string) {
    if (seedDrafts[eventId] !== undefined) return seedDrafts[eventId]!;
    const best = bestSeedFor(eventKey);
    return best != null ? formatTime(best) : "";
  }

  function resolveSeed(
    eventId: string,
    eventKey: string,
  ): {
    seedTimeMs: number | null;
    seedTimeSource: "personal_best" | "manual" | "no_time";
  } | null {
    const draft = seedDrafts[eventId];
    const best = bestSeedFor(eventKey);

    if (draft === undefined) {
      if (best != null) {
        return { seedTimeMs: best, seedTimeSource: "personal_best" };
      }
      return { seedTimeMs: null, seedTimeSource: "no_time" };
    }

    const raw = draft.trim();
    if (!raw) {
      return { seedTimeMs: null, seedTimeSource: "no_time" };
    }
    const parsed = parseTime(raw);
    if (!parsed || parsed <= 0) return null;
    return { seedTimeMs: parsed, seedTimeSource: "manual" };
  }

  function refresh() {
    router.refresh();
  }

  const uncommittedCount = useMemo(() => {
    return roster.filter(
      (row) =>
        (commitmentByMembership.get(row.membershipId) ?? "pending") !==
        "committed",
    ).length;
  }, [roster, commitmentByMembership]);

  function commitAllSwimmers() {
    const ids = roster
      .filter(
        (row) =>
          (commitmentByMembership.get(row.membershipId) ?? "pending") !==
          "committed",
      )
      .map((row) => row.membershipId);
    if (ids.length === 0) return;
    setPendingAction("commit-all");
    startTransition(async () => {
      try {
        await setMeetCommitmentsBulkAction(teamId, meetId, ids, "committed");
        setFilter("committed");
        refresh();
      } finally {
        setPendingAction(null);
      }
    });
  }

  function addEntry(event: EventRow) {
    const resolved = resolveSeed(event.id, event.eventKey);
    if (!resolved) return;

    const candidateIsRelay = isRelayStroke(event.stroke, event.eventKey);
    const limitCheck = canAddMeetEntry(limits, entryCounts, candidateIsRelay);
    if (!limitCheck.ok) return;

    setPendingAction(`add:${event.id}`);
    startTransition(async () => {
      try {
        await addMeetEntryAction(teamId, meetId, {
          meetEventId: event.id,
          membershipId,
          seedTimeMs: resolved.seedTimeMs,
          seedTimeSource: resolved.seedTimeSource,
          status: "approved",
        });
        setSeedDrafts((prev) => {
          const next = { ...prev };
          delete next[event.id];
          return next;
        });
        refresh();
      } finally {
        setPendingAction(null);
      }
    });
  }

  const age = selectedSwimmer
    ? ageAsOf(selectedSwimmer.dateOfBirth, meetStartDate)
    : null;

  return (
    <div className="flex min-h-112 min-w-0 w-full flex-col gap-4 lg:flex-row lg:items-stretch">
      {/* Lane board */}
      <aside className="border-border bg-card flex w-full min-w-0 shrink-0 flex-col overflow-hidden rounded-lg border lg:w-[36%] lg:max-w-md">
        <div className="border-border space-y-3 border-b p-3">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for a swimmer…"
              className="pl-8"
              aria-label="Search swimmers"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filter}
              onValueChange={(v) => {
                if (v != null) setFilter(v as RosterFilter);
              }}
            >
              <SelectTrigger className="h-8 w-auto min-w-36">
                <SelectValue>
                  {filter === "all"
                    ? `All (${roster.length})`
                    : `${commitmentLabel(filter)} (${roster.filter((r) => (commitmentByMembership.get(r.membershipId) ?? "pending") === filter).length})`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="committed">Committed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={groupFilter}
              onValueChange={(v) => {
                if (v != null) setGroupFilter(v);
              }}
            >
              <SelectTrigger className="h-8 w-auto min-w-32">
                <SelectValue>
                  {groupFilter === "all"
                    ? "All groups"
                    : groupFilter === "none"
                      ? "No group"
                      : (groups.find(([id]) => id === groupFilter)?.[1] ??
                        "Group")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All groups</SelectItem>
                  <SelectItem value="none">No group</SelectItem>
                  {groups.map(([id, name]) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending || uncommittedCount === 0}
                    onClick={commitAllSwimmers}
                    aria-label={
                      uncommittedCount === 0
                        ? "All swimmers already committed"
                        : `Commit all ${uncommittedCount} uncommitted swimmers`
                    }
                  />
                }
              >
                {pendingAction === "commit-all" ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <SquareCheckBig data-icon="inline-start" />
                )}
                Commit all
              </TooltipTrigger>
              <TooltipContent>
                {uncommittedCount === 0
                  ? "Everyone is already committed"
                  : `Commit ${uncommittedCount} swimmer${uncommittedCount === 1 ? "" : "s"} who are not yet committed`}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <ul className="max-h-[70vh] flex-1 overflow-y-auto">
          {filteredRoster.length === 0 ? (
            <li className="text-muted-foreground p-4 text-sm">
              No swimmers match this filter.
            </li>
          ) : (
            filteredRoster.map((row) => {
              const status =
                commitmentByMembership.get(row.membershipId) ?? "pending";
              const count = entryCountByMembership.get(row.membershipId) ?? 0;
              const active = row.membershipId === membershipId;
              const rowAge = ageAsOf(row.dateOfBirth, meetStartDate);

              return (
                <li key={row.membershipId} className="border-border border-b">
                  <button
                    type="button"
                    className={cn(
                      "flex w-full min-w-0 flex-col gap-0.5 px-3 py-2.5 text-left transition-colors",
                      active && "bg-muted/60",
                    )}
                    onClick={() => setMembershipId(row.membershipId)}
                  >
                    <span className="truncate text-sm font-medium">
                      {row.firstName} {row.lastName}
                      {rowAge != null ? (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          · {rowAge}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-2 text-xs">
                      <span
                        className={cn(
                          "inline-block size-1.5 rounded-full",
                          status === "committed" && "bg-emerald-500",
                          status === "declined" && "bg-destructive",
                          status === "pending" && "bg-muted-foreground/40",
                        )}
                        aria-hidden
                      />
                      {commitmentLabel(status)}
                      <span>·</span>
                      <span>
                        {count} {count === 1 ? "event" : "events"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </aside>

      {/* Timing board */}
      <section
        className={cn(
          "border-border bg-card flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border",
          "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200",
        )}
        key={membershipId || "empty"}
      >
        {!selectedSwimmer ? (
          <div className="text-muted-foreground flex flex-1 items-center justify-center p-8 text-sm">
            Select a swimmer from the lane board.
          </div>
        ) : (
          <>
            <header className="border-border flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  {selectedSwimmer.firstName} {selectedSwimmer.lastName}
                  {age != null ? (
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      · {age}
                    </span>
                  ) : null}
                </h2>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {groupLabel(selectedSwimmer)} ·{" "}
                  {formatGenderLabel(selectedSwimmer.gender)}
                </p>
                {limitsSummary ? (
                  <p className="text-muted-foreground mt-1 text-xs">
                    Entry limits: {limitsSummary}
                    <span className="mx-1.5">·</span>
                    Current: {entryCounts.individual}I + {entryCounts.relay}R
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs uppercase tracking-wide">
                  Commitment
                </span>
                <Select
                  items={COMMITMENT_ITEMS}
                  value={commitmentStatus}
                  disabled={pending}
                  onValueChange={(value) => {
                    if (value == null) return;
                    startTransition(async () => {
                      await setMeetCommitmentAction(
                        teamId,
                        meetId,
                        membershipId,
                        value as CommitmentStatus,
                      );
                      refresh();
                    });
                  }}
                >
                  <SelectTrigger className="h-8 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {COMMITMENT_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto p-4">
              {limitAlert ? (
                <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
                  <AlertTriangleIcon />
                  <AlertTitle>{limitAlert.title}</AlertTitle>
                  <AlertDescription className="text-amber-800 dark:text-amber-100/90">
                    {limitAlert.description}
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  Entered
                </h3>
                {swimmerEntries.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No events yet. Add from available entries below.
                  </p>
                ) : (
                  <ul className="divide-border divide-y rounded-md border">
                    {swimmerEntries.map((entry) => {
                      const meetEvent = events.find(
                        (e) => e.id === entry.meetEventId,
                      );
                      const qtLabel = qtDisplay(meetEvent?.qualifyingTimeMs);
                      return (
                        <li
                          key={entry.id}
                          className="flex items-center gap-3 px-3 py-2.5"
                        >
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {formatEventLine(entry)}
                          </span>
                          <span
                            className="text-muted-foreground font-timing w-16 shrink-0 text-right text-xs tabular-nums"
                            title={
                              qtLabel ? `Qualifying time ${qtLabel}` : undefined
                            }
                          >
                            {qtLabel ? `QT ${qtLabel}` : ""}
                          </span>
                          <span className="font-timing w-20 shrink-0 text-right text-sm tabular-nums">
                            {seedDisplay(entry.seedTimeMs, course)}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={pending}
                            aria-label="Remove entry"
                            onClick={() => {
                              setPendingAction(`remove:${entry.id}`);
                              startTransition(async () => {
                                try {
                                  await deleteMeetEntryAction(
                                    teamId,
                                    meetId,
                                    entry.id,
                                  );
                                  refresh();
                                } finally {
                                  setPendingAction(null);
                                }
                              });
                            }}
                          >
                            {pendingAction === `remove:${entry.id}` ? (
                              <Spinner />
                            ) : (
                              <Minus className="size-4" />
                            )}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  Available
                </h3>
                {events.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Import a meet events file before building entries.
                  </p>
                ) : availableEvents.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No eligible events left for this swimmer.
                  </p>
                ) : (
                  <ul className="divide-border divide-y rounded-md border">
                    {availableEvents.map((event) => {
                      const best = bestSeedFor(event.eventKey);
                      const candidateIsRelay = isRelayStroke(
                        event.stroke,
                        event.eventKey,
                      );
                      const limitCheck = canAddMeetEntry(
                        limits,
                        entryCounts,
                        candidateIsRelay,
                      );
                      const resolved = resolveSeed(event.id, event.eventKey);
                      const seedMs = resolved?.seedTimeMs ?? null;
                      const qtMs = event.qualifyingTimeMs;
                      const missesQt =
                        qtMs != null &&
                        qtMs > 0 &&
                        seedMs != null &&
                        seedMs > 0 &&
                        seedMs > qtMs;
                      return (
                        <li
                          key={event.id}
                          className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:flex-nowrap"
                        >
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {formatEventLine(event)}
                          </span>
                          <span
                            className="text-muted-foreground font-timing w-16 shrink-0 text-right text-xs tabular-nums"
                            title={
                              qtMs != null && qtMs > 0
                                ? `Qualifying time ${formatTime(qtMs)}`
                                : undefined
                            }
                          >
                            {qtMs != null && qtMs > 0
                              ? `QT ${formatTime(qtMs)}`
                              : ""}
                          </span>
                          <Input
                            className={cn(
                              "font-timing h-8 w-24 text-sm tabular-nums",
                              missesQt && "border-amber-500/80",
                            )}
                            placeholder="NT"
                            value={seedInputValue(event.id, event.eventKey)}
                            onChange={(e) =>
                              setSeedDrafts((prev) => ({
                                ...prev,
                                [event.id]: e.target.value,
                              }))
                            }
                            aria-label={`Seed time for ${formatEventName(event.distance, event.stroke)}`}
                            aria-invalid={missesQt || undefined}
                          />
                          {best != null &&
                          seedDrafts[event.id] === undefined ? (
                            <span className="text-muted-foreground sr-only sm:not-sr-only sm:text-xs">
                              best
                            </span>
                          ) : null}
                          {missesQt ? (
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <span className="text-amber-700 dark:text-amber-400 inline-flex items-center gap-1 text-xs" />
                                }
                                aria-label="Seed slower than qualifying time"
                              >
                                <AlertTriangleIcon className="size-3.5 shrink-0" />
                                <span className="sr-only sm:not-sr-only">
                                  Slow vs QT
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                Seed {formatTime(seedMs!)} is slower than the
                                meet QT {formatTime(qtMs!)}. Edit the seed if
                                you have a faster practice or time-trial time.
                              </TooltipContent>
                            </Tooltip>
                          ) : null}
                          <AddEntryButton
                            disabled={
                              pending || !membershipId || !limitCheck.ok
                            }
                            limitReason={
                              !limitCheck.ok ? limitCheck.reason : undefined
                            }
                            pending={pendingAction === `add:${event.id}`}
                            onClick={() => addEntry(event)}
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

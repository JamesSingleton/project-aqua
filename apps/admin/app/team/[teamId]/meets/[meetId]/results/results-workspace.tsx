"use client";

import { swimmerAgeOnDate } from "@project-aqua/swim-core/age";
import { formatDateOnlyLabel } from "@project-aqua/swim-core/calendar-date";
import { isRelayStroke } from "@project-aqua/swim-core/entry-limits";
import {
  formatEventName,
  formatGenderShort,
} from "@project-aqua/swim-core/events";
import { formatTime } from "@project-aqua/swim-core/times";
import { Badge } from "@project-aqua/ui/components/badge";
import { Label } from "@project-aqua/ui/components/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/ui/components/select";
import { Switch } from "@project-aqua/ui/components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@project-aqua/ui/components/table";
import { cn } from "@project-aqua/ui/lib/utils";
import { RabbitIcon, TargetIcon, TurtleIcon } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { getTimeStandardCutsAction } from "../../time-standards-actions";
import { AddResultForm } from "../add-result-form";

export type ResultRow = {
  id: string;
  meetEventId: string;
  swimmerId: string;
  timeMs: number;
  previousBestTimeMs: number | null;
  place: number | null;
  isDq: boolean;
  round: "prelim" | "swimoff" | "finals" | null;
  heat: number | null;
  lane: number | null;
  exhibition: boolean;
  dqCode: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | string | null;
  eventNumber: number | null;
  distance: number;
  stroke: string;
  gender: string;
  ageGroup: string | null;
  eventKey: string;
};

type EventOption = { id: string; label: string };
type SwimmerOption = { swimmerId: string; name: string };

type StandardSetOption = {
  id: string;
  name: string;
  course: string;
  seasonLabel: string | null;
};

type StandardCut = {
  eventKey: string;
  gender: string;
  ageGroup: string;
  timeMs: number;
};

type GroupMode = "event" | "swimmer";
type RoundFilter = "all" | "prelim" | "swimoff" | "finals";

function eventLabel(row: ResultRow) {
  const gender = formatGenderShort(row.gender);
  return `#${row.eventNumber ?? "—"} ${gender} ${formatEventName(row.distance, row.stroke)}`.replace(
    /\s+/g,
    " ",
  );
}

function isPersonalBest(row: ResultRow) {
  if (
    row.isDq ||
    row.previousBestTimeMs == null ||
    row.previousBestTimeMs <= 0
  ) {
    return false;
  }
  return row.timeMs > 0 && row.timeMs < row.previousBestTimeMs;
}

/** Seconds delta: negative = faster (drop). */
function improvementSeconds(row: ResultRow): number | null {
  if (
    row.isDq ||
    row.previousBestTimeMs == null ||
    row.previousBestTimeMs <= 0 ||
    row.timeMs <= 0
  ) {
    return null;
  }
  return (row.timeMs - row.previousBestTimeMs) / 1000;
}

function formatImprovement(
  deltaSec: number | null,
  showPercent: boolean,
  previousBestTimeMs: number | null,
): string {
  if (deltaSec == null) return "—";
  const sign = deltaSec > 0 ? "+" : "";
  const seconds = `${sign}${deltaSec.toFixed(2)}s`;
  if (showPercent && previousBestTimeMs != null && previousBestTimeMs > 0) {
    const pct = (deltaSec * 1000 * 100) / previousBestTimeMs;
    const pctSign = pct > 0 ? "+" : "";
    return `${seconds} (${pctSign}${pct.toFixed(1)}%)`;
  }
  return seconds;
}

function ageGroupCandidates(
  age: number | null,
  eventAgeGroup: string | null,
): string[] {
  const out: string[] = [];
  if (eventAgeGroup) out.push(eventAgeGroup);
  if (age == null) {
    out.push("Open", "Senior");
    return out;
  }
  if (age <= 8) out.push("8&U", "8 & Under", "10&U");
  else if (age <= 10) out.push("10&U", "10 & Under", "9-10", "8-10");
  else if (age <= 12) out.push("11-12", "12&U");
  else if (age <= 14) out.push("13-14", "14&U");
  else if (age <= 16) out.push("15-16", "16&U");
  else if (age <= 18) out.push("17-18", "18&U", "15-18");
  out.push("Open", "Senior", "Open/Senior");
  return out;
}

function findCutTime(
  cuts: StandardCut[],
  row: ResultRow,
  meetStartDate: Date,
): number | null {
  if (cuts.length === 0) return null;
  const age = swimmerAgeOnDate(row.dateOfBirth, meetStartDate);
  const candidates = ageGroupCandidates(age, row.ageGroup);
  const genderNorm =
    row.gender === "f" || row.gender === "female"
      ? "female"
      : row.gender === "x" || row.gender === "mixed"
        ? "mixed"
        : "male";

  for (const ageGroup of candidates) {
    const match = cuts.find(
      (c) =>
        c.eventKey === row.eventKey &&
        c.gender === genderNorm &&
        c.ageGroup.toLowerCase() === ageGroup.toLowerCase(),
    );
    if (match) return match.timeMs;
  }

  // Fallback: same eventKey + gender, any age group labeled open/senior
  const open = cuts.find(
    (c) =>
      c.eventKey === row.eventKey &&
      c.gender === genderNorm &&
      /open|senior/i.test(c.ageGroup),
  );
  return open?.timeMs ?? null;
}

/** Swim times: lower is faster. */
type StandardCompare = "faster" | "equal" | "slower";

function compareToStandard(
  timeMs: number,
  cutMs: number,
  isDq: boolean,
): StandardCompare | null {
  if (isDq || timeMs <= 0 || cutMs <= 0) return null;
  if (timeMs < cutMs) return "faster";
  if (timeMs === cutMs) return "equal";
  return "slower";
}

const ROUND_LABEL: Record<string, string> = {
  prelim: "Prelim",
  swimoff: "Swim-off",
  finals: "Finals",
};

const ROUND_SORT: Record<string, number> = {
  prelim: 0,
  swimoff: 1,
  finals: 2,
};

function roundSortKey(round: ResultRow["round"]) {
  if (!round) return 3;
  return ROUND_SORT[round] ?? 3;
}

function compareResultRows(a: ResultRow, b: ResultRow) {
  const roundDiff = roundSortKey(a.round) - roundSortKey(b.round);
  if (roundDiff !== 0) return roundDiff;
  if (a.place != null && b.place != null) return a.place - b.place;
  if (a.place != null) return -1;
  if (b.place != null) return 1;
  return a.timeMs - b.timeMs;
}

/** Compact heat/lane/round/exhibition/DQ-code badges shown under a result's time. */
function ResultMetaBadges({ row }: { row: ResultRow }) {
  const hasHeatLane = row.heat != null || row.lane != null;
  if (
    !hasHeatLane &&
    !row.round &&
    !row.exhibition &&
    !(row.isDq && row.dqCode)
  ) {
    return null;
  }
  return (
    <span className="mt-1 flex flex-wrap items-center gap-1">
      {row.round ? (
        <Badge variant="outline" className="h-4.5 px-1.5 text-[10px]">
          {ROUND_LABEL[row.round] ?? row.round}
        </Badge>
      ) : null}
      {hasHeatLane ? (
        <Badge variant="outline" className="h-4.5 px-1.5 text-[10px]">
          H{row.heat ?? "—"} L{row.lane ?? "—"}
        </Badge>
      ) : null}
      {row.exhibition ? (
        <Badge variant="secondary" className="h-4.5 px-1.5 text-[10px]">
          Exhibition
        </Badge>
      ) : null}
      {row.isDq && row.dqCode ? (
        <Badge variant="destructive" className="h-4.5 px-1.5 text-[10px]">
          {row.dqCode}
        </Badge>
      ) : null}
    </span>
  );
}

function StandardCompareIndicator({
  compare,
}: {
  compare: StandardCompare | null;
}) {
  if (!compare) return null;

  if (compare === "faster") {
    return (
      <span
        className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400"
        title="Faster than standard"
      >
        <RabbitIcon className="size-3.5 shrink-0" aria-hidden />
        <span className="sr-only">Faster than standard</span>
      </span>
    );
  }

  if (compare === "equal") {
    return (
      <span
        className="text-muted-foreground inline-flex items-center gap-0.5"
        title="Exactly at standard"
      >
        <TargetIcon className="size-3.5 shrink-0" aria-hidden />
        <span className="sr-only">Exactly at standard</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-0.5 text-amber-700 dark:text-amber-400"
      title="Slower than standard"
    >
      <TurtleIcon className="size-3.5 shrink-0" aria-hidden />
      <span className="sr-only">Slower than standard</span>
    </span>
  );
}

export function ResultsWorkspace({
  teamId,
  meetId,
  meetName,
  meetStartDate,
  results,
  events,
  swimmers,
  standardSets,
}: {
  teamId: string;
  meetId: string;
  meetName: string;
  meetStartDate: Date;
  results: ResultRow[];
  events: EventOption[];
  swimmers: SwimmerOption[];
  standardSets: StandardSetOption[];
}) {
  const [pbtsOnly, setPbtsOnly] = useState(false);
  const [showPercent, setShowPercent] = useState(false);
  const [groupMode, setGroupMode] = useState<GroupMode>("event");
  const [roundFilter, setRoundFilter] = useState<RoundFilter>("all");
  const [showStandards, setShowStandards] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState(standardSets[0]?.id ?? "");
  const [cuts, setCuts] = useState<StandardCut[]>([]);
  const [cutsPending, startCutsTransition] = useTransition();

  useEffect(() => {
    if (!showStandards || !selectedSetId) {
      setCuts([]);
      return;
    }
    startCutsTransition(async () => {
      try {
        const data = await getTimeStandardCutsAction(teamId, selectedSetId);
        setCuts(data.cuts);
      } catch {
        setCuts([]);
      }
    });
  }, [showStandards, selectedSetId, teamId]);

  const availableRounds = useMemo(() => {
    const rounds = new Set<ResultRow["round"]>();
    for (const row of results) {
      if (row.round) rounds.add(row.round);
    }
    const order: Array<NonNullable<ResultRow["round"]>> = [
      "prelim",
      "swimoff",
      "finals",
    ];
    return order.filter((r) => rounds.has(r));
  }, [results]);

  const filtered = useMemo(() => {
    let rows = results;
    if (roundFilter !== "all") {
      rows = rows.filter((r) => r.round === roundFilter);
    }
    if (!pbtsOnly) return rows;
    return rows.filter(isPersonalBest);
  }, [results, roundFilter, pbtsOnly]);

  const summary = useMemo(() => {
    const relayCount = results.filter((r) =>
      isRelayStroke(r.stroke, r.eventKey),
    ).length;
    const individualCount = results.length - relayCount;
    const athleteCount = new Set(results.map((r) => r.swimmerId)).size;
    const pbtCount = results.filter(isPersonalBest).length;
    return { individualCount, relayCount, athleteCount, pbtCount };
  }, [results]);

  const groups = useMemo(() => {
    if (groupMode === "swimmer") {
      const bySwimmer = new Map<
        string,
        { label: string; sortKey: string; rows: ResultRow[] }
      >();
      for (const row of filtered) {
        const key = row.swimmerId;
        const existing = bySwimmer.get(key);
        if (existing) {
          existing.rows.push(row);
          continue;
        }
        bySwimmer.set(key, {
          label: `${row.firstName} ${row.lastName}`,
          sortKey: `${row.lastName} ${row.firstName}`.toLowerCase(),
          rows: [row],
        });
      }
      return [...bySwimmer.values()]
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
        .map((g) => ({
          ...g,
          rows: [...g.rows].sort((a, b) => {
            const an = a.eventNumber ?? Number.MAX_SAFE_INTEGER;
            const bn = b.eventNumber ?? Number.MAX_SAFE_INTEGER;
            return an - bn || compareResultRows(a, b);
          }),
        }));
    }

    const byEvent = new Map<
      string,
      { label: string; eventNumber: number | null; rows: ResultRow[] }
    >();
    for (const row of filtered) {
      const existing = byEvent.get(row.meetEventId);
      if (existing) {
        existing.rows.push(row);
        continue;
      }
      byEvent.set(row.meetEventId, {
        eventNumber: row.eventNumber,
        label: eventLabel(row),
        rows: [row],
      });
    }
    return [...byEvent.values()]
      .sort((a, b) => {
        const an = a.eventNumber ?? Number.MAX_SAFE_INTEGER;
        const bn = b.eventNumber ?? Number.MAX_SAFE_INTEGER;
        return an - bn;
      })
      .map((g) => ({
        label: g.label,
        rows: [...g.rows].sort(compareResultRows),
      }));
  }, [filtered, groupMode]);

  const hasSets = standardSets.length > 0;
  const standardSetOptions = standardSets.map((set) => ({
    value: set.id,
    label: `${set.name}${set.seasonLabel ? ` (${set.seasonLabel})` : ""}`,
  }));

  const nameColumnLabel = groupMode === "event" ? "Swimmer" : "Event";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <div className="bg-muted/40 min-w-28 rounded-lg border px-4 py-3">
          <p className="text-2xl font-semibold tabular-nums">
            {summary.individualCount}
          </p>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Individual
          </p>
        </div>
        <div className="bg-muted/40 min-w-28 rounded-lg border px-4 py-3">
          <p className="text-2xl font-semibold tabular-nums">
            {summary.relayCount}
          </p>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Relays
          </p>
        </div>
        <div className="bg-muted/40 min-w-28 rounded-lg border px-4 py-3">
          <p className="text-2xl font-semibold tabular-nums">
            {summary.athleteCount}
          </p>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Athletes
          </p>
        </div>
        <div className="bg-muted/40 min-w-28 rounded-lg border px-4 py-3">
          <p className="text-2xl font-semibold tabular-nums">
            {summary.pbtCount}
          </p>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            PBTs
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border px-4 py-3">
        <div className="flex items-center gap-2">
          <Switch
            id="pbts-only"
            checked={pbtsOnly}
            onCheckedChange={setPbtsOnly}
          />
          <Label htmlFor="pbts-only" className="text-sm font-normal">
            PBTs only
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="show-percent"
            checked={showPercent}
            onCheckedChange={setShowPercent}
          />
          <Label htmlFor="show-percent" className="text-sm font-normal">
            Show %
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="by-swimmer"
            checked={groupMode === "swimmer"}
            onCheckedChange={(checked) =>
              setGroupMode(checked ? "swimmer" : "event")
            }
          />
          <Label htmlFor="by-swimmer" className="text-sm font-normal">
            By swimmer
          </Label>
        </div>
        {availableRounds.length > 0 ? (
          <div className="flex items-center gap-2">
            <Label htmlFor="round-filter" className="text-sm font-normal">
              Round
            </Label>
            <Select
              items={[
                { value: "all", label: "All" },
                ...availableRounds.map((round) => ({
                  value: round,
                  label: ROUND_LABEL[round] ?? round,
                })),
              ]}
              value={roundFilter}
              onValueChange={(v) => setRoundFilter((v ?? "all") as RoundFilter)}
            >
              <SelectTrigger id="round-filter" className="h-8 w-32" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All</SelectItem>
                  {availableRounds.map((round) => (
                    <SelectItem key={round} value={round}>
                      {ROUND_LABEL[round] ?? round}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div
          className={cn(
            "flex flex-wrap items-center gap-2",
            !hasSets && "opacity-60",
          )}
        >
          <Switch
            id="show-standards"
            checked={showStandards}
            onCheckedChange={setShowStandards}
            disabled={!hasSets}
            size="sm"
          />
          <Label
            htmlFor="show-standards"
            className={cn(
              "text-sm font-normal",
              !hasSets && "text-muted-foreground",
            )}
          >
            {hasSets
              ? "Show time standards"
              : "Time standards (no sets loaded)"}
          </Label>
          {showStandards && hasSets ? (
            <Select
              items={standardSetOptions}
              value={selectedSetId}
              onValueChange={(v) => setSelectedSetId(v ?? "")}
            >
              <SelectTrigger className="h-8 w-48" size="sm">
                <SelectValue placeholder="Select set" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {standardSets.map((set) => (
                    <SelectItem key={set.id} value={set.id}>
                      {set.name}
                      {set.seasonLabel ? ` (${set.seasonLabel})` : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          ) : null}
          {cutsPending ? (
            <span className="text-muted-foreground text-xs">Loading…</span>
          ) : null}
          {showStandards && hasSets && !cutsPending ? (
            <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-0.5">
                <RabbitIcon className="size-3" aria-hidden /> Under = faster
              </span>
              <span className="inline-flex items-center gap-0.5">
                <TargetIcon className="size-3" aria-hidden /> At = equal
              </span>
              <span className="inline-flex items-center gap-0.5">
                <TurtleIcon className="size-3" aria-hidden /> Over = slower
              </span>
            </p>
          ) : null}
        </div>
      </div>

      <AddResultForm
        teamId={teamId}
        meetId={meetId}
        events={events}
        swimmers={swimmers}
      />

      {groups.length === 0 ? (
        <div className="border-border rounded-lg border px-4 py-8 text-center">
          <p className="text-muted-foreground text-sm">
            {results.length === 0
              ? "No results yet. Import a meet file or add a time manually."
              : "No personal bests match this filter."}
          </p>
        </div>
      ) : (
        groups.map((group) => (
          <div
            key={group.label}
            className="border-border overflow-hidden rounded-lg border"
          >
            <div className="border-border bg-muted/30 border-b px-4 py-3">
              <h3 className="text-sm font-semibold">{group.label}</h3>
              <p className="text-muted-foreground text-xs">
                {group.rows.length}{" "}
                {group.rows.length === 1 ? "result" : "results"}
              </p>
            </div>
            <Table className="table-fixed [&_th]:px-4 [&_td]:px-4">
              <colgroup>
                {showStandards ? (
                  <>
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "7%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "27%" }} />
                  </>
                ) : (
                  <>
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "30%" }} />
                  </>
                )}
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead>{nameColumnLabel}</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Previous Best</TableHead>
                  {showStandards ? <TableHead>Standard</TableHead> : null}
                  <TableHead>Place</TableHead>
                  <TableHead>Improvement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.rows.map((row) => {
                  const age = swimmerAgeOnDate(row.dateOfBirth, meetStartDate);
                  const delta = improvementSeconds(row);
                  const faster = delta != null && delta < 0;
                  const slower = delta != null && delta > 0;
                  const cutMs = showStandards
                    ? findCutTime(cuts, row, meetStartDate)
                    : null;
                  const standardCompare =
                    cutMs != null
                      ? compareToStandard(row.timeMs, cutMs, row.isDq)
                      : null;
                  const meetsCut =
                    standardCompare === "faster" || standardCompare === "equal";
                  const newlyQualifies =
                    meetsCut &&
                    row.previousBestTimeMs != null &&
                    cutMs != null &&
                    row.previousBestTimeMs > cutMs;
                  const primaryLabel =
                    groupMode === "event"
                      ? `${row.firstName} ${row.lastName}`
                      : eventLabel(row);
                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        newlyQualifies && "bg-emerald-500/5",
                        meetsCut && !newlyQualifies && "bg-sky-500/5",
                      )}
                    >
                      <TableCell className="max-w-0 font-medium">
                        <span className="block truncate" title={primaryLabel}>
                          {primaryLabel}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {age ?? "—"}
                      </TableCell>
                      <TableCell className="font-timing tabular-nums">
                        <span className="flex flex-col">
                          <span
                            className={cn(
                              row.isDq && "text-destructive line-through",
                            )}
                          >
                            {row.isDq
                              ? `DQ ${formatTime(row.timeMs)}`
                              : formatTime(row.timeMs)}
                          </span>
                          <ResultMetaBadges row={row} />
                        </span>
                      </TableCell>
                      <TableCell className="font-timing tabular-nums">
                        {row.previousBestTimeMs != null &&
                        row.previousBestTimeMs > 0
                          ? formatTime(row.previousBestTimeMs)
                          : "—"}
                      </TableCell>
                      {showStandards ? (
                        <TableCell
                          className={cn(
                            "font-timing",
                            standardCompare === "faster" &&
                              "text-emerald-700 dark:text-emerald-400",
                            standardCompare === "slower" &&
                              "text-amber-800 dark:text-amber-400",
                          )}
                          title={
                            newlyQualifies
                              ? "Newly qualifies vs previous best"
                              : standardCompare === "faster"
                                ? "Faster than standard"
                                : standardCompare === "equal"
                                  ? "Exactly at standard"
                                  : standardCompare === "slower"
                                    ? "Slower than standard"
                                    : undefined
                          }
                        >
                          {cutMs != null ? (
                            <span className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                              <span className="tabular-nums font-semibold">
                                {formatTime(cutMs)}
                              </span>
                              <StandardCompareIndicator
                                compare={standardCompare}
                              />
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      ) : null}
                      <TableCell className="tabular-nums">
                        {row.place ?? "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "font-timing tabular-nums",
                          faster && "text-emerald-600 dark:text-emerald-400",
                          slower && "text-red-600 dark:text-red-400",
                        )}
                      >
                        {formatImprovement(
                          delta,
                          showPercent,
                          row.previousBestTimeMs,
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ))
      )}

      <p className="text-muted-foreground sr-only">
        Results for {meetName} on {formatDateOnlyLabel(meetStartDate)}
      </p>
    </div>
  );
}

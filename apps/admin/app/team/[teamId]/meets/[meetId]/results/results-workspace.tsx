"use client";

import { formatEventName } from "@project-aqua/swim-core/events";
import { formatTime } from "@project-aqua/swim-core/times";
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

function formatGenderShort(gender: string) {
  if (gender === "female" || gender === "f") return "F";
  if (gender === "mixed" || gender === "x") return "X";
  if (gender === "male" || gender === "m") return "M";
  return "";
}

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

function isRelayStroke(stroke: string, eventKey: string) {
  return (
    stroke.includes("relay") ||
    eventKey.includes("relay") ||
    stroke === "free_relay" ||
    stroke === "medley_relay"
  );
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
  const age = ageAsOf(row.dateOfBirth, meetStartDate);
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

  const filtered = useMemo(() => {
    if (!pbtsOnly) return results;
    return results.filter(isPersonalBest);
  }, [results, pbtsOnly]);

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
            return an - bn;
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
        rows: [...g.rows].sort((a, b) => {
          if (a.place != null && b.place != null) return a.place - b.place;
          if (a.place != null) return -1;
          if (b.place != null) return 1;
          return a.timeMs - b.timeMs;
        }),
      }));
  }, [filtered, groupMode]);

  const hasSets = standardSets.length > 0;
  const standardSetOptions = standardSets.map((set) => ({
    value: set.id,
    label: `${set.name}${set.seasonLabel ? ` (${set.seasonLabel})` : ""}`,
  }));

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
            {groupMode === "swimmer" ? "By swimmer" : "By event"}
          </Label>
        </div>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {groupMode === "event" ? "Swimmer" : "Event"}
                  </TableHead>
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
                  const age = ageAsOf(row.dateOfBirth, meetStartDate);
                  const delta = improvementSeconds(row);
                  const faster = delta != null && delta < 0;
                  const slower = delta != null && delta > 0;
                  const cutMs = showStandards
                    ? findCutTime(cuts, row, meetStartDate)
                    : null;
                  const meetsCut =
                    cutMs != null &&
                    !row.isDq &&
                    row.timeMs > 0 &&
                    row.timeMs <= cutMs;
                  const newlyQualifies =
                    meetsCut &&
                    row.previousBestTimeMs != null &&
                    row.previousBestTimeMs > cutMs;
                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        newlyQualifies && "bg-emerald-500/5",
                        meetsCut && !newlyQualifies && "bg-sky-500/5",
                      )}
                    >
                      <TableCell className="font-medium">
                        {groupMode === "event"
                          ? `${row.firstName} ${row.lastName}`
                          : eventLabel(row)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {age ?? "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "font-timing tabular-nums",
                          row.isDq && "text-destructive line-through",
                        )}
                      >
                        {row.isDq
                          ? `DQ ${formatTime(row.timeMs)}`
                          : formatTime(row.timeMs)}
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
                            "font-timing tabular-nums",
                            meetsCut &&
                              "text-emerald-700 dark:text-emerald-400",
                          )}
                          title={
                            newlyQualifies
                              ? "Newly qualifies vs previous best"
                              : meetsCut
                                ? "Meets standard"
                                : undefined
                          }
                        >
                          {cutMs != null ? formatTime(cutMs) : "—"}
                        </TableCell>
                      ) : null}
                      <TableCell className="tabular-nums">
                        {row.place ?? "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "font-timing tabular-nums",
                          faster && "text-emerald-600 dark:text-emerald-400",
                          slower && "text-muted-foreground",
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
        Results for {meetName} on {meetStartDate.toLocaleDateString()}
      </p>
    </div>
  );
}

"use client";

import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import { Checkbox } from "@project-aqua/ui/components/checkbox";
import { Field, FieldLabel } from "@project-aqua/ui/components/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/ui/components/select";
import { Lock, LockOpen, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  type RelayLegSuggestion,
  suggestRelayOrderAction,
} from "../relay-actions";

type RelayEvent = { id: string; label: string };

type SavedLeg = {
  meetEventId: string;
  membershipId: string;
  legOrder: number;
  stroke: string | null;
  reasoning: string | null;
  name: string;
};

const RELAY_TEAM_COUNT_ITEMS = [
  { value: "1", label: "A only" },
  { value: "2", label: "A + B" },
  { value: "3", label: "A + B + C" },
] as const;

const RELAY_OPTIMIZATION_ITEMS = [
  { value: "speed", label: "Speed" },
  { value: "participation", label: "Participation" },
] as const;

export function RelaySuggestPanel({
  teamId,
  meetId,
  events,
  initialLegs,
  maxRelayEntries,
}: {
  teamId: string;
  meetId: string;
  events: RelayEvent[];
  initialLegs: SavedLeg[];
  maxRelayEntries?: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [numberOfRelays, setNumberOfRelays] = useState<1 | 2 | 3>(1);
  const [allowDoubles, setAllowDoubles] = useState(false);
  const [optimizeFor, setOptimizeFor] = useState<"speed" | "participation">(
    "speed",
  );
  const [lockedByEvent, setLockedByEvent] = useState<Record<string, boolean>>(
    {},
  );
  const [legsByEvent, setLegsByEvent] = useState<
    Record<string, RelayLegSuggestion[]>
  >(() => groupInitialLegs(initialLegs));
  const [summaryByEvent, setSummaryByEvent] = useState<Record<string, string>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);

  function regenerate(meetEventId: string) {
    if (lockedByEvent[meetEventId]) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await suggestRelayOrderAction(teamId, {
          meetId,
          meetEventId,
          numberOfRelays,
          allowDoubles,
          optimizeFor,
        });
        setLegsByEvent((prev) => ({
          ...prev,
          [meetEventId]: result.legs,
        }));
        setSummaryByEvent((prev) => ({
          ...prev,
          [meetEventId]: result.summary,
        }));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI relay order</CardTitle>
          <CardDescription>
            Add a free or medley relay event to this meet, then suggest a leg
            order.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>AI relay constraints</CardTitle>
          <CardDescription>
            Uses committed roster (falls back to full roster).{" "}
            {maxRelayEntries != null
              ? `Max relay entries per swimmer: ${maxRelayEntries}.`
              : "No relay entry limit set on this meet."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <Field className="w-36">
            <FieldLabel htmlFor="relay-team-count">Teams (A/B/C)</FieldLabel>
            <Select
              items={RELAY_TEAM_COUNT_ITEMS}
              value={String(numberOfRelays)}
              onValueChange={(v) => {
                if (v === "1" || v === "2" || v === "3") {
                  setNumberOfRelays(Number(v) as 1 | 2 | 3);
                }
              }}
            >
              <SelectTrigger id="relay-team-count" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {RELAY_TEAM_COUNT_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field className="w-40">
            <FieldLabel htmlFor="relay-optimization">Optimize for</FieldLabel>
            <Select
              items={RELAY_OPTIMIZATION_ITEMS}
              value={optimizeFor}
              onValueChange={(v) => {
                if (v === "speed" || v === "participation") {
                  setOptimizeFor(v);
                }
              }}
            >
              <SelectTrigger id="relay-optimization" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {RELAY_OPTIMIZATION_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field orientation="horizontal" className="w-auto pb-2">
            <Checkbox
              id="relay-allow-doubles"
              checked={allowDoubles}
              onCheckedChange={(checked) => setAllowDoubles(checked === true)}
            />
            <FieldLabel htmlFor="relay-allow-doubles" className="font-normal">
              Allow doubles
            </FieldLabel>
          </Field>
        </CardContent>
      </Card>

      {events.map((event) => {
        const locked = lockedByEvent[event.id] ?? false;
        const legs = legsByEvent[event.id] ?? [];
        const teams = groupLegsByTeam(legs);
        return (
          <Card key={event.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="text-base">{event.label}</CardTitle>
                <CardDescription>
                  {summaryByEvent[event.id] ||
                    (legs.length
                      ? `${legs.length} legs assigned`
                      : "No suggestion yet")}
                </CardDescription>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setLockedByEvent((prev) => ({
                      ...prev,
                      [event.id]: !locked,
                    }))
                  }
                >
                  {locked ? (
                    <Lock data-icon="inline-start" />
                  ) : (
                    <LockOpen data-icon="inline-start" />
                  )}
                  {locked ? "Locked" : "Lock"}
                </Button>
                <Button
                  type="button"
                  disabled={pending || locked}
                  onClick={() => regenerate(event.id)}
                >
                  <RefreshCw data-icon="inline-start" />
                  {pending
                    ? "Working…"
                    : legs.length
                      ? "Regenerate"
                      : "Suggest"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {teams.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Generate a relay order to see legs here.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {teams.map((team) => (
                    <div key={team.letter} className="rounded-md border p-3">
                      <p className="mb-2 text-sm font-medium">
                        Team {team.letter}
                      </p>
                      <ol className="flex flex-col gap-1 text-sm">
                        {team.legs.map((leg) => (
                          <li key={`${leg.legOrder}-${leg.membershipId}`}>
                            <span className="text-muted-foreground tabular-nums">
                              {((leg.legOrder - 1) % 4) + 1}.
                            </span>{" "}
                            {leg.name}
                            {leg.stroke ? (
                              <span className="text-muted-foreground">
                                {" "}
                                · {leg.stroke}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function groupInitialLegs(
  legs: SavedLeg[],
): Record<string, RelayLegSuggestion[]> {
  const byEvent: Record<string, RelayLegSuggestion[]> = {};
  for (const leg of legs) {
    const teamIndex = Math.floor((leg.legOrder - 1) / 4);
    const letter = ["A", "B", "C"][teamIndex] ?? "A";
    const list = byEvent[leg.meetEventId] ?? [];
    list.push({
      membershipId: leg.membershipId,
      legOrder: leg.legOrder,
      stroke: leg.stroke ?? undefined,
      reasoning: leg.reasoning ?? undefined,
      teamLetter: letter,
      name: leg.name,
    });
    byEvent[leg.meetEventId] = list;
  }
  for (const key of Object.keys(byEvent)) {
    byEvent[key] = [...(byEvent[key] ?? [])].sort(
      (a, b) => a.legOrder - b.legOrder,
    );
  }
  return byEvent;
}

function groupLegsByTeam(legs: RelayLegSuggestion[]) {
  const map = new Map<string, RelayLegSuggestion[]>();
  for (const leg of legs) {
    const list = map.get(leg.teamLetter) ?? [];
    list.push(leg);
    map.set(leg.teamLetter, list);
  }
  return [...map.entries()]
    .map(([letter, teamLegs]) => ({
      letter,
      legs: [...teamLegs].sort((a, b) => a.legOrder - b.legOrder),
    }))
    .sort((a, b) => a.letter.localeCompare(b.letter));
}

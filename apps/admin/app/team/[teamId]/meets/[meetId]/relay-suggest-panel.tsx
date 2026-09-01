"use client";

import {
  deriveRelayLetter,
  isRelayAlternateSlot,
  RELAY_MAX_LEGS,
  RELAY_TEAM_LETTERS,
  relaySlotLabel,
  strokeForRelayLeg,
} from "@project-aqua/swim-core/relay-legs";
import { formatTime } from "@project-aqua/swim-core/times";
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
import { Lock, LockOpen, RefreshCw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  DraftQuotaHint,
  isDraftQuotaBlocked,
  type SharedDraftQuota,
} from "@/components/draft-quota-hint";
import {
  type RelayLegSuggestion,
  saveMeetRelayLegsAction,
  suggestRelayOrderAction,
} from "../relay-actions";

type RelayEvent = {
  id: string;
  label: string;
  stroke: string;
  eventKey: string;
};

type SavedLeg = {
  meetEventId: string;
  membershipId: string;
  legOrder: number;
  relayLetter?: string | null;
  stroke: string | null;
  reasoning: string | null;
  name: string;
};

type Candidate = { membershipId: string; name: string };
type BestTimeRow = { membershipId: string; eventKey: string; timeMs: number };

const RELAY_TEAM_COUNT_ITEMS = [
  { value: "1", label: "A only" },
  { value: "2", label: "A + B" },
  { value: "3", label: "A + B + C" },
] as const;

const RELAY_OPTIMIZATION_ITEMS = [
  { value: "speed", label: "Speed" },
  { value: "participation", label: "Participation" },
] as const;

const EMPTY_SLOT = "__none__";
const SLOTS = Array.from({ length: RELAY_MAX_LEGS }, (_, i) => i + 1);

export function RelaySuggestPanel({
  teamId,
  meetId,
  events,
  initialLegs,
  maxRelayEntries,
  candidates,
  bestTimes,
  draftQuota: initialDraftQuota,
}: {
  teamId: string;
  meetId: string;
  events: RelayEvent[];
  initialLegs: SavedLeg[];
  maxRelayEntries?: number | null;
  candidates: Candidate[];
  bestTimes: BestTimeRow[];
  draftQuota: SharedDraftQuota;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draftQuota, setDraftQuota] = useState(initialDraftQuota);
  const suggestBlocked = isDraftQuotaBlocked(draftQuota);
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

  const timeByMemberAndKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of bestTimes) {
      const key = `${row.membershipId}|${row.eventKey}`;
      const prev = map.get(key);
      if (prev == null || row.timeMs < prev) map.set(key, row.timeMs);
    }
    return map;
  }, [bestTimes]);

  function splitMs(
    membershipId: string,
    event: RelayEvent,
    slot: number,
  ): number | null {
    const stroke = strokeForRelayLeg(event.stroke, slot);
    const splitKey = event.eventKey.replace(
      /_(free_relay|medley_relay|free|back|breast|fly|im)_/,
      `_${stroke}_`,
    );
    return (
      timeByMemberAndKey.get(`${membershipId}|${splitKey}`) ??
      timeByMemberAndKey.get(`${membershipId}|${event.eventKey}`) ??
      null
    );
  }

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
          [meetEventId]: mergeSuggestedWithAlternates(
            prev[meetEventId] ?? [],
            result.legs,
          ),
        }));
        setSummaryByEvent((prev) => ({
          ...prev,
          [meetEventId]: result.summary,
        }));
        if (result.draftQuota) {
          setDraftQuota(result.draftQuota);
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function setSlot(
    meetEventId: string,
    letter: string,
    slot: number,
    membershipId: string,
    event: RelayEvent,
  ) {
    setLegsByEvent((prev) => {
      const current = prev[meetEventId] ?? [];
      const without = current.filter(
        (leg) => !(leg.teamLetter === letter && leg.legOrder === slot),
      );
      if (!membershipId) {
        return { ...prev, [meetEventId]: without };
      }
      const candidate = candidates.find((c) => c.membershipId === membershipId);
      without.push({
        membershipId,
        legOrder: slot,
        teamLetter: letter,
        name: candidate?.name ?? "Unknown",
        stroke: strokeForRelayLeg(event.stroke, slot),
      });
      return { ...prev, [meetEventId]: without };
    });
  }

  function saveEvent(meetEventId: string) {
    const legs = legsByEvent[meetEventId] ?? [];
    setError(null);
    startTransition(async () => {
      try {
        await saveMeetRelayLegsAction(
          teamId,
          meetId,
          meetEventId,
          legs.map((leg) => ({
            membershipId: leg.membershipId,
            legOrder: leg.legOrder,
            relayLetter: leg.teamLetter,
            stroke: leg.stroke,
            reasoning: leg.reasoning,
          })),
        );
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Relay lineup</CardTitle>
          <CardDescription>
            Add a free or medley relay event to this meet, then assign legs and
            alternates.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const letters = RELAY_TEAM_LETTERS.slice(0, numberOfRelays);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Relay lineup</CardTitle>
          <CardDescription>
            Assign four racing legs plus alternates #5–#8 from the dropdowns, or
            use Suggest 1–4 to fill racing legs from best times (you can edit
            after).{" "}
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
          <DraftQuotaHint surface="relay" quota={draftQuota} />
        </CardContent>
      </Card>

      {events.map((event) => {
        const locked = lockedByEvent[event.id] ?? false;
        const legs = legsByEvent[event.id] ?? [];
        return (
          <Card key={event.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="text-base">{event.label}</CardTitle>
                <CardDescription>
                  {summaryByEvent[event.id] ||
                    (legs.length
                      ? `${legs.length} legs assigned`
                      : "No legs yet")}
                </CardDescription>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
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
                  variant="outline"
                  disabled={pending || locked || suggestBlocked}
                  onClick={() => regenerate(event.id)}
                >
                  <RefreshCw data-icon="inline-start" />
                  {pending ? "Working…" : "Suggest 1–4"}
                </Button>
                <Button
                  type="button"
                  disabled={pending || locked}
                  onClick={() => saveEvent(event.id)}
                >
                  <Save data-icon="inline-start" />
                  Save
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-3">
                {letters.map((letter) => (
                  <div key={letter} className="rounded-md border p-3">
                    <p className="mb-2 text-sm font-medium">Team {letter}</p>
                    <ol className="flex flex-col gap-2">
                      {SLOTS.map((slot) => {
                        const assigned = legs.find(
                          (leg) =>
                            leg.teamLetter === letter && leg.legOrder === slot,
                        );
                        const split =
                          assigned != null
                            ? splitMs(assigned.membershipId, event, slot)
                            : null;
                        return (
                          <li key={slot} className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs">
                              {relaySlotLabel(slot)}
                              <span className="sr-only">
                                {isRelayAlternateSlot(slot)
                                  ? "alternate"
                                  : "racing leg"}
                              </span>
                            </span>
                            <Select
                              value={assigned?.membershipId ?? EMPTY_SLOT}
                              disabled={pending || locked}
                              onValueChange={(value) => {
                                if (value == null || value === EMPTY_SLOT) {
                                  setSlot(event.id, letter, slot, "", event);
                                  return;
                                }
                                setSlot(event.id, letter, slot, value, event);
                              }}
                            >
                              <SelectTrigger
                                className="h-8 w-full"
                                aria-label={relaySlotLabel(slot)}
                              >
                                <SelectValue>
                                  {assigned
                                    ? `${assigned.name}${split != null ? ` · ${formatTime(split)}` : ""}`
                                    : "Unassigned"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectItem value={EMPTY_SLOT}>
                                    Unassigned
                                  </SelectItem>
                                  {candidates.map((candidate) => {
                                    const ms = splitMs(
                                      candidate.membershipId,
                                      event,
                                      slot,
                                    );
                                    return (
                                      <SelectItem
                                        key={candidate.membershipId}
                                        value={candidate.membershipId}
                                      >
                                        {candidate.name}
                                        {ms != null
                                          ? ` · ${formatTime(ms)}`
                                          : ""}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ))}
              </div>
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
    const letter = deriveRelayLetter(leg.relayLetter, leg.legOrder);
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
      (a, b) =>
        a.teamLetter.localeCompare(b.teamLetter) || a.legOrder - b.legOrder,
    );
  }
  return byEvent;
}

function mergeSuggestedWithAlternates(
  current: RelayLegSuggestion[],
  suggested: RelayLegSuggestion[],
): RelayLegSuggestion[] {
  const alts = current.filter((leg) => isRelayAlternateSlot(leg.legOrder));
  return [...suggested, ...alts];
}

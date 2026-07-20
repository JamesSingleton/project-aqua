"use server";

import { openai } from "@ai-sdk/openai";
import { getSession } from "@project-aqua/auth/session";
import { ingestAiGenerationEvent } from "@project-aqua/billing/polar";
import { requireTeamRole } from "@project-aqua/db/authz";
import { assertAndRecordAiGeneration } from "@project-aqua/db/queries/ai-quota";
import {
  getMeetById,
  getMeetCommitments,
  getMeetEntriesDetailed,
  getMeetEvents,
  getMeetRelayLegs,
  getRosterBestTimesForEvents,
  replaceMeetRelayLegs,
} from "@project-aqua/db/queries/meets";
import { getRoster } from "@project-aqua/db/queries/roster";
import { isRelayStroke } from "@project-aqua/swim-core/entry-limits";
import { formatEventName } from "@project-aqua/swim-core/events";
import { formatTime } from "@project-aqua/swim-core/times";
import { generateText } from "ai";
import { revalidatePath } from "next/cache";

const TEAM_LETTERS = ["A", "B", "C"] as const;

export type RelaySuggestInput = {
  meetId: string;
  meetEventId: string;
  /** Number of relay teams to fill: 1=A, 2=A+B, 3=A+B+C */
  numberOfRelays?: 1 | 2 | 3;
  allowDoubles?: boolean;
  optimizeFor?: "speed" | "participation";
};

export type RelayLegSuggestion = {
  membershipId: string;
  legOrder: number;
  stroke?: string;
  reasoning?: string;
  teamLetter: string;
  name: string;
};

export async function suggestRelayOrderAction(
  teamId: string,
  input: RelaySuggestInput,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
  ]);

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const numberOfRelays = input.numberOfRelays ?? 1;
  const allowDoubles = input.allowDoubles ?? false;
  const optimizeFor = input.optimizeFor ?? "speed";

  await assertAndRecordAiGeneration({
    organizationId: teamId,
    userId: session?.user?.id,
    kind: "relay",
  });
  if (session?.user?.id) {
    await ingestAiGenerationEvent({
      externalCustomerId: session.user.id,
      organizationId: teamId,
      kind: "relay",
    });
  }

  const [meet, events, roster, commitments, entries, existingLegs] =
    await Promise.all([
      getMeetById(input.meetId, teamId),
      getMeetEvents(input.meetId),
      getRoster(teamId),
      getMeetCommitments(input.meetId),
      getMeetEntriesDetailed(input.meetId),
      getMeetRelayLegs(input.meetId),
    ]);

  if (!meet) throw new Error("Meet not found");
  const event = events.find((e) => e.id === input.meetEventId);
  if (!event) throw new Error("Meet event not found");
  if (!isRelayStroke(event.stroke, event.eventKey)) {
    throw new Error("Selected event is not a relay");
  }

  const committedIds = new Set(
    commitments
      .filter((c) => c.status === "committed")
      .map((c) => c.membershipId),
  );
  const pool =
    committedIds.size > 0
      ? roster.filter((r) => committedIds.has(r.membershipId))
      : roster;

  if (pool.length < 4) {
    throw new Error(
      committedIds.size > 0
        ? "Need at least 4 committed swimmers for a relay"
        : "Need at least 4 roster swimmers for a relay",
    );
  }

  const maxRelayEntries = meet.maxRelayEntries;
  const relayEntryCountByMember = new Map<string, number>();
  for (const entry of entries) {
    if (entry.status === "scratched") continue;
    if (!isRelayStroke(entry.stroke, entry.eventKey)) continue;
    relayEntryCountByMember.set(
      entry.membershipId,
      (relayEntryCountByMember.get(entry.membershipId) ?? 0) + 1,
    );
  }
  // Existing relay legs on other events also count toward doubles / limits
  for (const leg of existingLegs) {
    if (leg.meetEventId === input.meetEventId) continue;
    relayEntryCountByMember.set(
      leg.membershipId,
      (relayEntryCountByMember.get(leg.membershipId) ?? 0) + 1,
    );
  }

  const eligible = pool.filter((s) => {
    if (maxRelayEntries == null) return true;
    const current = relayEntryCountByMember.get(s.membershipId) ?? 0;
    return current < maxRelayEntries;
  });

  if (eligible.length < 4) {
    throw new Error(
      maxRelayEntries != null
        ? `Not enough swimmers under the relay entry limit (${maxRelayEntries}).`
        : "Not enough eligible swimmers for a relay",
    );
  }

  const times = await getRosterBestTimesForEvents(teamId, [
    event.eventKey,
    // Common leg times for ordering
    event.eventKey.replace(/_(free_relay|medley_relay)_/, "_free_"),
    event.eventKey.replace(/_(free_relay|medley_relay)_/, "_back_"),
    event.eventKey.replace(/_(free_relay|medley_relay)_/, "_breast_"),
    event.eventKey.replace(/_(free_relay|medley_relay)_/, "_fly_"),
  ]);

  const timeByMember = new Map<string, number>();
  for (const t of times) {
    const prev = timeByMember.get(t.membershipId);
    if (prev == null || t.timeMs < prev) {
      timeByMember.set(t.membershipId, t.timeMs);
    }
  }

  const swimmerLines = eligible
    .map((s) => {
      const best = timeByMember.get(s.membershipId);
      const relayCount = relayEntryCountByMember.get(s.membershipId) ?? 0;
      return `${s.firstName} ${s.lastName} (${s.membershipId}): ${
        best != null ? formatTime(best) : "no time"
      }; currentRelayEntries=${relayCount}; gender=${s.gender}`;
    })
    .join("\n");

  const letters = TEAM_LETTERS.slice(0, numberOfRelays).join(", ");
  const isMedley =
    event.stroke === "medley_relay" || event.eventKey.includes("medley");

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: `You are a competitive swim coach assigning relay teams.
Return ONLY valid JSON:
{"teams":[{"letter":"A","order":[{"membershipId":"...","stroke":"free|back|breast|fly","reason":"..."}]}],"summary":"..."}

Rules:
- Create exactly ${numberOfRelays} team(s): letters ${letters}.
- Each team has exactly 4 swimmers.
- ${allowDoubles ? "Doubles ARE allowed: a swimmer may appear on multiple teams, but prefer not to overload anyone." : "NO doubles: each membershipId may appear at most once across all teams."}
- Optimize for ${optimizeFor === "participation" ? "participation (spread opportunity; B/C teams get solid athletes too)" : "speed (fastest possible A team, then B, then C)"}.
- ${isMedley ? "Medley order must be back, breast, fly, free." : "Free relay: put the fastest freestyler last (anchor)."}
- Prefer swimmers with fewer currentRelayEntries when near the meet relay entry limit.
- Never invent membershipIds; use only candidates provided.`,
    prompt: `Event: ${formatEventName(event.distance, event.stroke)} (${event.eventKey})
Meet maxRelayEntries: ${maxRelayEntries ?? "none"}
Candidates:
${swimmerLines}`,
  });

  let parsed: {
    teams: Array<{
      letter?: string;
      order: Array<{ membershipId: string; stroke?: string; reason?: string }>;
    }>;
    summary?: string;
  };
  try {
    const json = text.trim().replace(/^```json\n?|\n?```$/g, "");
    parsed = JSON.parse(json);
  } catch {
    throw new Error("AI returned invalid relay order JSON");
  }

  if (!Array.isArray(parsed.teams) || parsed.teams.length === 0) {
    throw new Error("AI returned no relay teams");
  }

  const nameById = new Map(
    roster.map(
      (r) => [r.membershipId, `${r.firstName} ${r.lastName}`] as const,
    ),
  );
  const eligibleIds = new Set(eligible.map((s) => s.membershipId));
  const used = new Set<string>();
  const legs: RelayLegSuggestion[] = [];
  const usageCount = new Map<string, number>();

  parsed.teams.slice(0, numberOfRelays).forEach((team, teamIndex) => {
    const letter = team.letter?.toUpperCase() || TEAM_LETTERS[teamIndex] || "A";
    const order = (team.order ?? []).slice(0, 4);
    if (order.length < 4) {
      throw new Error(`Team ${letter} needs 4 swimmers`);
    }
    order.forEach((leg, i) => {
      if (!eligibleIds.has(leg.membershipId)) {
        throw new Error(`Unknown or ineligible swimmer: ${leg.membershipId}`);
      }
      if (!allowDoubles && used.has(leg.membershipId)) {
        throw new Error(
          `Double assignment for ${nameById.get(leg.membershipId) ?? leg.membershipId} but doubles are disabled`,
        );
      }
      const prior = usageCount.get(leg.membershipId) ?? 0;
      const existing = relayEntryCountByMember.get(leg.membershipId) ?? 0;
      if (maxRelayEntries != null && existing + prior + 1 > maxRelayEntries) {
        throw new Error(
          `${nameById.get(leg.membershipId) ?? leg.membershipId} would exceed max relay entries (${maxRelayEntries})`,
        );
      }
      used.add(leg.membershipId);
      usageCount.set(leg.membershipId, prior + 1);
      legs.push({
        membershipId: leg.membershipId,
        legOrder: teamIndex * 4 + i + 1,
        stroke: leg.stroke,
        reasoning: leg.reason
          ? `Team ${letter}: ${leg.reason}`
          : `Team ${letter}`,
        teamLetter: letter,
        name: nameById.get(leg.membershipId) ?? "Unknown",
      });
    });
  });

  await replaceMeetRelayLegs({
    meetId: input.meetId,
    meetEventId: input.meetEventId,
    legs: legs.map((leg) => ({
      membershipId: leg.membershipId,
      legOrder: leg.legOrder,
      stroke: leg.stroke,
      reasoning: leg.reasoning,
    })),
  });

  revalidatePath(`/team/${teamId}/meets/${input.meetId}`);
  revalidatePath(`/team/${teamId}/meets/${input.meetId}/registration`);
  return { legs, summary: parsed.summary ?? "" };
}

export async function getMeetRelayLegsAction(teamId: string, meetId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
    "admin",
    "member",
  ]);
  const meet = await getMeetById(meetId, teamId);
  if (!meet) throw new Error("Meet not found");
  return getMeetRelayLegs(meetId);
}

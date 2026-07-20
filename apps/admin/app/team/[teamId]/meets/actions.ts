"use server";

import { getSession } from "@project-aqua/auth/session";
import { assertFeature } from "@project-aqua/billing/features";
import { requireTeamRole } from "@project-aqua/db/authz";
import {
  createImportJob,
  updateImportJob,
} from "@project-aqua/db/queries/imports";
import {
  addMeetEntry,
  addMeetEvent,
  addMeetResult,
  createMeet,
  deleteMeet,
  deleteMeetEntry,
  getMeetById,
  getMeetCommitments,
  getMeetEntries,
  getMeetEntriesDetailed,
  getMeetEvents,
  getMeetRelayLegs,
  getMeetResults,
  getMeets,
  getRosterBestTimesForEvents,
  updateMeet,
  updateMeetEntryStatus,
  upsertMeetCommitment,
} from "@project-aqua/db/queries/meets";
import {
  findSwimmerByGoverningBodyId,
  getRoster,
} from "@project-aqua/db/queries/roster";
import { sendMeetImportComplete } from "@project-aqua/emails";
import {
  canAddMeetEntry,
  isRelayStroke,
} from "@project-aqua/swim-core/entry-limits";
import { isSwimmerEligibleForEvent } from "@project-aqua/swim-core/events";
import { parseTime } from "@project-aqua/swim-core/times";
import { createMeetSchema } from "@project-aqua/swim-core/validators";
import type { ParsedMeet } from "@project-aqua/swim-formats";
import { exportHy3 } from "@project-aqua/swim-formats/hy3";
import {
  detectMeetFileFormat,
  extractMeetFileFromZip,
  isZipFilename,
  type MeetFileFormat,
  parseMeetFile,
  parseMeetFileFromBytes,
} from "@project-aqua/swim-formats/meet";
import { exportSdif } from "@project-aqua/swim-formats/sdif";
import { revalidatePath } from "next/cache";

function revalidateMeetPaths(teamId: string, meetId?: string) {
  revalidatePath(`/team/${teamId}/meets`);
  revalidatePath(`/team/${teamId}/meets/results`);
  if (meetId) {
    revalidatePath(`/team/${teamId}/meets/${meetId}`);
    revalidatePath(`/team/${teamId}/meets/${meetId}/events`);
    revalidatePath(`/team/${teamId}/meets/${meetId}/registration`);
    revalidatePath(`/team/${teamId}/meets/${meetId}/results`);
  }
}

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function resolveMembership(
  teamId: string,
  roster: Awaited<ReturnType<typeof getRoster>>,
  swimmerName: string,
  usaMemberId?: string,
) {
  if (usaMemberId) {
    const byId = await findSwimmerByGoverningBodyId(usaMemberId);
    if (byId) {
      const membership = roster.find((r) => r.swimmerId === byId.id);
      if (membership) {
        return {
          membershipId: membership.membershipId,
          swimmerId: membership.swimmerId,
        };
      }
    }
  }

  const target = normalizeName(swimmerName);
  const match = roster.find((r) => {
    const full = normalizeName(`${r.firstName} ${r.lastName}`);
    const preferred = r.preferredName
      ? normalizeName(`${r.preferredName} ${r.lastName}`)
      : "";
    return full === target || preferred === target || full.includes(target);
  });

  if (!match) return null;
  return { membershipId: match.membershipId, swimmerId: match.swimmerId };
}

export async function createMeetAction(teamId: string, formData: FormData) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const parsed = createMeetSchema.parse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
    course: formData.get("course"),
    location: formData.get("location") || undefined,
    address: formData.get("address") || undefined,
  });

  const id = await createMeet(teamId, parsed);
  revalidateMeetPaths(teamId);
  return id;
}

/** Empty string clears the limit (null); missing field leaves it unchanged. */
function optionalInt(
  value: FormDataEntryValue | null,
): number | null | undefined {
  if (value == null) return undefined;
  const raw = String(value).trim();
  if (raw === "") return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export async function updateMeetAction(
  teamId: string,
  meetId: string,
  formData: FormData,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
  ]);

  const parsed = createMeetSchema.parse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
    course: formData.get("course"),
    location: formData.get("location") || undefined,
    address: formData.get("address") || undefined,
  });

  const maxIndividualEntries = optionalInt(
    formData.get("maxIndividualEntries"),
  );
  const maxRelayEntries = optionalInt(formData.get("maxRelayEntries"));
  const maxCombinedEntries = optionalInt(formData.get("maxCombinedEntries"));
  const hasManualLimits =
    maxIndividualEntries !== undefined ||
    maxRelayEntries !== undefined ||
    maxCombinedEntries !== undefined;

  const updated = await updateMeet(meetId, teamId, {
    ...parsed,
    ...(maxIndividualEntries !== undefined ? { maxIndividualEntries } : {}),
    ...(maxRelayEntries !== undefined ? { maxRelayEntries } : {}),
    ...(maxCombinedEntries !== undefined ? { maxCombinedEntries } : {}),
    ...(hasManualLimits ? { entryLimitsSource: "manual" as const } : {}),
  });
  if (!updated) throw new Error("Meet not found");

  revalidateMeetPaths(teamId, meetId);
}

export type MeetImportPreview = {
  name: string;
  startDate?: string;
  course: "SCY" | "SCM" | "LCM";
  location?: string;
  address?: string;
  events: Array<{
    eventNumber?: number;
    stroke: string;
    distance: number;
    gender: string;
    ageGroup?: string;
    eventKey: string;
    qualifyingTimeMs?: number;
  }>;
  entryCount: number;
  resultCount: number;
  exhibitionCount?: number;
  /** Dive events found in the file but not imported (swim-only for now). */
  skippedDiveEvents?: number;
  entryLimits?: {
    maxIndividualEntries?: number;
    maxRelayEntries?: number;
    maxCombinedEntries?: number;
    packages?: Array<{ individual: number; relay: number }>;
  };
  format: MeetFileFormat;
  /** Inner filename when the upload was a ZIP container. */
  sourceFilename?: string;
};

function decodeMeetFilePayload(
  content: string,
  filename: string,
  encoding: "utf8" | "base64" = "utf8",
): {
  format: MeetFileFormat;
  parsed: ParsedMeet;
  textContent: string;
  sourceFilename?: string;
} {
  if (isZipFilename(filename)) {
    if (encoding !== "base64") {
      throw new Error("ZIP meet packs must be uploaded as binary files.");
    }
    const bytes = Uint8Array.from(Buffer.from(content, "base64"));
    const extracted = extractMeetFileFromZip(bytes);
    if (extracted.format === "xls") {
      return {
        format: extracted.format,
        parsed: parseMeetFileFromBytes(extracted.bytes, extracted.filename),
        textContent: content,
        sourceFilename: extracted.filename,
      };
    }
    const text = new TextDecoder("utf-8").decode(extracted.bytes);
    return {
      format: extracted.format,
      parsed: parseMeetFile(text, extracted.format),
      textContent: text,
      sourceFilename: extracted.filename,
    };
  }

  const format = detectMeetFileFormat(
    filename,
    encoding === "utf8" ? content : undefined,
  );
  if (!format) {
    throw new Error(
      "Unsupported meet file. Use SD3/SDIF, HY3, EV3, HYV, CL2, XLS, or ZIP.",
    );
  }

  if (format === "xls") {
    if (encoding !== "base64") {
      throw new Error("XLS meet reports must be uploaded as binary files.");
    }
    const bytes = Uint8Array.from(Buffer.from(content, "base64"));
    return {
      format,
      parsed: parseMeetFileFromBytes(bytes, filename),
      textContent: content,
    };
  }

  if (encoding === "base64") {
    const text = Buffer.from(content, "base64").toString("utf8");
    return {
      format,
      parsed: parseMeetFile(text, format),
      textContent: text,
    };
  }

  return {
    format,
    parsed: parseMeetFile(content, format),
    textContent: content,
  };
}

/** Parse a meet file and return a JSON-serializable preview (no DB writes). */
export async function parseMeetFilePreviewAction(
  teamId: string,
  content: string,
  filename: string,
  encoding: "utf8" | "base64" = "utf8",
): Promise<MeetImportPreview> {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);
  await assertFeature(teamId, "meet_import");

  const { format, parsed, sourceFilename } = decodeMeetFilePayload(
    content,
    filename,
    encoding,
  );
  return {
    name: parsed.name,
    startDate: parsed.startDate,
    course: parsed.course,
    location: parsed.location,
    address: parsed.address,
    events: parsed.events.map((e) => ({
      eventNumber: e.eventNumber,
      stroke: e.stroke,
      distance: e.distance,
      gender: e.gender,
      ageGroup: e.ageGroup,
      eventKey: e.eventKey,
      qualifyingTimeMs: e.qualifyingTimeMs,
    })),
    entryCount: parsed.entries.length,
    resultCount: parsed.results.length,
    exhibitionCount: parsed.entries.filter((e) => e.exhibition).length,
    skippedDiveEvents: parsed.skippedDiveEvents,
    entryLimits: parsed.entryLimits,
    format,
    sourceFilename,
  };
}

export type MeetImportReviewOverrides = {
  name?: string;
  startDate?: string;
  course?: "SCY" | "SCM" | "LCM";
  location?: string;
  address?: string;
  maxIndividualEntries?: number | null;
  maxRelayEntries?: number | null;
  maxCombinedEntries?: number | null;
  events?: Array<{
    eventNumber?: number;
    stroke: string;
    distance: number;
    gender: string;
    ageGroup?: string;
    eventKey: string;
    qualifyingTimeMs?: number;
  }>;
};

function resolveEntryLimitsForImport(
  parsed: ParsedMeet,
  review?: MeetImportReviewOverrides,
): {
  maxIndividualEntries?: number | null;
  maxRelayEntries?: number | null;
  maxCombinedEntries?: number | null;
  entryLimitPackages?: Array<{ individual: number; relay: number }> | null;
  entryLimitsSource?: string | null;
} {
  const fromReview =
    review?.maxIndividualEntries !== undefined ||
    review?.maxRelayEntries !== undefined ||
    review?.maxCombinedEntries !== undefined;

  if (fromReview) {
    const hadFileLimits = Boolean(parsed.entryLimits);
    return {
      maxIndividualEntries: review?.maxIndividualEntries ?? null,
      maxRelayEntries: review?.maxRelayEntries ?? null,
      maxCombinedEntries: review?.maxCombinedEntries ?? null,
      entryLimitPackages: parsed.entryLimits?.packages ?? null,
      entryLimitsSource: hadFileLimits ? "import" : "manual",
    };
  }

  if (parsed.entryLimits) {
    return {
      maxIndividualEntries: parsed.entryLimits.maxIndividualEntries ?? null,
      maxRelayEntries: parsed.entryLimits.maxRelayEntries ?? null,
      maxCombinedEntries: parsed.entryLimits.maxCombinedEntries ?? null,
      entryLimitPackages: parsed.entryLimits.packages ?? null,
      entryLimitsSource: "import",
    };
  }

  return {};
}

export async function importMeetFileAction(
  teamId: string,
  content: string,
  filename: string,
  options?: {
    /** Attach to this meet instead of creating one */
    meetId?: string | null;
    /**
     * When no meetId is set: "auto" creates a meet for event/entry files,
     * but links results-heavy files to a matching existing meet when found.
     * "new" always creates. "existing" requires meetId.
     */
    target?: "auto" | "new" | "existing";
    /** Optional coach edits from the import review step */
    review?: MeetImportReviewOverrides;
    /** File payload encoding. XLS uploads use base64. */
    encoding?: "utf8" | "base64";
  },
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);
  await assertFeature(teamId, "meet_import");

  const encoding = options?.encoding ?? "utf8";
  const { format, parsed: peek } = decodeMeetFilePayload(
    content,
    filename,
    encoding,
  );

  const target = options?.target ?? "auto";
  if (target === "existing" && !options?.meetId) {
    throw new Error("Select a meet to attach this file to.");
  }

  // Peek at content to choose job type before processing
  const looksLikeResults =
    peek.results.length > 0 &&
    peek.results.length >= peek.events.length &&
    peek.entries.length === 0;
  const jobType = looksLikeResults ? "meet_results" : "meet_events";

  const jobId = await createImportJob(teamId, jobType);
  await updateImportJob(jobId, { status: "processing" });

  try {
    const parsed = peek;
    const review = options?.review;
    if (review?.name) parsed.name = review.name;
    if (review?.startDate) parsed.startDate = review.startDate;
    if (review?.course) parsed.course = review.course;
    if (review?.location !== undefined) parsed.location = review.location;
    if (review?.address !== undefined) parsed.address = review.address;
    if (review?.events?.length) {
      parsed.events = review.events.map((e) => ({
        eventNumber: e.eventNumber,
        stroke: e.stroke,
        distance: e.distance,
        gender: e.gender as ParsedMeet["events"][number]["gender"],
        ageGroup: e.ageGroup,
        eventKey: e.eventKey,
        qualifyingTimeMs: e.qualifyingTimeMs,
      }));
    }

    const entryLimitFields = resolveEntryLimitsForImport(parsed, review);
    const roster = await getRoster(teamId);
    const existingMeets = await getMeets(teamId);

    let meetId = options?.meetId ?? null;
    let linkedExisting = false;

    if (meetId) {
      const meet = await getMeetById(meetId, teamId);
      if (!meet) throw new Error("Meet not found");
      linkedExisting = true;
      await updateMeet(meetId, teamId, {
        name: review?.name ?? meet.name,
        startDate:
          review?.startDate ?? meet.startDate.toISOString().slice(0, 10),
        endDate: meet.endDate
          ? meet.endDate.toISOString().slice(0, 10)
          : undefined,
        course: review?.course ?? meet.course,
        location:
          review?.location !== undefined
            ? review.location
            : (meet.location ?? undefined),
        address:
          review?.address !== undefined
            ? review.address
            : (meet.address ?? undefined),
        ...entryLimitFields,
      });
    } else if (target === "new") {
      meetId = await createMeet(teamId, {
        name: parsed.name,
        startDate: parsed.startDate ?? new Date().toISOString(),
        course: parsed.course,
        location: parsed.location,
        address: parsed.address,
        importSource: format,
        ...entryLimitFields,
      });
    } else {
      // auto: prefer linking results onto an existing meet when we can match
      const looksLikeResultsImport =
        parsed.results.length > 0 && parsed.events.length === 0;

      if (looksLikeResultsImport) {
        const matchId = findMatchingMeetId(existingMeets, parsed);
        if (matchId) {
          meetId = matchId;
          linkedExisting = true;
          if (Object.keys(entryLimitFields).length > 0) {
            const meet = await getMeetById(meetId, teamId);
            if (meet) {
              await updateMeet(meetId, teamId, {
                name: meet.name,
                startDate: meet.startDate.toISOString().slice(0, 10),
                endDate: meet.endDate
                  ? meet.endDate.toISOString().slice(0, 10)
                  : undefined,
                course: meet.course,
                location: meet.location ?? undefined,
                address: meet.address ?? undefined,
                ...entryLimitFields,
              });
            }
          }
        }
      }

      if (!meetId) {
        meetId = await createMeet(teamId, {
          name: parsed.name,
          startDate: parsed.startDate ?? new Date().toISOString(),
          course: parsed.course,
          location: parsed.location,
          address: parsed.address,
          importSource: format,
          ...entryLimitFields,
        });
      }
    }

    const existingEvents = await getMeetEvents(meetId);
    const eventIdByNumber = new Map<number, string>();
    let fallbackEventId: string | undefined;

    for (const event of existingEvents) {
      if (event.eventNumber != null) {
        eventIdByNumber.set(event.eventNumber, event.id);
      }
      fallbackEventId ??= event.id;
    }

    let eventsAdded = 0;
    for (const event of parsed.events) {
      if (event.eventNumber != null && eventIdByNumber.has(event.eventNumber)) {
        continue;
      }
      const eventId = await addMeetEvent(meetId, {
        ...event,
        course: parsed.course,
      });
      if (event.eventNumber != null) {
        eventIdByNumber.set(event.eventNumber, eventId);
      }
      fallbackEventId ??= eventId;
      eventsAdded++;
    }

    let entriesAdded = 0;
    let resultsAdded = 0;
    let unmatched = 0;

    async function eventIdFor(num?: number) {
      if (num != null && eventIdByNumber.has(num)) {
        return eventIdByNumber.get(num)!;
      }
      if (fallbackEventId) return fallbackEventId;
      return addMeetEvent(meetId!, {
        eventNumber: num,
        stroke: "free",
        distance: 50,
        gender: "male",
        eventKey: `50_free_${parsed.course.toLowerCase()}_m`,
        course: parsed.course,
      });
    }

    for (const entry of parsed.entries) {
      const resolved = await resolveMembership(
        teamId,
        roster,
        entry.swimmerName,
        entry.usaMemberId,
      );
      if (!resolved) {
        unmatched++;
        continue;
      }
      const meetEventId = await eventIdFor(entry.eventNumber);
      const seedTimeMs = entry.seedTime ? parseTime(entry.seedTime) : undefined;
      await addMeetEntry(
        meetId,
        meetEventId,
        resolved.membershipId,
        seedTimeMs,
        entry.swimmerName,
        "draft",
        seedTimeMs != null && seedTimeMs > 0 ? "personal_best" : "no_time",
      );
      entriesAdded++;
    }

    for (const result of parsed.results) {
      const resolved = await resolveMembership(
        teamId,
        roster,
        result.swimmerName,
        result.usaMemberId,
      );
      if (!resolved) {
        unmatched++;
        continue;
      }
      const meetEventId = await eventIdFor(result.eventNumber);
      const timeMs = parseTime(result.time);
      if (!Number.isFinite(timeMs) || timeMs <= 0) continue;
      await addMeetResult(meetId, meetEventId, resolved.swimmerId, timeMs, {
        place: result.place,
        isDq: result.isDq,
      });
      resultsAdded++;
    }

    revalidateMeetPaths(teamId, meetId);
    await updateImportJob(jobId, {
      status: "complete",
      resultSummary: JSON.stringify({
        meetId,
        linkedExisting,
        events: eventsAdded,
        entries: entriesAdded,
        results: resultsAdded,
        unmatched,
        format,
        jobType,
      }),
    });

    if (session?.user?.email) {
      await sendMeetImportComplete(session.user.email, {
        teamName: "Your team",
        meetName: parsed.name,
        eventsCount: eventsAdded,
        entriesCount: entriesAdded,
      });
    }

    return {
      meetId,
      linkedExisting,
      events: eventsAdded,
      entries: entriesAdded,
      results: resultsAdded,
      unmatched,
      format: format as MeetFileFormat,
    };
  } catch (error) {
    await updateImportJob(jobId, {
      status: "failed",
      errors: error instanceof Error ? error.message : "Import failed",
    });
    throw error;
  }
}

function findMatchingMeetId(
  existingMeets: Awaited<ReturnType<typeof getMeets>>,
  parsed: ParsedMeet,
): string | null {
  const parsedName = normalizeName(parsed.name);
  if (!parsedName) return null;

  const parsedDate = parsed.startDate?.slice(0, 10);

  const matches = existingMeets.filter((meet) => {
    const meetName = normalizeName(meet.name);
    const nameMatch =
      meetName === parsedName ||
      meetName.includes(parsedName) ||
      parsedName.includes(meetName);
    if (!nameMatch) return false;
    if (!parsedDate) return true;
    const meetDate = [
      meet.startDate.getFullYear(),
      String(meet.startDate.getMonth() + 1).padStart(2, "0"),
      String(meet.startDate.getDate()).padStart(2, "0"),
    ].join("-");
    return meetDate === parsedDate;
  });

  return matches[0]?.id ?? null;
}

export async function exportMeetAction(
  teamId: string,
  meetId: string,
  format: "sdif" | "hy3",
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const meet = await getMeetById(meetId, teamId);
  if (!meet) throw new Error("Meet not found");

  const [events, entries, results, relayLegs] = await Promise.all([
    getMeetEvents(meetId),
    getMeetEntries(meetId),
    getMeetResults(meetId),
    getMeetRelayLegs(meetId),
  ]);

  const roster = await getRoster(teamId);
  const membershipById = new Map(
    roster.map((r) => [r.membershipId, r] as const),
  );
  const swimmerById = new Map(roster.map((r) => [r.swimmerId, r] as const));

  const relaysByEvent = new Map<string, typeof relayLegs>();
  for (const leg of relayLegs) {
    const list = relaysByEvent.get(leg.meetEventId) ?? [];
    list.push(leg);
    relaysByEvent.set(leg.meetEventId, list);
  }

  const payload: ParsedMeet = {
    name: meet.name,
    startDate: meet.startDate.toISOString().slice(0, 10),
    course: meet.course,
    location: meet.location ?? undefined,
    events: events.map((e) => ({
      eventNumber: e.eventNumber ?? undefined,
      stroke: e.stroke,
      distance: e.distance,
      gender: e.gender,
      ageGroup: e.ageGroup ?? undefined,
      eventKey: e.eventKey,
    })),
    entries: entries
      .filter((e) => e.status !== "scratched")
      .map((e) => {
        const member = membershipById.get(e.membershipId);
        return {
          eventNumber:
            events.find((ev) => ev.id === e.meetEventId)?.eventNumber ??
            undefined,
          swimmerName: member
            ? `${member.firstName} ${member.lastName}`
            : "Unknown",
          seedTime: e.seedTimeMs
            ? `${Math.floor(e.seedTimeMs / 60000)}:${String(
                Math.floor((e.seedTimeMs % 60000) / 1000),
              ).padStart(2, "0")}.${String(e.seedTimeMs % 1000)
                .padStart(2, "0")
                .slice(0, 2)}`
            : undefined,
          usaMemberId: member?.governingBodyId ?? undefined,
        };
      }),
    results: results.map((r) => {
      const swimmer = swimmerById.get(r.swimmerId);
      return {
        eventNumber:
          events.find((ev) => ev.id === r.meetEventId)?.eventNumber ??
          undefined,
        swimmerName: swimmer
          ? `${swimmer.firstName} ${swimmer.lastName}`
          : "Unknown",
        time: `${Math.floor(r.timeMs / 60000)}:${String(
          Math.floor((r.timeMs % 60000) / 1000),
        ).padStart(2, "0")}.${String(r.timeMs % 1000)
          .padStart(2, "0")
          .slice(0, 2)}`,
        place: r.place ?? undefined,
        isDq: r.isDq,
      };
    }),
    relays: [...relaysByEvent.entries()].map(([meetEventId, legs]) => {
      const sorted = [...legs].sort((a, b) => a.legOrder - b.legOrder);
      return {
        eventNumber:
          events.find((ev) => ev.id === meetEventId)?.eventNumber ?? undefined,
        swimmerNames: sorted.map((leg) => {
          const member = membershipById.get(leg.membershipId);
          return member ? `${member.firstName} ${member.lastName}` : "Unknown";
        }),
      };
    }),
  };

  return format === "hy3" ? exportHy3(payload) : exportSdif(payload);
}

export async function getMeetsAction(teamId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
    "admin",
    "member",
  ]);
  return getMeets(teamId);
}

export async function getMeetDetailAction(teamId: string, meetId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
    "admin",
    "member",
  ]);

  const meet = await getMeetById(meetId, teamId);
  if (!meet) return null;

  const [events, entries, commitments, roster] = await Promise.all([
    getMeetEvents(meetId),
    getMeetEntriesDetailed(meetId),
    getMeetCommitments(meetId),
    getRoster(teamId),
  ]);

  const bestTimes = await getRosterBestTimesForEvents(
    teamId,
    events.map((e) => e.eventKey),
  );

  return { meet, events, entries, commitments, roster, bestTimes };
}

export async function setMeetCommitmentAction(
  teamId: string,
  meetId: string,
  membershipId: string,
  status: "pending" | "committed" | "declined",
  notes?: string,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
  ]);
  const meet = await getMeetById(meetId, teamId);
  if (!meet) throw new Error("Meet not found");

  await upsertMeetCommitment(meetId, membershipId, status, notes);
  revalidateMeetPaths(teamId, meetId);
}

export async function setMeetCommitmentsBulkAction(
  teamId: string,
  meetId: string,
  membershipIds: string[],
  status: "pending" | "committed" | "declined",
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
  ]);
  const meet = await getMeetById(meetId, teamId);
  if (!meet) throw new Error("Meet not found");

  const uniqueIds = [...new Set(membershipIds.filter(Boolean))];
  if (uniqueIds.length === 0) return;

  await Promise.all(
    uniqueIds.map((membershipId) =>
      upsertMeetCommitment(meetId, membershipId, status),
    ),
  );
  revalidateMeetPaths(teamId, meetId);
}

export async function addMeetEntryAction(
  teamId: string,
  meetId: string,
  data: {
    meetEventId: string;
    membershipId: string;
    seedTimeMs?: number | null;
    seedTimeSource?: "personal_best" | "manual" | "no_time";
    entryNotes?: string;
    status?: "draft" | "approved" | "scratched";
  },
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
  ]);
  const meet = await getMeetById(meetId, teamId);
  if (!meet) throw new Error("Meet not found");

  const [events, roster, existingEntries] = await Promise.all([
    getMeetEvents(meetId),
    getRoster(teamId),
    getMeetEntriesDetailed(meetId),
  ]);
  const event = events.find((e) => e.id === data.meetEventId);
  if (!event) throw new Error("Event not found");

  const swimmer = roster.find((r) => r.membershipId === data.membershipId);
  if (!swimmer) throw new Error("Swimmer not found on roster");

  if (!isSwimmerEligibleForEvent(swimmer.gender, event.gender)) {
    throw new Error(
      "Swimmer gender does not match this event. Choose a matching event.",
    );
  }

  const active = existingEntries.filter(
    (e) => e.membershipId === data.membershipId && e.status !== "scratched",
  );
  let individual = 0;
  let relay = 0;
  for (const e of active) {
    if (isRelayStroke(e.stroke, e.eventKey)) relay += 1;
    else individual += 1;
  }
  const candidateIsRelay = isRelayStroke(event.stroke, event.eventKey);
  const limitCheck = canAddMeetEntry(
    {
      maxIndividualEntries: meet.maxIndividualEntries,
      maxRelayEntries: meet.maxRelayEntries,
      maxCombinedEntries: meet.maxCombinedEntries,
      entryLimitPackages: meet.entryLimitPackages,
    },
    { individual, relay },
    candidateIsRelay,
  );
  if (!limitCheck.ok) throw new Error(limitCheck.reason);

  let seedTimeSource = data.seedTimeSource;
  if (!seedTimeSource) {
    if (data.seedTimeMs != null && data.seedTimeMs > 0) {
      seedTimeSource = "personal_best";
    } else {
      seedTimeSource = "no_time";
    }
  }

  await addMeetEntry(
    meetId,
    data.meetEventId,
    data.membershipId,
    data.seedTimeMs ?? null,
    data.entryNotes,
    data.status ?? "draft",
    seedTimeSource,
  );
  revalidateMeetPaths(teamId, meetId);
}

export async function updateMeetEntryStatusAction(
  teamId: string,
  meetId: string,
  entryId: string,
  status: "draft" | "approved" | "scratched",
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
  ]);
  const meet = await getMeetById(meetId, teamId);
  if (!meet) throw new Error("Meet not found");

  await updateMeetEntryStatus(entryId, status);
  revalidateMeetPaths(teamId, meetId);
}

export async function deleteMeetEntryAction(
  teamId: string,
  meetId: string,
  entryId: string,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
  ]);
  const meet = await getMeetById(meetId, teamId);
  if (!meet) throw new Error("Meet not found");

  await deleteMeetEntry(entryId);
  revalidateMeetPaths(teamId, meetId);
}

export async function deleteMeetAction(teamId: string, meetId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const deleted = await deleteMeet(meetId, teamId);
  if (!deleted) throw new Error("Meet not found");

  revalidateMeetPaths(teamId);
}

export async function addResultAction(
  teamId: string,
  meetId: string,
  meetEventId: string,
  swimmerId: string,
  time: string,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);
  await assertFeature(teamId, "progression");

  const timeMs = parseTime(time);
  await addMeetResult(meetId, meetEventId, swimmerId, timeMs);
  revalidateMeetPaths(teamId, meetId);
  revalidatePath(`/team/${teamId}/progression`);
}

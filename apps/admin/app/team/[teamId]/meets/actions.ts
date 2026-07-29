"use server";

import { getSession } from "@project-aqua/auth/session";
import { assertFeature } from "@project-aqua/billing/features";
import {
  requireCoachSafeSportCurrent,
  requireTeamRole,
} from "@project-aqua/db/authz";
import {
  createImportJob,
  getImportJobs,
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
  replaceMeetRelayLegs,
  updateMeet,
  updateMeetEntryStatus,
  upsertMeetCommitment,
} from "@project-aqua/db/queries/meets";
import { recomputeBestTimesForSwimmer } from "@project-aqua/db/queries/progression";
import {
  addSwimmer,
  findSwimmerByGoverningBodyId,
  getRoster,
} from "@project-aqua/db/queries/roster";
import { sendMeetImportComplete } from "@project-aqua/emails";
import { isMinorSwimmer } from "@project-aqua/swim-core/age";
import { formatDateOnly } from "@project-aqua/swim-core/calendar-date";
import {
  canAddMeetEntry,
  checkQualifyingTime,
  isRelayStroke,
} from "@project-aqua/swim-core/entry-limits";
import { isSwimmerEligibleForEvent } from "@project-aqua/swim-core/events";
import {
  type FileAthleteMatch,
  fileAthleteKey,
  type MatchFileAthlete,
  type MatchRosterAthlete,
  matchResultAthletes,
} from "@project-aqua/swim-core/meet-athlete-match";
import { normalizePersonName } from "@project-aqua/swim-core/people";
import { parseTime } from "@project-aqua/swim-core/times";
import { createMeetSchema } from "@project-aqua/swim-core/validators";
import {
  exportCl2,
  exportEv3,
  exportHyv,
  exportMeetZip,
  type ParsedMeet,
} from "@project-aqua/swim-formats";
import { exportHy3 } from "@project-aqua/swim-formats/hy3";
import {
  detectMeetFileFormat,
  isZipFilename,
  type MeetFileFormat,
  parseMeetFile,
  parseMeetFileFromBytes,
  parseMeetFilesFromBytes,
} from "@project-aqua/swim-formats/meet";
import { exportSdif } from "@project-aqua/swim-formats/sdif";
import { revalidatePath } from "next/cache";

function revalidateMeetPaths(teamId: string, meetId?: string) {
  revalidatePath(`/team/${teamId}/meets`);
  revalidatePath(`/team/${teamId}/meets/results`);
  revalidatePath(`/team/${teamId}/progression`);
  revalidatePath(`/team/${teamId}/roster`);
  if (meetId) {
    revalidatePath(`/team/${teamId}/meets/${meetId}`);
    revalidatePath(`/team/${teamId}/meets/${meetId}/events`);
    revalidatePath(`/team/${teamId}/meets/${meetId}/registration`);
    revalidatePath(`/team/${teamId}/meets/${meetId}/results`);
  }
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

  const target = normalizePersonName(swimmerName);
  const match = roster.find((r) => {
    const full = normalizePersonName(`${r.firstName} ${r.lastName}`);
    const preferred = r.preferredName
      ? normalizePersonName(`${r.preferredName} ${r.lastName}`)
      : "";
    return full === target || preferred === target || full.includes(target);
  });

  if (!match) return null;
  return { membershipId: match.membershipId, swimmerId: match.swimmerId };
}

function splitDisplayName(name: string): {
  firstName: string;
  lastName: string;
} {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Unknown", lastName: "Swimmer" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: parts[0]! };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1]!,
  };
}

function toMatchRoster(
  roster: Awaited<ReturnType<typeof getRoster>>,
): MatchRosterAthlete[] {
  return roster.map((r) => ({
    membershipId: r.membershipId,
    swimmerId: r.swimmerId,
    firstName: r.firstName,
    lastName: r.lastName,
    preferredName: r.preferredName,
    dateOfBirth: r.dateOfBirth,
    governingBodyId: r.governingBodyId,
  }));
}

/**
 * All athlete identities referenced by a parsed meet file — entries AND
 * results. Both need Team Manager–style roster matching (map/skip/add)
 * before import; results-only matching let unmatched entries slip through
 * silently.
 */
function collectFileAthletes(parsed: ParsedMeet): MatchFileAthlete[] {
  const fromResults = parsed.results.map((r) => ({
    swimmerName: r.swimmerName,
    usaMemberId: r.usaMemberId,
    dateOfBirth: r.dateOfBirth,
    gender: r.gender,
    teamCode: r.teamCode,
  }));
  const fromEntries = parsed.entries.map((e) => ({
    swimmerName: e.swimmerName,
    usaMemberId: e.usaMemberId,
    dateOfBirth: e.dateOfBirth,
    gender: e.gender,
  }));
  const fromRelays = (parsed.relays ?? []).flatMap((relay) =>
    relay.swimmerNames.map((swimmerName) => ({ swimmerName })),
  );
  return [...fromResults, ...fromEntries, ...fromRelays];
}

export type AthleteMapAction = string | "skip" | "create";

async function createAthleteFromFile(
  teamId: string,
  userId: string | undefined,
  roster: Awaited<ReturnType<typeof getRoster>>,
  athlete: {
    swimmerName: string;
    usaMemberId?: string;
    dateOfBirth?: string;
    gender?: "male" | "female";
  },
  createdKeys: Set<string>,
): Promise<{ membershipId: string; swimmerId: string } | null> {
  if (!athlete.dateOfBirth || !athlete.gender) return null;

  const { firstName, lastName } = splitDisplayName(athlete.swimmerName);
  const dedupeKey = [
    normalizePersonName(firstName),
    normalizePersonName(lastName),
    athlete.dateOfBirth,
  ].join("|");
  if (createdKeys.has(dedupeKey)) {
    const cached = roster.find(
      (r) =>
        normalizePersonName(r.firstName) === normalizePersonName(firstName) &&
        normalizePersonName(r.lastName) === normalizePersonName(lastName) &&
        r.dateOfBirth === athlete.dateOfBirth,
    );
    if (cached) {
      return {
        membershipId: cached.membershipId,
        swimmerId: cached.swimmerId,
      };
    }
  }

  if (isMinorSwimmer(athlete.dateOfBirth)) {
    await requireCoachSafeSportCurrent(userId, teamId);
  }

  const added = await addSwimmer(teamId, {
    firstName,
    lastName,
    dateOfBirth: athlete.dateOfBirth,
    gender: athlete.gender,
    usaMemberId: athlete.usaMemberId,
  });

  createdKeys.add(dedupeKey);
  roster.push({
    membershipId: added.membershipId,
    enrollmentId: "",
    seasonId: "",
    swimmerId: added.swimmerId,
    firstName,
    middleName: null,
    lastName,
    preferredName: null,
    dateOfBirth: athlete.dateOfBirth,
    gender: athlete.gender,
    governingBodyId: athlete.usaMemberId ?? null,
    practiceGroup: null,
    trainingGroups: null,
    groupId: null,
    groupName: null,
    classYear: null,
    academicStanding: null,
    eligibilityStatus: null,
    seasonsOfCompetitionUsed: null,
    eligibilityNotes: null,
    status: "active",
    joinedAt: new Date(),
  });

  return {
    membershipId: added.membershipId,
    swimmerId: added.swimmerId,
  };
}

export async function createMeetAction(teamId: string, formData: FormData) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const parsed = createMeetSchema.parse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
    entryDeadline: formData.get("entryDeadline") || undefined,
    course: formData.get("course"),
    location: formData.get("location") || undefined,
    address: formData.get("address") || undefined,
  });

  const id = await createMeet(teamId, parsed);
  revalidateMeetPaths(teamId, id);
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
    entryDeadline: String(formData.get("entryDeadline") ?? ""),
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
  endDate?: string;
  entryDeadline?: string;
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
    eventKind?: "swim" | "dive";
    diveCount?: number;
  }>;
  entryCount: number;
  resultCount: number;
  exhibitionCount?: number;
  /** Dive events skipped when parse used `includeDiveEvents: false`. */
  skippedDiveEvents?: number;
  entryLimits?: {
    maxIndividualEntries?: number;
    maxRelayEntries?: number;
    maxCombinedEntries?: number;
    packages?: Array<{ individual: number; relay: number }>;
  };
  format: MeetFileFormat;
  /** Inner filename(s) when the upload was a ZIP container. */
  sourceFilename?: string;
  sourceFiles?: string[];
  /** Present when the file has results — Team Manager–style roster matching. */
  athleteMatch?: {
    matchedCount: number;
    reviewCount: number;
    unmatchedResultCount: number;
    reviewAthletes: FileAthleteMatch[];
    rosterOptions: Array<{
      membershipId: string;
      displayName: string;
    }>;
  };
};

function decodeMeetFilePayload(
  content: string,
  filename: string,
  encoding: "utf8" | "base64" = "utf8",
): {
  format: MeetFileFormat;
  parsed: ParsedMeet;
  sourceFilename?: string;
  sourceFiles?: string[];
} {
  if (isZipFilename(filename)) {
    if (encoding !== "base64") {
      throw new Error(
        "ZIP meet packs must upload as binary files. Re-select the file and try again.",
      );
    }
    const bytes = Uint8Array.from(Buffer.from(content, "base64"));
    const parsed = parseMeetFileFromBytes(bytes, filename) as ParsedMeet & {
      sourceFiles?: string[];
      zipFormat?: MeetFileFormat;
    };
    const sourceFiles = parsed.sourceFiles;
    const format =
      parsed.zipFormat ??
      (detectMeetFileFormat(sourceFiles?.[0] ?? filename) as MeetFileFormat) ??
      "cl2";
    return {
      format,
      parsed,
      sourceFilename: sourceFiles?.join(" + "),
      sourceFiles,
    };
  }

  const format = detectMeetFileFormat(
    filename,
    encoding === "utf8" ? content : undefined,
  );
  if (!format) {
    throw new Error(
      "This file isn't a supported meet format. Upload an SD3/SDIF, HY3, EV3, HYV, CL2, XLS, or ZIP file exported from Meet Manager or Team Manager.",
    );
  }

  if (format === "xls") {
    if (encoding !== "base64") {
      throw new Error(
        "XLS meet reports must upload as binary files. Re-select the file and try again.",
      );
    }
    const bytes = Uint8Array.from(Buffer.from(content, "base64"));
    return {
      format,
      parsed: parseMeetFileFromBytes(bytes, filename),
    };
  }

  if (encoding === "base64") {
    const text = Buffer.from(content, "base64").toString("utf8");
    return {
      format,
      parsed: parseMeetFile(text, format),
    };
  }

  return {
    format,
    parsed: parseMeetFile(content, format),
  };
}

export type MeetImportFilePayload = {
  content: string;
  filename: string;
  encoding?: "utf8" | "base64";
};

/**
 * Decode one or more uploaded meet files. A single file preserves the exact
 * extension-or-content sniffing behavior of `decodeMeetFilePayload`; two or
 * more non-ZIP files (e.g. a Hy-Tek HFILE + CFILE pair) are merged
 * server-side via `parseMeetFilesFromBytes`, so coaches don't need to zip
 * companion files themselves.
 */
function decodeMeetFilesPayload(files: MeetImportFilePayload[]): {
  format: MeetFileFormat;
  parsed: ParsedMeet;
  sourceFilename?: string;
  sourceFiles?: string[];
} {
  if (files.length === 0) {
    throw new Error("Select at least one meet file to import.");
  }

  if (files.length === 1) {
    const [file] = files;
    return decodeMeetFilePayload(
      file!.content,
      file!.filename,
      file!.encoding ?? "utf8",
    );
  }

  const byteFiles = files.map((file) => {
    const encoding = file.encoding ?? "utf8";
    const bytes =
      encoding === "base64"
        ? Uint8Array.from(Buffer.from(file.content, "base64"))
        : new TextEncoder().encode(file.content);
    return { filename: file.filename, bytes };
  });

  const parsed = parseMeetFilesFromBytes(byteFiles) as ParsedMeet & {
    sourceFiles?: string[];
    zipFormat?: MeetFileFormat;
  };
  const sourceFiles = parsed.sourceFiles;
  const format =
    parsed.zipFormat ??
    (detectMeetFileFormat(
      sourceFiles?.[0] ?? byteFiles[0]!.filename,
    ) as MeetFileFormat) ??
    "cl2";

  return {
    format,
    parsed,
    sourceFilename: sourceFiles?.join(" + "),
    sourceFiles,
  };
}

/**
 * Parse one or more companion meet files and return a JSON-serializable
 * preview (no DB writes). Pass a single-item array for a normal upload, or
 * multiple non-ZIP files (e.g. HFILE + CFILE) to merge them server-side.
 */
export async function parseMeetFilePreviewAction(
  teamId: string,
  files: MeetImportFilePayload[],
): Promise<MeetImportPreview> {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);
  await assertFeature(teamId, "meet_import");

  const { format, parsed, sourceFilename, sourceFiles } =
    decodeMeetFilesPayload(files);

  const roster = await getRoster(teamId);
  const fileAthletes = collectFileAthletes(parsed);
  const matchBundle =
    fileAthletes.length > 0
      ? matchResultAthletes(toMatchRoster(roster), fileAthletes)
      : null;

  return {
    name: parsed.name,
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    entryDeadline: parsed.entryDeadline,
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
      eventKind: e.eventKind,
      diveCount: e.diveCount,
    })),
    entryCount: parsed.entries.length,
    resultCount: parsed.results.length,
    exhibitionCount: parsed.entries.filter((e) => e.exhibition).length,
    skippedDiveEvents: parsed.skippedDiveEvents,
    entryLimits: parsed.entryLimits,
    format,
    sourceFilename,
    sourceFiles,
    athleteMatch: matchBundle
      ? {
          matchedCount: matchBundle.matched.length,
          reviewCount:
            matchBundle.ambiguous.length + matchBundle.unmatched.length,
          unmatchedResultCount: matchBundle.unmatched.reduce(
            (sum, a) => sum + a.resultCount,
            0,
          ),
          reviewAthletes: [
            ...matchBundle.ambiguous,
            ...matchBundle.unmatched,
          ].slice(0, 100),
          rosterOptions: [...roster]
            .map((r) => ({
              membershipId: r.membershipId,
              displayName:
                `${r.preferredName?.trim() || r.firstName} ${r.lastName}`.trim(),
            }))
            .sort((a, b) => a.displayName.localeCompare(b.displayName)),
        }
      : undefined,
  };
}

export type MeetImportReviewOverrides = {
  name?: string;
  startDate?: string;
  /** Empty string clears an imported end date. */
  endDate?: string;
  /** Empty string clears an imported host entry deadline. */
  entryDeadline?: string;
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
    eventKind?: "swim" | "dive";
    diveCount?: number;
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
  files: MeetImportFilePayload[],
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
    /**
     * Per file-athlete resolution from the review step.
     * Values: roster membershipId | "skip" | "create".
     */
    athleteMaps?: Record<string, AthleteMapAction>;
    /**
     * When true, create roster athletes for unmatched entries/results that
     * include DOB+gender (Team Manager “Add New Teams/Athletes”). Default
     * false.
     */
    addNewAthletes?: boolean;
  },
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);
  await assertFeature(teamId, "meet_import");

  const { format, parsed: peek } = decodeMeetFilesPayload(files);

  const target = options?.target ?? "auto";
  if (target === "existing" && !options?.meetId) {
    throw new Error("Select a meet to attach this file to.");
  }

  // Peek at content to choose job type before processing
  const looksLikeResults =
    peek.importKind === "results" ||
    (peek.importKind !== "entries" && peek.results.length > 0);
  const shouldImportEntries =
    peek.importKind === "entries" ||
    (!looksLikeResults && peek.entries.length > 0) ||
    (peek.importKind == null &&
      peek.results.length === 0 &&
      peek.entries.length > 0);
  const jobType = looksLikeResults
    ? "meet_results"
    : peek.importKind === "entries" ||
        (shouldImportEntries && peek.events.length === 0)
      ? "meet_entries"
      : "meet_events";

  const jobId = await createImportJob(teamId, jobType);
  await updateImportJob(jobId, { status: "processing" });

  try {
    const parsed = peek;
    const review = options?.review;
    if (review?.name) parsed.name = review.name;
    if (review?.startDate) parsed.startDate = review.startDate;
    if (review?.endDate !== undefined) {
      parsed.endDate = review.endDate || undefined;
    }
    if (review?.entryDeadline !== undefined) {
      parsed.entryDeadline = review.entryDeadline || undefined;
    }
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
        eventKind: e.eventKind,
        diveCount: e.diveCount,
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
        startDate: review?.startDate ?? formatDateOnly(meet.startDate),
        endDate:
          review?.endDate !== undefined
            ? review.endDate || undefined
            : meet.endDate
              ? formatDateOnly(meet.endDate)
              : undefined,
        entryDeadline:
          review?.entryDeadline !== undefined
            ? review.entryDeadline
            : meet.entryDeadline
              ? formatDateOnly(meet.entryDeadline)
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
        startDate: parsed.startDate ?? new Date().toISOString().slice(0, 10),
        endDate: parsed.endDate,
        entryDeadline: parsed.entryDeadline,
        course: parsed.course,
        location: parsed.location,
        address: parsed.address,
        importSource: format,
        ...entryLimitFields,
      });
    } else {
      // auto: prefer linking results onto an existing meet when we can match
      if (looksLikeResults) {
        const matchId = findMatchingMeetId(existingMeets, parsed);
        if (matchId) {
          meetId = matchId;
          linkedExisting = true;
          if (Object.keys(entryLimitFields).length > 0) {
            const meet = await getMeetById(meetId, teamId);
            if (meet) {
              await updateMeet(meetId, teamId, {
                name: meet.name,
                startDate: formatDateOnly(meet.startDate),
                endDate: meet.endDate
                  ? formatDateOnly(meet.endDate)
                  : undefined,
                entryDeadline: meet.entryDeadline
                  ? formatDateOnly(meet.entryDeadline)
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
          startDate: parsed.startDate ?? new Date().toISOString().slice(0, 10),
          endDate: parsed.endDate,
          entryDeadline: parsed.entryDeadline,
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
    const eventIdByKey = new Map<string, string>();
    let fallbackEventId: string | undefined;

    for (const event of existingEvents) {
      if (event.eventNumber != null) {
        eventIdByNumber.set(event.eventNumber, event.id);
      }
      if (!eventIdByKey.has(event.eventKey)) {
        eventIdByKey.set(event.eventKey, event.id);
      }
      fallbackEventId ??= event.id;
    }

    let eventsAdded = 0;
    for (const event of parsed.events) {
      if (event.eventNumber != null && eventIdByNumber.has(event.eventNumber)) {
        continue;
      }
      // Prefer matching an existing meet event by stroke/distance/course/gender
      // so results files with Hy-Tek event codes (e.g. 501) attach to EV3 events (e.g. #3).
      if (eventIdByKey.has(event.eventKey)) {
        const existingId = eventIdByKey.get(event.eventKey)!;
        if (event.eventNumber != null) {
          eventIdByNumber.set(event.eventNumber, existingId);
        }
        continue;
      }
      const eventId = await addMeetEvent(meetId, {
        ...event,
        course: parsed.course,
      });
      if (event.eventNumber != null) {
        eventIdByNumber.set(event.eventNumber, eventId);
      }
      eventIdByKey.set(event.eventKey, eventId);
      fallbackEventId ??= eventId;
      eventsAdded++;
    }

    let entriesAdded = 0;
    let resultsAdded = 0;
    let unmatched = 0;
    let swimmersCreated = 0;
    let resultsSkipped = 0;
    let entriesSkipped = 0;
    const resultSwimmerIds = new Set<string>();
    const createdAthleteKeys = new Set<string>();
    const athleteMaps = options?.athleteMaps ?? {};
    const addNewAthletes = options?.addNewAthletes === true;

    // Entries AND results need Team Manager–style roster matching: files
    // routinely include athletes from other teams (results) or swimmers not
    // yet on this team's roster (entries). Matching both up front means an
    // unmatched entry surfaces the same Map/Skip/Add-to-roster review as an
    // unmatched result, instead of being dropped silently.
    const fileAthletes = collectFileAthletes(parsed);
    const matchBundle =
      fileAthletes.length > 0
        ? matchResultAthletes(toMatchRoster(roster), fileAthletes)
        : null;
    const resolvedByKey = new Map<
      string,
      { membershipId: string; swimmerId: string; created: boolean }
    >();

    if (matchBundle) {
      for (const athlete of matchBundle.athletes) {
        const mapAction = athleteMaps[athlete.key];

        if (mapAction === "skip") continue;

        if (mapAction && mapAction !== "create" && mapAction !== "skip") {
          const member = roster.find((r) => r.membershipId === mapAction);
          if (member) {
            resolvedByKey.set(athlete.key, {
              membershipId: member.membershipId,
              swimmerId: member.swimmerId,
              created: false,
            });
          }
          continue;
        }

        if (athlete.status === "matched" && athlete.matched) {
          resolvedByKey.set(athlete.key, {
            membershipId: athlete.matched.membershipId,
            swimmerId: athlete.matched.swimmerId,
            created: false,
          });
          continue;
        }

        const shouldCreate =
          mapAction === "create" ||
          (addNewAthletes && athlete.status === "unmatched");
        if (!shouldCreate) continue;

        const created = await createAthleteFromFile(
          teamId,
          session?.user?.id,
          roster,
          athlete,
          createdAthleteKeys,
        );
        if (created) {
          resolvedByKey.set(athlete.key, { ...created, created: true });
          swimmersCreated++;
        }
      }
    }

    const meetRecord = await getMeetById(meetId, teamId);
    if (!meetRecord) throw new Error("Meet not found");

    const meetEventsList = await getMeetEvents(meetId);
    const eventDetailById = new Map<
      string,
      {
        stroke: string;
        eventKey: string;
        qualifyingTimeMs: number | null;
      }
    >(
      meetEventsList.map((e) => [
        e.id,
        {
          stroke: e.stroke,
          eventKey: e.eventKey,
          qualifyingTimeMs: e.qualifyingTimeMs,
        },
      ]),
    );

    function registerEventDetail(
      id: string,
      detail: {
        stroke: string;
        eventKey: string;
        qualifyingTimeMs?: number | null;
      },
    ) {
      eventDetailById.set(id, {
        stroke: detail.stroke,
        eventKey: detail.eventKey,
        qualifyingTimeMs: detail.qualifyingTimeMs ?? null,
      });
    }

    async function eventIdFor(num?: number) {
      if (num != null && eventIdByNumber.has(num)) {
        return eventIdByNumber.get(num)!;
      }
      const fromParsed =
        num != null
          ? parsed.events.find((e) => e.eventNumber === num)
          : undefined;
      if (fromParsed && eventIdByKey.has(fromParsed.eventKey)) {
        const id = eventIdByKey.get(fromParsed.eventKey)!;
        if (num != null) eventIdByNumber.set(num, id);
        return id;
      }
      if (fromParsed) {
        const eventId = await addMeetEvent(meetId!, {
          ...fromParsed,
          course: parsed.course,
        });
        registerEventDetail(eventId, fromParsed);
        if (num != null) eventIdByNumber.set(num, eventId);
        eventIdByKey.set(fromParsed.eventKey, eventId);
        fallbackEventId ??= eventId;
        return eventId;
      }
      if (fallbackEventId) return fallbackEventId;
      const fallbackKey = `50_free_${parsed.course.toLowerCase()}_m`;
      const eventId = await addMeetEvent(meetId!, {
        eventNumber: num,
        stroke: "free",
        distance: 50,
        gender: "male",
        eventKey: fallbackKey,
        course: parsed.course,
      });
      registerEventDetail(eventId, {
        stroke: "free",
        eventKey: fallbackKey,
        qualifyingTimeMs: null,
      });
      return eventId;
    }

    const entryCountsByMembership = new Map<
      string,
      { individual: number; relay: number }
    >();
    const existingEntries = await getMeetEntriesDetailed(meetId);
    for (const e of existingEntries) {
      if (e.status === "scratched") continue;
      const counts = entryCountsByMembership.get(e.membershipId) ?? {
        individual: 0,
        relay: 0,
      };
      if (isRelayStroke(e.stroke, e.eventKey)) counts.relay += 1;
      else counts.individual += 1;
      entryCountsByMembership.set(e.membershipId, counts);
    }

    const entryWarnings: string[] = [];

    for (const entry of shouldImportEntries ? parsed.entries : []) {
      const key = fileAthleteKey(entry);
      const resolved = resolvedByKey.get(key) ?? null;

      if (!resolved) {
        unmatched++;
        entriesSkipped++;
        continue;
      }

      const meetEventId = await eventIdFor(entry.eventNumber);
      const eventDetail = eventDetailById.get(meetEventId);
      if (!eventDetail) {
        entriesSkipped++;
        continue;
      }

      const seedTimeMs = entry.seedTime ? parseTime(entry.seedTime) : undefined;
      const counts = entryCountsByMembership.get(resolved.membershipId) ?? {
        individual: 0,
        relay: 0,
      };
      const candidateIsRelay = isRelayStroke(
        eventDetail.stroke,
        eventDetail.eventKey,
      );
      const limitCheck = canAddMeetEntry(
        {
          maxIndividualEntries: meetRecord.maxIndividualEntries,
          maxRelayEntries: meetRecord.maxRelayEntries,
          maxCombinedEntries: meetRecord.maxCombinedEntries,
          entryLimitPackages: meetRecord.entryLimitPackages,
        },
        counts,
        candidateIsRelay,
      );
      if (!limitCheck.ok) {
        entriesSkipped++;
        entryWarnings.push(
          `${entry.swimmerName} event #${entry.eventNumber ?? "?"}: ${limitCheck.reason}`,
        );
        continue;
      }

      const qtCheck = checkQualifyingTime(
        eventDetail.qualifyingTimeMs,
        seedTimeMs,
      );
      if (!qtCheck.ok) {
        entriesSkipped++;
        entryWarnings.push(
          `${entry.swimmerName} event #${entry.eventNumber ?? "?"}: ${qtCheck.reason}`,
        );
        continue;
      }

      await addMeetEntry(
        meetId,
        meetEventId,
        resolved.membershipId,
        seedTimeMs,
        entry.swimmerName,
        "draft",
        seedTimeMs != null && seedTimeMs > 0 ? "personal_best" : "no_time",
        entry.exhibition,
      );
      if (candidateIsRelay) counts.relay += 1;
      else counts.individual += 1;
      entryCountsByMembership.set(resolved.membershipId, counts);
      entriesAdded++;
    }

    for (const result of parsed.results) {
      const key = fileAthleteKey(result);
      let resolved = resolvedByKey.get(key) ?? null;

      if (!resolved && !looksLikeResults) {
        const membership = await resolveMembership(
          teamId,
          roster,
          result.swimmerName,
          result.usaMemberId,
        );
        if (membership) {
          resolved = { ...membership, created: false };
        }
      }

      if (!resolved) {
        resultsSkipped++;
        unmatched++;
        continue;
      }

      const meetEventId = await eventIdFor(result.eventNumber);
      const parsedMs = parseTime(result.time);
      const timeMs =
        Number.isFinite(parsedMs) && parsedMs > 0
          ? parsedMs
          : result.isDq
            ? 0
            : Number.NaN;
      if (!Number.isFinite(timeMs)) continue;
      if (timeMs <= 0 && !result.isDq) continue;

      await addMeetResult(meetId, meetEventId, resolved.swimmerId, timeMs, {
        place: result.place,
        isDq: result.isDq,
        splitTimes: result.splitsMs,
        round: result.resultType,
        heat: result.heat,
        lane: result.lane,
        exhibition: result.exhibition,
        dqCode: result.dqCode,
      });
      resultSwimmerIds.add(resolved.swimmerId);
      resultsAdded++;
    }

    let importWarning: string | undefined;
    if (looksLikeResults && parsed.results.length > 0 && resultsAdded === 0) {
      importWarning = `Parsed ${parsed.results.length} results but none matched your roster. Map athletes in the review step, or enable “Add unmatched athletes” when identity (DOB/gender) is present.`;
    } else if (
      shouldImportEntries &&
      parsed.entries.length > 0 &&
      entriesAdded === 0
    ) {
      importWarning = `Parsed ${parsed.entries.length} entries but none matched your roster. Map athletes in the review step, or enable “Add unmatched athletes” when identity (DOB/gender) is present.`;
    }

    if (entryWarnings.length > 0) {
      const sample = [...new Set(entryWarnings)].slice(0, 3).join("; ");
      const suffix =
        entryWarnings.length > 3
          ? ` (+${entryWarnings.length - 3} more)`
          : "";
      const limitMsg = `${entriesSkipped} entries skipped (limits or qualifying times): ${sample}${suffix}`;
      importWarning = importWarning
        ? `${importWarning} ${limitMsg}`
        : limitMsg;
    }

    let relaysAdded = 0;
    for (const relay of parsed.relays ?? []) {
      const meetEventId = await eventIdFor(relay.eventNumber);
      const legs: Array<{
        membershipId: string;
        legOrder: number;
      }> = [];
      for (let i = 0; i < relay.swimmerNames.length; i++) {
        const name = relay.swimmerNames[i]!;
        const key = fileAthleteKey({ swimmerName: name });
        const resolved = resolvedByKey.get(key) ?? null;
        if (!resolved) {
          unmatched++;
          continue;
        }
        legs.push({
          membershipId: resolved.membershipId,
          legOrder: i + 1,
        });
      }
      if (legs.length === 0) continue;
      await replaceMeetRelayLegs({
        meetId,
        meetEventId,
        legs,
      });
      relaysAdded++;
    }

    for (const swimmerId of resultSwimmerIds) {
      await recomputeBestTimesForSwimmer(swimmerId);
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
        relays: relaysAdded,
        unmatched,
        resultsSkipped,
        entriesSkipped,
        swimmersCreated,
        format,
        jobType,
        warning: importWarning,
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
      resultsSkipped,
      entriesSkipped,
      swimmersCreated,
      warning: importWarning,
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
  const parsedName = normalizePersonName(parsed.name);
  if (!parsedName) return null;

  const parsedDate = parsed.startDate?.slice(0, 10);

  const matches = existingMeets.filter((meet) => {
    const meetName = normalizePersonName(meet.name);
    const nameMatch =
      meetName === parsedName ||
      meetName.includes(parsedName) ||
      parsedName.includes(meetName);
    if (!nameMatch) return false;
    if (!parsedDate) return true;
    return formatDateOnly(meet.startDate) === parsedDate;
  });

  return matches[0]?.id ?? null;
}

/** Builds the `ParsedMeet` payload shared by every export format/action. */
async function buildMeetExportPayload(
  teamId: string,
  meetId: string,
): Promise<ParsedMeet> {
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
    startDate: formatDateOnly(meet.startDate),
    endDate: meet.endDate ? formatDateOnly(meet.endDate) : undefined,
    course: meet.course,
    location: meet.location ?? undefined,
    events: events.map((e) => ({
      eventNumber: e.eventNumber ?? undefined,
      stroke: e.stroke,
      distance: e.distance,
      gender: e.gender,
      ageGroup: e.ageGroup ?? undefined,
      eventKey: e.eventKey,
      eventKind: e.eventKind,
      diveCount: e.diveCount ?? undefined,
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
          dateOfBirth: member?.dateOfBirth ?? undefined,
          gender:
            member?.gender === "male" || member?.gender === "female"
              ? member.gender
              : undefined,
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
        resultType: r.round ?? undefined,
        heat: r.heat ?? undefined,
        lane: r.lane ?? undefined,
        exhibition: r.exhibition,
        dqCode: r.dqCode ?? undefined,
        dateOfBirth: swimmer?.dateOfBirth ?? undefined,
        gender:
          swimmer?.gender === "male" || swimmer?.gender === "female"
            ? swimmer.gender
            : undefined,
        usaMemberId: swimmer?.governingBodyId ?? undefined,
        splitsMs: Array.isArray(r.splitTimes)
          ? (r.splitTimes as number[])
          : undefined,
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

  return payload;
}

export type MeetExportFormat = "sdif" | "hy3" | "cl2" | "ev3" | "hyv" | "zip";

export async function exportMeetAction(
  teamId: string,
  meetId: string,
  format: MeetExportFormat,
): Promise<string> {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const payload = await buildMeetExportPayload(teamId, meetId);
  if (format === "hy3") return exportHy3(payload);
  if (format === "cl2") return exportCl2(payload);
  if (format === "ev3") return exportEv3(payload);
  if (format === "hyv") return exportHyv(payload);
  if (format === "zip") {
    const kind =
      payload.results.length > 0
        ? "results"
        : payload.entries.length > 0
          ? "entries"
          : "events";
    return Buffer.from(exportMeetZip(payload, kind)).toString("base64");
  }
  return exportSdif(payload);
}

/** Base64-encoded ZIP pack (HY3 + CL2, and EV3 for "events") for download. */
export async function exportMeetZipAction(
  teamId: string,
  meetId: string,
  kind: "entries" | "results" | "events",
): Promise<string> {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const payload = await buildMeetExportPayload(teamId, meetId);
  const bytes = exportMeetZip(payload, kind);
  return Buffer.from(bytes).toString("base64");
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

  const qtCheck = checkQualifyingTime(event.qualifyingTimeMs, data.seedTimeMs);
  if (!qtCheck.ok) throw new Error(qtCheck.reason);

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
  options?: {
    round?: "prelim" | "swimoff" | "finals" | null;
    heat?: number | null;
    lane?: number | null;
    exhibition?: boolean;
    dqCode?: string | null;
  },
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);
  await assertFeature(teamId, "progression");

  const timeMs = parseTime(time);
  const dqCode = options?.dqCode?.trim() || null;
  await addMeetResult(meetId, meetEventId, swimmerId, timeMs, {
    round: options?.round ?? null,
    heat: options?.heat ?? null,
    lane: options?.lane ?? null,
    exhibition: options?.exhibition ?? false,
    dqCode,
    isDq: Boolean(dqCode),
  });
  await recomputeBestTimesForSwimmer(swimmerId);
  revalidateMeetPaths(teamId, meetId);
  revalidatePath(`/team/${teamId}/progression/${swimmerId}`);
  revalidatePath(`/team/${teamId}/swimmers/${swimmerId}/progression`);
}

export type ImportJobHistoryItem = {
  id: string;
  jobType: string;
  status: "pending" | "processing" | "complete" | "failed";
  createdAt: string;
  errors?: string;
  summary?: {
    meetId?: string;
    linkedExisting?: boolean;
    events?: number;
    entries?: number;
    results?: number;
    relays?: number;
    unmatched?: number;
    resultsSkipped?: number;
    entriesSkipped?: number;
    swimmersCreated?: number;
    format?: string;
  };
};

/** Recent meet-file import jobs for this team, most recent first. */
export async function getImportJobHistoryAction(
  teamId: string,
  limit = 25,
): Promise<ImportJobHistoryItem[]> {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
  ]);

  const jobs = await getImportJobs(teamId);
  return jobs.slice(0, limit).map((job) => {
    let summary: ImportJobHistoryItem["summary"];
    if (job.resultSummary) {
      try {
        summary = JSON.parse(job.resultSummary);
      } catch {
        summary = undefined;
      }
    }
    return {
      id: job.id,
      jobType: job.type,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      errors: job.errors ?? undefined,
      summary,
    };
  });
}

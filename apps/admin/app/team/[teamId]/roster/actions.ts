"use server";

import { getSession } from "@project-aqua/auth/session";
import {
  canExportRoster,
  requireCoachSafeSportCurrent,
  requireMinorPiiAccess,
  requireTeamMember,
  requireTeamRole,
  writeAuditLog,
} from "@project-aqua/db/authz";
import {
  createImportJob,
  updateImportJob,
} from "@project-aqua/db/queries/imports";
import { patchTeamUiPreferences } from "@project-aqua/db/queries/preferences";
import {
  addSwimmer,
  getRoster,
  getRosterForExport,
  getSwimmerContactsForMembership,
  getSwimmerMedicalForMembership,
  type RosterPageInput,
  removeSwimmerFromTeam,
  updateSwimmer,
} from "@project-aqua/db/queries/roster";
import { getSwimmerBestTimes } from "@project-aqua/db/queries/progression";
import {
  createMaappAcknowledgment,
  logAuditEvent,
} from "@project-aqua/db/queries/safesport";
import {
  sendRosterImportComplete,
  sendRosterImportFailed,
} from "@project-aqua/emails";
import { isMinorSwimmer } from "@project-aqua/swim-core/age";
import { parseClassYear } from "@project-aqua/swim-core/team-types";
import { rosterRowSchema } from "@project-aqua/swim-core/validators";
import { parseRosterCsv } from "@project-aqua/swim-formats/csv";
import {
  detectRosterFileFormat,
  parseRosterFile,
  rosterImportErrorForFile,
} from "@project-aqua/swim-formats/roster";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

function parseContactsFromForm(formData: FormData) {
  const parentName = formData.get("parentName")?.toString();
  const parentEmail = formData.get("parentEmail")?.toString();
  const parentPhone = formData.get("parentPhone")?.toString();
  const emergencyName = formData.get("emergencyName")?.toString();
  const emergencyPhone = formData.get("emergencyPhone")?.toString();

  if (!parentName && !parentEmail && !parentPhone) return undefined;

  return {
    parentName: parentName || undefined,
    parentEmail: parentEmail || undefined,
    parentPhone: parentPhone || undefined,
    emergencyName: emergencyName || undefined,
    emergencyPhone: emergencyPhone || undefined,
  };
}

function parseMedicalFromForm(formData: FormData) {
  const allergies = formData.get("allergies")?.toString();
  const medications = formData.get("medications")?.toString();
  const conditions = formData.get("conditions")?.toString();
  const notes = formData.get("notes")?.toString();

  if (!allergies && !medications && !conditions && !notes) return undefined;

  return {
    allergies: allergies || undefined,
    medications: medications || undefined,
    conditions: conditions || undefined,
    notes: notes || undefined,
  };
}

export async function updateSwimmerAction(
  teamId: string,
  swimmerId: string,
  formData: FormData,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const parsed = rosterRowSchema.partial().parse({
    firstName: formData.get("firstName") || undefined,
    lastName: formData.get("lastName") || undefined,
    middleName: formData.get("middleName") || undefined,
    preferredName: formData.get("preferredName") || undefined,
    dateOfBirth: formData.get("dateOfBirth") || undefined,
    gender: formData.get("gender") || undefined,
    practiceGroup: formData.get("practiceGroup") || undefined,
    contacts: parseContactsFromForm(formData),
    medical: parseMedicalFromForm(formData),
  });

  if (parsed.dateOfBirth && isMinorSwimmer(parsed.dateOfBirth)) {
    await requireCoachSafeSportCurrent(session?.user?.id, teamId);
  }

  await updateSwimmer(swimmerId, teamId, parsed);
  revalidatePath(`/team/${teamId}/roster`);
  revalidatePath(`/team/${teamId}/swimmers/${swimmerId}`);
}

export async function removeSwimmerAction(teamId: string, swimmerId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);
  await removeSwimmerFromTeam(swimmerId, teamId);
  revalidatePath(`/team/${teamId}/roster`);
}

export async function removeSwimmersAction(
  teamId: string,
  swimmerIds: string[],
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);
  const uniqueIds = [...new Set(swimmerIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    throw new Error("Select at least one swimmer");
  }
  await Promise.all(
    uniqueIds.map((swimmerId) => removeSwimmerFromTeam(swimmerId, teamId)),
  );
  revalidatePath(`/team/${teamId}/roster`);
  return { removed: uniqueIds.length };
}

export async function fetchRosterAction(teamId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
    "admin",
    "member",
  ]);
  return getRoster(teamId);
}

export async function fetchSwimmerPiiAction(
  teamId: string,
  membershipId: string,
) {
  const session = await getSession();
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    undefined;

  await requireMinorPiiAccess(session?.user?.id, teamId, membershipId, {
    ipAddress: ip,
  });

  const [contacts, medical] = await Promise.all([
    getSwimmerContactsForMembership(membershipId, teamId),
    getSwimmerMedicalForMembership(membershipId, teamId),
  ]);

  return { contacts, medical };
}

/** Contacts, medical, and best times for the roster quick-view sheet. */
export async function fetchSwimmerQuickViewAction(
  teamId: string,
  swimmerId: string,
  membershipId: string,
) {
  const session = await getSession();
  await requireTeamMember(session?.user?.id, teamId);

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    undefined;

  const bestTimesPromise = getSwimmerBestTimes(swimmerId);

  let contacts: Awaited<
    ReturnType<typeof getSwimmerContactsForMembership>
  > | null = null;
  let medical: Awaited<
    ReturnType<typeof getSwimmerMedicalForMembership>
  > | null = null;
  let piiDenied = false;

  try {
    await requireMinorPiiAccess(session?.user?.id, teamId, membershipId, {
      ipAddress: ip,
    });
    const [c, m] = await Promise.all([
      getSwimmerContactsForMembership(membershipId, teamId),
      getSwimmerMedicalForMembership(membershipId, teamId),
    ]);
    contacts = c;
    medical = m;
  } catch {
    piiDenied = true;
  }

  const bestTimes = await bestTimesPromise;

  return {
    contacts,
    medical,
    piiDenied,
    bestTimes: bestTimes.map((t) => ({
      eventKey: t.eventKey,
      eventLabel: t.eventLabel ?? t.eventKey,
      course: t.course,
      timeMs: t.timeMs,
      achievedAt: t.achievedAt,
    })),
  };
}

export async function exportRosterCsvAction(
  teamId: string,
  options?: RosterPageInput & { swimmerIds?: string[] },
) {
  const session = await getSession();
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    undefined;

  await canExportRoster(session?.user?.id, teamId);

  const hasFilters =
    options &&
    (options.swimmerIds?.length ||
      options.q ||
      options.status?.length ||
      options.gender?.length ||
      options.groupId?.length ||
      options.classYear?.length);

  const roster = hasFilters
    ? await getRosterForExport(teamId, {
        ...options,
        // Selection export should include inactive rows when ids are explicit
        status: options.swimmerIds?.length
          ? options.status?.length
            ? options.status
            : ["active", "inactive"]
          : options.status,
      })
    : await getRoster(teamId, options?.seasonId);
  const lines = [
    "first_name,last_name,middle_name,preferred_name,date_of_birth,gender,practice_group,class_year,usa_member_id",
    ...roster.map((r) =>
      [
        r.firstName,
        r.lastName,
        r.middleName ?? "",
        r.preferredName ?? "",
        r.dateOfBirth,
        r.gender,
        r.practiceGroup ?? "",
        r.classYear ?? "",
        r.governingBodyId ?? "",
      ].join(","),
    ),
  ];

  if (session?.user?.id) {
    await writeAuditLog({
      organizationId: teamId,
      actorUserId: session.user.id,
      action: "roster.export",
      resourceType: "organization",
      resourceId: teamId,
      ipAddress: ip,
    });
  }

  return lines.join("\n");
}

export async function recordMaappAcknowledgmentAction(
  teamId: string,
  membershipId: string,
  data: {
    signerName: string;
    signerEmail: string;
    acknowledgedBy: "parent_guardian" | "athlete" | "adult_athlete";
  },
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    undefined;

  await createMaappAcknowledgment({
    membershipId,
    acknowledgedBy: data.acknowledgedBy,
    signerName: data.signerName,
    signerEmail: data.signerEmail,
    ipAddress: ip,
    userAgent: headerStore.get("user-agent") ?? undefined,
  });

  if (session?.user?.id) {
    await logAuditEvent({
      organizationId: teamId,
      actorUserId: session.user.id,
      action: "maapp.acknowledged",
      resourceType: "team_swimmer_membership",
      resourceId: membershipId,
      ipAddress: ip,
    });
  }

  revalidatePath(`/team/${teamId}/settings/safesport`);
}

async function importRosterRows(
  teamId: string,
  rows: Awaited<ReturnType<typeof parseRosterCsv>>,
  jobType: string,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  if (rows.length === 0) {
    throw new Error("No swimmers found in file");
  }

  if (rows.some((r) => isMinorSwimmer(r.dateOfBirth))) {
    await requireCoachSafeSportCurrent(session?.user?.id, teamId);
  }

  const jobId = await createImportJob(teamId, jobType);
  await updateImportJob(jobId, { status: "processing" });

  try {
    let added = 0;
    for (const row of rows) {
      await addSwimmer(teamId, {
        firstName: row.firstName,
        lastName: row.lastName,
        dateOfBirth: row.dateOfBirth,
        gender: row.gender,
        practiceGroup: row.practiceGroup,
        classYear: parseClassYear(row.classYear) ?? undefined,
        usaMemberId: row.usaMemberId,
      });
      added++;
    }

    revalidatePath(`/team/${teamId}/roster`);
    await updateImportJob(jobId, {
      status: "complete",
      resultSummary: JSON.stringify({ added }),
    });

    if (session?.user?.email) {
      await sendRosterImportComplete(session.user.email, {
        teamName: "Your team",
        added,
        updated: 0,
      });
    }

    return { added };
  } catch (error) {
    await updateImportJob(jobId, {
      status: "failed",
      errors: error instanceof Error ? error.message : "Import failed",
    });

    if (session?.user?.email) {
      await sendRosterImportFailed(session.user.email, {
        teamName: "Your team",
        errorSummary: error instanceof Error ? error.message : "Import failed",
      });
    }

    throw error;
  }
}

export async function importRosterCsvAction(teamId: string, content: string) {
  return importRosterRows(teamId, parseRosterCsv(content), "roster_csv");
}

export async function importRosterFileAction(
  teamId: string,
  filename: string,
  content: string,
) {
  const importError = rosterImportErrorForFile(filename, content);
  if (importError) {
    throw new Error(importError);
  }

  const format = detectRosterFileFormat(filename, content);
  if (!format) {
    throw new Error(
      "Unsupported file type. Use CSV, SD3, CL2, or HY3 roster exports.",
    );
  }

  const rows = parseRosterFile(content, format);
  return importRosterRows(teamId, rows, `roster_${format}`);
}

export async function saveRosterViewPreferencesAction(
  teamId: string,
  view: {
    columnVisibility?: Record<string, boolean>;
    sorting?: { id: string; desc: boolean }[];
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthorized" };
    }
    await requireTeamMember(session.user.id, teamId);
    await patchTeamUiPreferences(session.user.id, teamId, {
      roster: {
        columnVisibility: view.columnVisibility,
        sorting: view.sorting,
      },
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to save roster view preferences",
    };
  }
}

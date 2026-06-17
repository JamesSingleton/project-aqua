"use server";

import { getSession } from "@project-aqua/auth/session";
import { canAddSwimmer } from "@project-aqua/billing/features";
import {
  canExportRoster,
  requireCoachSafeSportCurrent,
  requireMinorPiiAccess,
  requireTeamMember,
  requireTeamRole,
  writeAuditLog,
} from "@project-aqua/db/authz";
import {
  addSwimmer,
  getRoster,
  getSwimmerContactsForMembership,
  getSwimmerMedicalForMembership,
  removeSwimmerFromTeam,
  searchSwimmerByUsaId,
  updateSwimmer,
} from "@project-aqua/db/queries/roster";
import {
  createMaappAcknowledgment,
  logAuditEvent,
} from "@project-aqua/db/queries/safesport";
import { db } from "@project-aqua/db/client";
import { organization } from "@project-aqua/db/schema";
import { sendMaappAcknowledgmentRequest } from "@project-aqua/emails";
import { isMinorSwimmer } from "@project-aqua/swim-core/age";
import { rosterRowSchema } from "@project-aqua/swim-core/validators";
import { eq } from "drizzle-orm";
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

function parseRosterFromForm(formData: FormData) {
  return rosterRowSchema.parse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    middleName: formData.get("middleName") || undefined,
    preferredName: formData.get("preferredName") || undefined,
    dateOfBirth: formData.get("dateOfBirth"),
    gender: formData.get("gender"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    practiceGroup: formData.get("practiceGroup") || undefined,
    usaMemberId: formData.get("usaMemberId") || undefined,
    linkExistingSwimmerId: formData.get("linkExistingSwimmerId") || undefined,
    contacts: parseContactsFromForm(formData),
    medical: parseMedicalFromForm(formData),
  });
}

export async function createSwimmerAction(teamId: string, formData: FormData) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const parsed = parseRosterFromForm(formData);

  if (isMinorSwimmer(parsed.dateOfBirth)) {
    await requireCoachSafeSportCurrent(session?.user?.id, teamId);
  }

  const canAdd = await canAddSwimmer(teamId);
  if (!canAdd) {
    throw new Error(
      "Swimmer limit reached for your plan. Upgrade to add more.",
    );
  }

  const result = await addSwimmer(teamId, parsed);

  if (
    isMinorSwimmer(parsed.dateOfBirth) &&
    parsed.contacts?.parentEmail &&
    session?.user
  ) {
    const [org] = await db
      .select({ name: organization.name })
      .from(organization)
      .where(eq(organization.id, teamId))
      .limit(1);

    const swimmerName = `${parsed.firstName} ${parsed.lastName}`;
    const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
    await sendMaappAcknowledgmentRequest(parsed.contacts.parentEmail, {
      teamName: org?.name ?? "Your team",
      swimmerName,
      parentName: parsed.contacts.parentName,
      acknowledgeUrl: `${baseUrl}/team/${teamId}/swimmers/${result.swimmerId}`,
    });
  }

  revalidatePath(`/team/${teamId}/roster`);
  return result;
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

export async function lookupUsaSwimmerAction(teamId: string, usaMemberId: string) {
  const session = await getSession();
  await requireTeamMember(session?.user?.id, teamId);
  if (!usaMemberId.trim()) return null;
  return searchSwimmerByUsaId(usaMemberId.trim());
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

export async function exportRosterCsvAction(teamId: string) {
  const session = await getSession();
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    undefined;

  await canExportRoster(session?.user?.id, teamId);

  const roster = await getRoster(teamId);
  const lines = [
    "first_name,last_name,middle_name,preferred_name,date_of_birth,gender,practice_group,usa_member_id",
    ...roster.map(
      (r) =>
        [
          r.firstName,
          r.lastName,
          r.middleName ?? "",
          r.preferredName ?? "",
          r.dateOfBirth,
          r.gender,
          r.practiceGroup ?? "",
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

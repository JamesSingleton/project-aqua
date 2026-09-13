"use server";

import { getSession } from "@project-aqua/auth/session";
import { getMember, requireTeamRole } from "@project-aqua/db/authz";
import {
  createSafesportReport,
  getComplianceSummary,
  getStaffCredentials,
  upsertStaffCredential,
} from "@project-aqua/db/queries/safesport";
import { revalidatePath } from "next/cache";

export async function getSafeSportDashboardAction(teamId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
    "admin",
  ]);

  const [summary, credentials] = await Promise.all([
    getComplianceSummary(teamId),
    getStaffCredentials(teamId),
  ]);

  const member = session?.user?.id
    ? await getMember(session.user.id, teamId)
    : null;

  return { summary, credentials, currentMemberId: member?.id ?? null };
}

export async function updateStaffCredentialAction(
  teamId: string,
  data: {
    memberId: string;
    credentialType:
      | "safesport_core"
      | "safesport_refresher_1"
      | "safesport_refresher_2"
      | "safesport_refresher_3"
      | "background_check"
      | "cpr_aed"
      | "stsc";
    status: "current" | "expired" | "pending" | "not_started";
    expiresAt?: string;
    completedAt?: string;
  },
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  await upsertStaffCredential({
    memberId: data.memberId,
    credentialType: data.credentialType,
    status: data.status,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
  });

  revalidatePath(`/team/${teamId}/settings/safesport`);
  revalidatePath(`/team/${teamId}`);
}

export async function submitSafesportReportAction(
  teamId: string,
  data: {
    subjectDescription: string;
    category:
      | "emotional_misconduct"
      | "physical_misconduct"
      | "sexual_misconduct"
      | "maapp_violation"
      | "other";
  },
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
    "admin",
    "member",
  ]);

  if (!session?.user?.id) throw new Error("Unauthorized");

  const reportId = await createSafesportReport({
    organizationId: teamId,
    reportedByUserId: session.user.id,
    subjectDescription: data.subjectDescription,
    category: data.category,
  });

  revalidatePath(`/team/${teamId}/settings/safesport`);
  return reportId;
}

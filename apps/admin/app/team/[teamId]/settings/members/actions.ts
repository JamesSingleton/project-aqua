"use server";

import { getSession } from "@project-aqua/auth/session";
import { getMember, requireTeamRole } from "@project-aqua/db/authz";
import { db } from "@project-aqua/db/client";
import { member } from "@project-aqua/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateMemberTitleAction(
  teamId: string,
  memberId: string,
  title: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthorized" };
    }

    const [target] = await db
      .select()
      .from(member)
      .where(and(eq(member.id, memberId), eq(member.organizationId, teamId)))
      .limit(1);

    if (!target) {
      return { ok: false, error: "Member not found" };
    }

    const isSelf = target.userId === session.user.id;
    if (!isSelf) {
      await requireTeamRole(session.user.id, teamId, [
        "owner",
        "admin",
        "head_coach",
      ]);
    } else {
      await getMember(session.user.id, teamId);
    }

    const cleaned = title.trim().slice(0, 80);

    await db
      .update(member)
      .set({ title: cleaned || null })
      .where(eq(member.id, memberId));

    revalidatePath(`/team/${teamId}/settings/members`);
    revalidatePath(`/team/${teamId}/settings/account`);
    revalidatePath(`/team/${teamId}/roster`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update title",
    };
  }
}

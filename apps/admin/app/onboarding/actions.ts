"use server";

import { getSession } from "@project-aqua/auth/session";
import { requireTeamRole } from "@project-aqua/db/authz";
import { db } from "@project-aqua/db/client";
import { member, user } from "@project-aqua/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateOnboardingCoachAction(input: {
  teamId: string;
  coachName: string;
  coachTitle?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return { ok: false, error: "You must be signed in" };
    }

    await requireTeamRole(userId, input.teamId, ["owner", "admin"]);

    const name = input.coachName.trim();
    if (name.length < 2) {
      return { ok: false, error: "Enter your name" };
    }

    const title = input.coachTitle?.trim() || null;

    await Promise.all([
      db
        .update(user)
        .set({ name, updatedAt: new Date() })
        .where(eq(user.id, userId)),
      db
        .update(member)
        .set({ title })
        .where(
          and(
            eq(member.organizationId, input.teamId),
            eq(member.userId, userId),
          ),
        ),
    ]);

    revalidatePath(`/team/${input.teamId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Failed to save coach profile",
    };
  }
}

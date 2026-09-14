"use server";

import { getSession } from "@project-aqua/auth/session";
import { requireTeamRole } from "@project-aqua/db/authz";
import { db } from "@project-aqua/db/client";
import { member, user } from "@project-aqua/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { accountProfileFormSchema } from "@/schemas/account-profile";

export async function updateOnboardingCoachAction(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const parsed = accountProfileFormSchema
      .extend({ teamId: z.string().min(1) })
      .safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid coach profile",
      };
    }
    const { teamId, firstName, lastName, title } = parsed.data;
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return { ok: false, error: "You must be signed in" };
    }

    await requireTeamRole(userId, teamId, ["owner", "admin"]);
    const name = `${firstName} ${lastName}`;

    await Promise.all([
      db
        .update(user)
        .set({ name, firstName, lastName, updatedAt: new Date() })
        .where(eq(user.id, userId)),
      db
        .update(member)
        .set({ title })
        .where(
          and(eq(member.organizationId, teamId), eq(member.userId, userId)),
        ),
    ]);

    revalidatePath(`/team/${teamId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Failed to save coach profile",
    };
  }
}

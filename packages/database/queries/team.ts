import { eq } from "drizzle-orm";
import { database } from "../index";
import { type Team, teams } from "../schema";

export async function getTeamByPublicId(
  publicId: string
): Promise<Team | null> {
  const rows = await database
    .select()
    .from(teams)
    .where(eq(teams.publicId, publicId))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Get a team by its better-auth organization ID.
 * Used server-side when you have the session org ID.
 */
export async function getTeamByOrganizationId(
  organizationId: string
): Promise<Team | null> {
  const rows = await database
    .select()
    .from(teams)
    .where(eq(teams.organizationId, organizationId))
    .limit(1);

  return rows[0] ?? null;
}

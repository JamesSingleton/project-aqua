import { and, eq } from "drizzle-orm";
import { db } from "../client";
import {
  type TeamUiState,
  type ThemePreference,
  userPreferences,
  userTeamPreferences,
} from "../schema/preferences";

const DEFAULT_THEME: ThemePreference = "system";

export function isThemePreference(value: string): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export async function getUserPreferences(userId: string) {
  const [row] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (!row) {
    return {
      userId,
      theme: DEFAULT_THEME,
      updatedAt: null as Date | null,
    };
  }

  return row;
}

export async function upsertUserTheme(userId: string, theme: ThemePreference) {
  await db
    .insert(userPreferences)
    .values({ userId, theme })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { theme, updatedAt: new Date() },
    });

  return getUserPreferences(userId);
}

export async function getTeamUiPreferences(
  userId: string,
  organizationId: string,
): Promise<TeamUiState> {
  const [row] = await db
    .select({ ui: userTeamPreferences.ui })
    .from(userTeamPreferences)
    .where(
      and(
        eq(userTeamPreferences.userId, userId),
        eq(userTeamPreferences.organizationId, organizationId),
      ),
    )
    .limit(1);

  return row?.ui ?? {};
}

function mergeTeamUi(existing: TeamUiState, patch: TeamUiState): TeamUiState {
  const next: TeamUiState = { ...existing };

  if (patch.roster) {
    next.roster = {
      ...existing.roster,
      ...patch.roster,
    };
  }

  return next;
}

export async function patchTeamUiPreferences(
  userId: string,
  organizationId: string,
  patch: TeamUiState,
) {
  const existing = await getTeamUiPreferences(userId, organizationId);
  const ui = mergeTeamUi(existing, patch);

  await db
    .insert(userTeamPreferences)
    .values({ userId, organizationId, ui })
    .onConflictDoUpdate({
      target: [userTeamPreferences.userId, userTeamPreferences.organizationId],
      set: {
        ui,
        updatedAt: new Date(),
      },
    });

  return ui;
}

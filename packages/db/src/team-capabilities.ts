/** Owner / head coach — billing, import/export, USA Swimming team settings */
export const TEAM_MANAGEMENT_ROLES = ["owner", "head_coach"] as const;

export type TeamManagementRole = (typeof TEAM_MANAGEMENT_ROLES)[number];

export type TeamCapabilities = {
  canManageTeam: boolean;
};

const MANAGE_TEAM_ROLES = new Set<string>(TEAM_MANAGEMENT_ROLES);

export function canManageTeam(role: string | null | undefined): boolean {
  if (!role) return false;
  return MANAGE_TEAM_ROLES.has(role);
}

export function roleHasExportAccess(role: string): boolean {
  return canManageTeam(role);
}

export function getTeamCapabilities(
  role: string | null | undefined,
): TeamCapabilities {
  return { canManageTeam: canManageTeam(role) };
}

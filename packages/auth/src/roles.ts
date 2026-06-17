export const COACH_ROLES = {
  owner: {
    label: "Owner",
    permissions: [
      "billing",
      "roster",
      "meets",
      "attendance",
      "settings",
      "invite",
    ],
  },
  head_coach: {
    label: "Head Coach",
    permissions: ["roster", "meets", "attendance", "settings", "invite"],
  },
  assistant_coach: {
    label: "Assistant Coach",
    permissions: ["roster:read", "meets", "attendance"],
  },
  admin: {
    label: "Admin",
    permissions: ["roster:read", "attendance:read"],
  },
  member: {
    label: "Member",
    permissions: ["roster:read"],
  },
} as const;

export type CoachRole = keyof typeof COACH_ROLES;

export function roleHasPermission(role: string, permission: string): boolean {
  const config = COACH_ROLES[role as CoachRole];
  if (!config) return false;
  return (
    config.permissions.includes(permission as never) ||
    config.permissions.some((p) => p.startsWith(`${permission}:`))
  );
}

export const INVITE_ROLES: CoachRole[] = [
  "head_coach",
  "assistant_coach",
  "admin",
];

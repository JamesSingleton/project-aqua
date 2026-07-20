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
    label: "Team Manager",
    permissions: ["roster:read", "attendance"],
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

/** Roles that can be invited to a team (not owner — created with the org). */
export const INVITE_ROLES: CoachRole[] = [
  "head_coach",
  "assistant_coach",
  "admin",
  "member",
];

/** Coaching staff roles — subset of members who appear on the Roster → Coaches tab. */
export const COACHING_ROLES: CoachRole[] = [
  "owner",
  "head_coach",
  "assistant_coach",
];

export function isCoachingRole(role: string): boolean {
  return (COACHING_ROLES as readonly string[]).includes(role);
}

/** Roles an outgoing owner can take after transferring ownership. */
export const POST_TRANSFER_ROLES: CoachRole[] = [
  "head_coach",
  "assistant_coach",
  "admin",
  "member",
];

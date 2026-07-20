import type { AccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultAc,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

/**
 * Better Auth organization access control for Project Aqua coach roles.
 * Extends default owner/admin/member with head_coach and assistant_coach.
 */
export const orgAc = defaultAc as AccessControl;

export const orgRoles = {
  owner: ownerAc,
  admin: adminAc,
  member: memberAc,
  head_coach: defaultAc.newRole({
    organization: ["update"],
    invitation: ["create", "cancel"],
    member: ["create", "update", "delete"],
    team: ["create", "update", "delete"],
    ac: ["read"],
  }),
  assistant_coach: defaultAc.newRole({
    organization: [],
    member: [],
    invitation: [],
    team: [],
    ac: ["read"],
  }),
};

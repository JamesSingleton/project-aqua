"use client";

import type { TeamCapabilities } from "@lane4hq/db/authz";
import { createContext, use } from "react";

const defaultCapabilities: TeamCapabilities = {
  canManageTeam: false,
  canManageRosterFiles: false,
};

const TeamCapabilitiesContext =
  createContext<TeamCapabilities>(defaultCapabilities);

export function TeamCapabilitiesProvider({
  capabilities,
  children,
}: {
  capabilities: TeamCapabilities;
  children: React.ReactNode;
}) {
  return (
    <TeamCapabilitiesContext value={capabilities}>
      {children}
    </TeamCapabilitiesContext>
  );
}

export function useTeamCapabilities(): TeamCapabilities {
  return use(TeamCapabilitiesContext);
}

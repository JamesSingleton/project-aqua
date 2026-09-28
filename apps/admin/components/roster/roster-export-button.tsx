"use client";

import { Button } from "@lane4hq/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@lane4hq/ui/components/tooltip";
import { Download } from "lucide-react";
import { useTeamCapabilities } from "@/components/team-capabilities";
import { TEAM_MANAGE_ROLE_TOOLTIP } from "@/lib/team-role-messages";

export function RosterExportButton({
  onExport,
  loading,
}: {
  onExport: () => void;
  loading?: boolean;
}) {
  const { canManageTeam } = useTeamCapabilities();
  const label = loading ? (
    "Exporting…"
  ) : (
    <>
      <span className="sm:hidden">Export</span>
      <span className="hidden sm:inline">Export roster</span>
    </>
  );

  const trigger = (
    <Button
      type="button"
      variant="outline"
      disabled={loading || !canManageTeam}
      onClick={onExport}
      aria-label={loading ? "Exporting roster" : "Export roster"}
    >
      <Download data-icon="inline-start" />
      {label}
    </Button>
  );

  if (!canManageTeam) {
    return (
      <Tooltip>
        <TooltipTrigger render={trigger} />
        <TooltipContent>{TEAM_MANAGE_ROLE_TOOLTIP}</TooltipContent>
      </Tooltip>
    );
  }

  return trigger;
}

"use client";

import { useState, memo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";

import { cn } from "@/lib/utils";

interface TeamSwitcherProps {
  isCollapsed: boolean;
  teams: {
    id: string;
    name: string;
    logo: React.ReactNode;
  }[];
}

export const TeamSwitcher = memo(
  ({ isCollapsed, teams }: TeamSwitcherProps) => {
    const params = useParams();
    const { teamId } = params;
    const [selectedTeam, setSelectedTeam] = useState<string>(
      Array.isArray(teamId) ? teamId[0] : teamId || "",
    );

    const router = useRouter();

    const handleTeamChange = useCallback(
      (teamId: string) => {
        setSelectedTeam(teamId);
        router.push(`/admin/${teamId}`);
      },
      [router],
    );

    const className = cn(
      "flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
      isCollapsed &&
        "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden",
    );

    return (
      <Select defaultValue={selectedTeam} onValueChange={handleTeamChange}>
        <SelectTrigger className={className} aria-label="Select team">
          <SelectValue placeholder="Select a team">
            {teams.find((team) => team.id === selectedTeam)?.logo}
            <span className={cn("ml-2", isCollapsed && "hidden")}>
              {teams.find((team) => team.id === selectedTeam)?.name}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
                {team.logo}
                {team.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  },
);

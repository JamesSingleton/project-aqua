"use client";

import { organization } from "@project-aqua/auth/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@project-aqua/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@project-aqua/ui/components/sidebar";
import { cn } from "@project-aqua/ui/lib/utils";
import { ChevronsUpDown, Plus, Waves } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface TeamItem {
  id: string;
  name: string;
  plan: string;
  role?: string;
  logo?: string | null;
}

function TeamLogo({
  logo,
  name,
  className,
  iconClassName,
}: {
  logo?: string | null;
  name: string;
  className?: string;
  iconClassName?: string;
}) {
  if (logo) {
    return (
      <Image
        src={logo}
        alt={name}
        className={className}
        width={32}
        height={32}
        unoptimized
      />
    );
  }
  return <Waves className={iconClassName} />;
}

function TeamLogoFrame({
  logo,
  name,
  className,
  iconClassName,
}: {
  logo?: string | null;
  name: string;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex aspect-square shrink-0 items-center justify-center overflow-hidden",
        logo
          ? "bg-transparent"
          : "bg-sidebar-primary text-sidebar-primary-foreground",
        className,
      )}
    >
      <TeamLogo
        logo={logo}
        name={name}
        className="size-full object-cover"
        iconClassName={iconClassName}
      />
    </div>
  );
}

export function TeamSwitcher({
  teams,
  activeTeamId,
}: {
  teams: TeamItem[];
  activeTeamId?: string;
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const activeTeam = teams.find((t) => t.id === activeTeamId) ?? teams[0];

  if (!activeTeam) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton render={<Link href="/onboarding" />}>
            <Plus className="size-4" />
            <span>Create team</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  async function switchTeam(teamId: string) {
    await organization.setActive({ organizationId: teamId });
    router.push(`/team/${teamId}`);
    router.refresh();
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              />
            }
          >
            <TeamLogoFrame
              logo={activeTeam.logo}
              name={activeTeam.name}
              className="size-8 rounded-lg"
              iconClassName="size-4"
            />
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium">{activeTeam.name}</span>
              <span className="truncate text-xs capitalize">
                {activeTeam.role
                  ? `${activeTeam.role.replaceAll("_", " ")} · ${activeTeam.plan}`
                  : activeTeam.plan}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Teams
              </DropdownMenuLabel>
              {teams.map((team, index) => (
                <DropdownMenuItem
                  key={team.id}
                  onClick={() => switchTeam(team.id)}
                  className="gap-2 p-2"
                >
                  <TeamLogoFrame
                    logo={team.logo}
                    name={team.name}
                    className="size-6 rounded-md border"
                    iconClassName="size-3.5 shrink-0"
                  />
                  {team.name}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="gap-2 p-2"
                nativeButton={false}
                render={<Link href="/onboarding" />}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  Add team
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

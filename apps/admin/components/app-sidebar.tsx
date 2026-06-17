"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@project-aqua/ui/components/sidebar";
import {
  Calendar,
  LayoutDashboard,
  Settings2,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { type TeamItem, TeamSwitcher } from "@/components/team-switcher";

export function AppSidebar({
  teamId,
  teams,
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  teamId: string;
  teams: TeamItem[];
  user: { name: string; email: string; image?: string | null };
}) {
  const navMain = [
    {
      title: "Dashboard",
      url: `/team/${teamId}`,
      icon: LayoutDashboard,
      isActive: false,
      items: [],
    },
    {
      title: "Roster",
      url: `/team/${teamId}/roster`,
      icon: Users,
      items: [],
    },
    {
      title: "Meets",
      url: `/team/${teamId}/meets`,
      icon: Trophy,
      items: [
        { title: "All meets", url: `/team/${teamId}/meets` },
        { title: "Import meet", url: `/team/${teamId}/meets/import` },
      ],
    },
    {
      title: "Attendance",
      url: `/team/${teamId}/attendance`,
      icon: Calendar,
      items: [],
    },
    {
      title: "Progression",
      url: `/team/${teamId}/progression`,
      icon: TrendingUp,
      items: [],
    },
    {
      title: "Settings",
      url: `/team/${teamId}/settings`,
      icon: Settings2,
      items: [
        { title: "Team", url: `/team/${teamId}/settings` },
        { title: "Billing", url: `/team/${teamId}/settings/billing` },
        { title: "SafeSport", url: `/team/${teamId}/settings/safesport` },
        { title: "USA Swimming", url: `/team/${teamId}/settings/usa-swimming` },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} activeTeamId={teamId} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user.name,
            email: user.email,
            avatar: user.image ?? undefined,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

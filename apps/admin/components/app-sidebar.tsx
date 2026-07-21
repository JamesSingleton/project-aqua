"use client";

import {
  requiresSafeSportCompliance,
  supportsUsaSwimmingIntegration,
  type TeamType,
} from "@project-aqua/swim-core/team-types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@project-aqua/ui/components/sidebar";
import {
  BarChart3,
  Calendar,
  CalendarPlus,
  ClipboardCheck,
  ClipboardList,
  ClipboardPlus,
  LayoutDashboard,
  Settings2,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { Suspense } from "react";
import { NavMain } from "@/components/nav-main";
import { NavQuickActions } from "@/components/nav-quick-actions";
import { NavUser } from "@/components/nav-user";
import { type TeamItem, TeamSwitcher } from "@/components/team-switcher";

export function AppSidebar({
  teamId,
  teamType,
  teams,
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  teamId: string;
  teamType: TeamType;
  teams: TeamItem[];
  user: { name: string; email: string; image?: string | null };
}) {
  const settingsItems = [
    { title: "Team", url: `/team/${teamId}/settings` },
    { title: "Members", url: `/team/${teamId}/settings/members` },
    { title: "Billing", url: `/team/${teamId}/settings/billing` },
    { title: "Account", url: `/team/${teamId}/settings/account` },
    ...(requiresSafeSportCompliance(teamType)
      ? [{ title: "SafeSport", url: `/team/${teamId}/settings/safesport` }]
      : []),
    ...(supportsUsaSwimmingIntegration(teamType)
      ? [
          {
            title: "USA Swimming",
            url: `/team/${teamId}/settings/usa-swimming`,
          },
        ]
      : []),
  ];

  const navMain = [
    {
      title: "Dashboard",
      url: `/team/${teamId}`,
      icon: LayoutDashboard,
    },
    {
      title: "Roster",
      url: `/team/${teamId}/roster`,
      icon: Users,
      items: [
        { title: "Swimmers", url: `/team/${teamId}/roster` },
        { title: "Groups", url: `/team/${teamId}/roster?tab=groups` },
        { title: "Coaches", url: `/team/${teamId}/roster?tab=coaches` },
      ],
    },
    {
      title: "Calendar",
      url: `/team/${teamId}/calendar`,
      icon: Calendar,
      items: [
        { title: "Team calendar", url: `/team/${teamId}/calendar` },
        { title: "Attendance", url: `/team/${teamId}/attendance` },
      ],
    },
    {
      title: "Workouts",
      url: `/team/${teamId}/workouts`,
      icon: ClipboardList,
    },
    {
      title: "Meets",
      url: `/team/${teamId}/meets`,
      icon: Trophy,
      items: [
        { title: "All meets", url: `/team/${teamId}/meets` },
        { title: "Add meet", url: `/team/${teamId}/meets/create` },
        { title: "Results", url: `/team/${teamId}/meets/results` },
        { title: "Time standards", url: `/team/${teamId}/meets/time-standards` },
      ],
    },
    {
      title: "Progression",
      url: `/team/${teamId}/progression`,
      icon: TrendingUp,
    },
    {
      title: "Analytics",
      url: `/team/${teamId}/analytics`,
      icon: BarChart3,
    },
    {
      title: "Settings",
      url: `/team/${teamId}/settings`,
      icon: Settings2,
      items: settingsItems,
    },
  ];

  const quickActions = [
    {
      name: "Add swimmer",
      url: `/team/${teamId}/swimmers/create`,
      icon: UserPlus,
    },
    {
      name: "Add meet",
      url: `/team/${teamId}/meets/create`,
      icon: CalendarPlus,
    },
    {
      name: "Create workout",
      url: `/team/${teamId}/workouts/create`,
      icon: ClipboardPlus,
    },
    {
      name: "Take attendance",
      url: `/team/${teamId}/attendance`,
      icon: ClipboardCheck,
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} activeTeamId={teamId} />
      </SidebarHeader>
      <SidebarContent>
        <Suspense fallback={null}>
          <NavMain items={navMain} />
        </Suspense>
        <NavQuickActions actions={quickActions} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          teamId={teamId}
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

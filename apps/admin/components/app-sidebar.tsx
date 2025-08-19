"use client";

import * as React from "react";
import {
  AudioWaveform,
  GalleryVerticalEnd,
  LayoutDashboard,
  Settings,
  LifeBuoy,
  Send,
  ChartNoAxesCombined,
  Waves,
  Dumbbell,
  UserCheck,
  CalendarPlus,
  Users,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavQuickActions } from "@/components/nav-quick-actions";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@project-aqua/ui/components/sidebar";
import { NavSecondary } from "./nav-secondary";

// This is sample data.
const data = {
  user: {
    name: "James Singleton",
    email: "james.singleton@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Arizona Seals Swimming Academy",
      logo: GalleryVerticalEnd as React.ElementType,
      plan: "Club",
    },
    {
      name: "Maricopa High School",
      logo: AudioWaveform as React.ElementType,
      plan: "High School",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      url: "/dashboard",
    },
    {
      title: "People",
      icon: Users,
      url: "#",
      items: [
        {
          title: "Roster",
          url: "/people/roster",
        },
        {
          title: "Add Swimmer",
          url: "/swimmers/create",
        },
      ],
    },
    {
      title: "Training",
      url: "#",
      icon: Dumbbell,
      items: [
        {
          title: "Workouts",
          url: "#",
        },
        {
          title: "Planning",
          url: "#",
        },
        {
          title: "Groups",
          url: "#",
        },
      ],
    },
    {
      title: "Meets",
      url: "#",
      icon: Waves,
      items: [
        {
          title: "Entries",
          url: "#",
        },
        {
          title: "Results",
          url: "#",
        },
      ],
    },
    {
      title: "Reports",
      url: "/reports",
      icon: ChartNoAxesCombined,
      items: [
        {
          title: "Overview",
          url: "/reports",
        },
        {
          title: "Training",
          url: "/reports/training",
        },
        {
          title: "Performance",
          url: "/reports/performance",
        },
        {
          title: "Attendance",
          url: "/reports/attendance",
        },
      ],
    },
  ],
  quickActions: [
    {
      name: "Take Attendance",
      url: "#",
      icon: UserCheck,
    },
    {
      name: "Add Swim Meet",
      url: "#",
      icon: CalendarPlus,
    },
    {
      name: "Send Quick Email",
      url: "#",
      icon: Send,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavQuickActions projects={data.quickActions} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

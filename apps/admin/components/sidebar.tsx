"use client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@project-aqua/design-system/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@project-aqua/design-system/components/ui/sidebar";
import {
  ChevronRightIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  LifeBuoyIcon,
  PlusCircleIcon,
  ScrollTextIcon,
  SendIcon,
  Settings2Icon,
  ShieldIcon,
  TimerIcon,
  TrophyIcon,
  UploadIcon,
  UsersIcon,
  WavesIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";

interface GlobalSidebarProperties {
  readonly children: ReactNode;
  readonly teamId: string;
}

const getData = (teamId: string) => ({
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Maricopa High School Swim Team",
      logo: WavesIcon,
      plan: "Pro",
    },
    {
      name: "Arizona Seals Swimming Academy",
      logo: ShieldIcon,
      plan: "Club",
    },
  ],
  navMain: [
    {
      title: "Roster",
      url: `/team/${teamId}/roster`,
      icon: UsersIcon,
      isActive: true,
      items: [
        { title: "Athletes", url: `/team/${teamId}/roster/athletes` },
        { title: "Coaches", url: `/team/${teamId}/roster/coaches` },
        { title: "Groups", url: `/team/${teamId}/roster/groups` },
        { title: "Import / Export", url: `/team/${teamId}/roster/import` },
      ],
    },
    {
      title: "Meets",
      url: `/team/${teamId}/meets`,
      icon: TrophyIcon,
      items: [
        { title: "Upcoming", url: `/team/${teamId}/meets/upcoming` },
        { title: "Entry management", url: `/team/${teamId}/meets/entries` },
        { title: "Heat sheets", url: `/team/${teamId}/meets/heat-sheets` },
        { title: "Results", url: `/team/${teamId}/meets/results` },
      ],
    },
    {
      title: "Times",
      url: `/team/${teamId}/times`,
      icon: TimerIcon,
      items: [
        {
          title: "Personal bests",
          url: `/team/${teamId}/times/personal-bests`,
        },
        { title: "Standards", url: `/team/${teamId}/times/standards` },
        { title: "Time drops", url: `/team/${teamId}/times/drops` },
        { title: "Search times", url: `/team/${teamId}/times/search` },
      ],
    },
    {
      title: "Practice",
      url: `/team/${teamId}/practice`,
      icon: ClipboardListIcon,
      items: [
        { title: "Plans", url: `/team/${teamId}/practice/plans` },
        { title: "Sets library", url: `/team/${teamId}/practice/sets` },
        { title: "Attendance", url: `/team/${teamId}/practice/attendance` },
        { title: "Yardage log", url: `/team/${teamId}/practice/yardage` },
      ],
    },
    {
      title: "Settings",
      url: `/team/${teamId}/settings`,
      icon: Settings2Icon,
      items: [
        { title: "Team profile", url: `/team/${teamId}/settings/team` },
        { title: "Coaches & staff", url: `/team/${teamId}/settings/staff` },
        { title: "Billing", url: `/team/${teamId}/settings/billing` },
        { title: "Integrations", url: `/team/${teamId}/settings/integrations` },
      ],
    },
  ],
  quickActions: [
    {
      name: "New meet entry",
      url: `/team/${teamId}/meets/entries/new`,
      icon: PlusCircleIcon,
    },
    {
      name: "Import file",
      url: `/team/${teamId}/roster/import`,
      icon: UploadIcon,
    },
    {
      name: "Record results",
      url: `/team/${teamId}/meets/results/new`,
      icon: ClipboardCheckIcon,
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "/support",
      icon: LifeBuoyIcon,
    },
    {
      title: "Feedback",
      url: "/feedback",
      icon: SendIcon,
    },
    {
      title: "Changelog",
      url: "/changelog",
      icon: ScrollTextIcon,
    },
  ],
});

export const GlobalSidebar = ({
  children,
  teamId,
}: GlobalSidebarProperties) => {
  const data = getData(teamId);
  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <TeamSwitcher teams={data.teams} />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Team management</SidebarGroupLabel>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <Collapsible
                  asChild
                  defaultOpen={item.isActive}
                  key={item.title}
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.items?.length ? (
                      <>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuAction className="data-[state=open]:rotate-90">
                            <ChevronRightIcon />
                            <span className="sr-only">Toggle</span>
                          </SidebarMenuAction>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items?.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </>
                    ) : null}
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Quick actions</SidebarGroupLabel>
            <SidebarMenu>
              {data.quickActions.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                {data.navSecondary.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </>
  );
};

"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@project-aqua/ui/components/sidebar";
import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { SidebarLink } from "@/components/sidebar-link";

export function NavQuickActions({
  actions,
}: {
  actions: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Quick actions</SidebarGroupLabel>
      <SidebarMenu>
        {actions.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              render={<SidebarLink href={item.url} />}
              tooltip={item.name}
              isActive={
                pathname === item.url || pathname.startsWith(`${item.url}/`)
              }
            >
              <item.icon />
              <span>{item.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

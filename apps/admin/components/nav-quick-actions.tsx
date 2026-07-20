"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@project-aqua/ui/components/sidebar";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
              render={<Link href={item.url} />}
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

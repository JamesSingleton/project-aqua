"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@project-aqua/ui/components/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@project-aqua/ui/components/sidebar";
import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function urlsMatch(
  currentPath: string,
  currentSearch: string,
  href: string,
): boolean {
  const [path, query = ""] = href.split("?");
  if (currentPath !== path) return false;
  const actual = new URLSearchParams(currentSearch);
  if (!query) {
    // Bare path: active only when there is no tab query (avoids dual-active with ?tab=)
    return !actual.get("tab");
  }
  const expected = new URLSearchParams(query);
  for (const [key, value] of expected.entries()) {
    if (actual.get(key) !== value) return false;
  }
  return true;
}

type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
};

function NavCollapsibleItem({
  item,
  pathname,
  search,
}: {
  item: NavItem & { items: NonNullable<NavItem["items"]> };
  pathname: string;
  search: string;
}) {
  const sectionActive =
    item.items.some((sub) => urlsMatch(pathname, search, sub.url)) ||
    pathname === item.url ||
    pathname.startsWith(`${item.url}/`);

  const [open, setOpen] = useState(() =>
    Boolean(item.isActive || sectionActive),
  );

  // Keep the section expanded when navigating into it; allow manual collapse.
  useEffect(() => {
    if (sectionActive) setOpen(true);
  }, [sectionActive]);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
      render={<SidebarMenuItem />}
    >
      <CollapsibleTrigger
        render={
          <SidebarMenuButton tooltip={item.title} isActive={sectionActive} />
        }
      >
        {item.icon ? <item.icon /> : null}
        <span>{item.title}</span>
        <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {item.items.map((subItem) => (
            <SidebarMenuSubItem key={subItem.title}>
              <SidebarMenuSubButton
                render={<Link href={subItem.url} />}
                isActive={urlsMatch(pathname, search, subItem.url)}
              >
                <span>{subItem.title}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = Boolean(item.items && item.items.length > 0);

          if (!hasChildren) {
            const isActive = urlsMatch(pathname, search, item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={<Link href={item.url} />}
                  tooltip={item.title}
                  isActive={isActive}
                >
                  {item.icon ? <item.icon /> : null}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <NavCollapsibleItem
              key={item.title}
              item={item as NavItem & { items: NonNullable<NavItem["items"]> }}
              pathname={pathname}
              search={search}
            />
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

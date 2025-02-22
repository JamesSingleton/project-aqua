"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  IconArrowRightDashed,
  IconDeviceLaptop,
  IconMoon,
  IconSun,
} from "@tabler/icons-react";
import { useSearch } from "@/lib/search-context";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { sidebarData } from "@/components/layout/data/sidebar-data";
import { ScrollArea } from "@/components/ui/scroll-area";

export function CommandMenu() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { open, setOpen } = useSearch();

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false);
      command();
    },
    [setOpen]
  );

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <ScrollArea type="hover" className="h-72 pr-1">
          <CommandEmpty>No results found.</CommandEmpty>
          {sidebarData.navGroups.map((group) => (
            <CommandGroup key={group.title} heading={group.title}>
              {group.items.map((navItem, i) => {
                if (navItem.url)
                  return (
                    <CommandItem
                      key={`${navItem.url}-${i}`}
                      value={navItem.title}
                      onSelect={() => {
                        runCommand(() => router.push(navItem.url as string));
                      }}
                    >
                      <div className="mr-2 flex h-4 w-4 items-center justify-center">
                        <IconArrowRightDashed className="size-2 text-muted-foreground/80" />
                      </div>
                      {navItem.title}
                    </CommandItem>
                  );

                return navItem.items?.map((subItem, i) => (
                  <CommandItem
                    key={`${subItem.url}-${i}`}
                    value={subItem.title}
                    onSelect={() => {
                      runCommand(() => router.push(subItem.url as string));
                    }}
                  >
                    <div className="mr-2 flex h-4 w-4 items-center justify-center">
                      <IconArrowRightDashed className="size-2 text-muted-foreground/80" />
                    </div>
                    {subItem.title}
                  </CommandItem>
                ));
              })}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
              <IconSun /> <span>Light</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
              <IconMoon className="scale-90" />
              <span>Dark</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
              <IconDeviceLaptop />
              <span>System</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  );
}

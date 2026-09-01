"use client";

import { Tabs, TabsList, TabsTrigger } from "@project-aqua/ui/components/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MeetEntryNav({
  teamId,
  meetId,
}: {
  teamId: string;
  meetId: string;
}) {
  const pathname = usePathname();
  const base = `/team/${teamId}/meets/${meetId}`;

  const tabs = [
    { value: "information", label: "Information", href: base },
    { value: "events", label: "Events", href: `${base}/events` },
    {
      value: "entries",
      label: "Entries",
      href: `${base}/entries`,
    },
  ] as const;

  const active =
    tabs.find((tab) => tab.href !== base && pathname.startsWith(tab.href))
      ?.value ?? "information";

  return (
    <Tabs value={active} className="w-full">
      <TabsList
        variant="line"
        className="h-auto w-full justify-start gap-2 rounded-none border-b p-0"
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            nativeButton={false}
            render={<Link href={tab.href} />}
            className="flex-none px-1 pb-3 text-base data-active:bg-transparent"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

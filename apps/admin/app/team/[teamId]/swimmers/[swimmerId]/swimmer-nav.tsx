"use client";

import { Tabs, TabsList, TabsTrigger } from "@project-aqua/ui/components/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SwimmerNav({
  teamId,
  swimmerId,
}: {
  teamId: string;
  swimmerId: string;
}) {
  const pathname = usePathname();
  const base = `/team/${teamId}/swimmers/${swimmerId}`;
  const progressionHref = `${base}/progression`;

  const tabs = [
    { value: "profile", label: "Profile", href: base },
    { value: "progression", label: "Progression", href: progressionHref },
  ];

  const active =
    pathname.startsWith(progressionHref) || pathname.includes("/progression")
      ? "progression"
      : "profile";

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

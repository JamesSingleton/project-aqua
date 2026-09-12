"use client";

import {
  requiresSafeSportCompliance,
  supportsUsaSwimmingIntegration,
  type TeamType,
} from "@project-aqua/swim-core/team-types";
import { Tabs, TabsList, TabsTrigger } from "@project-aqua/ui/components/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SettingsNav({
  teamId,
  teamType,
}: {
  teamId: string;
  teamType: TeamType;
}) {
  const pathname = usePathname();
  const base = `/team/${teamId}/settings`;

  const tabs = [
    { value: "team", label: "Team", href: base },
    { value: "members", label: "Members", href: `${base}/members` },
    { value: "billing", label: "Billing", href: `${base}/billing` },
    { value: "account", label: "Account", href: `${base}/account` },
    ...(requiresSafeSportCompliance(teamType)
      ? [
          {
            value: "safesport",
            label: "SafeSport",
            href: `${base}/safesport`,
          },
        ]
      : []),
    ...(supportsUsaSwimmingIntegration(teamType)
      ? [
          {
            value: "usa-swimming",
            label: "USA Swimming",
            href: `${base}/usa-swimming`,
          },
        ]
      : []),
  ];

  const active =
    tabs.find((tab) => tab.href !== base && pathname.startsWith(tab.href))
      ?.value ?? "team";

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

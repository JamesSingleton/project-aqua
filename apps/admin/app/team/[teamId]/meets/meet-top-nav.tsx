"use client";

import { Tabs, TabsList, TabsTrigger } from "@project-aqua/ui/components/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MeetTopNav({ teamId }: { teamId: string }) {
  const pathname = usePathname();
  const base = `/team/${teamId}/meets`;
  const resultsHref = `${base}/results`;
  const standardsHref = `${base}/time-standards`;

  const active = pathname.startsWith(standardsHref)
    ? "standards"
    : pathname.startsWith(resultsHref)
      ? "results"
      : "entries";

  return (
    <Tabs value={active} className="w-full">
      <TabsList
        variant="line"
        className="h-auto w-full justify-start gap-2 rounded-none border-b p-0"
      >
        <TabsTrigger
          value="entries"
          nativeButton={false}
          render={<Link href={base} />}
          className="flex-none px-1 pb-3 text-base data-active:bg-transparent"
        >
          Entries
        </TabsTrigger>
        <TabsTrigger
          value="results"
          nativeButton={false}
          render={<Link href={resultsHref} />}
          className="flex-none px-1 pb-3 text-base data-active:bg-transparent"
        >
          Results
        </TabsTrigger>
        <TabsTrigger
          value="standards"
          nativeButton={false}
          render={<Link href={standardsHref} />}
          className="flex-none px-1 pb-3 text-base data-active:bg-transparent"
        >
          Time Standards
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

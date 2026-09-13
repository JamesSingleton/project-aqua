"use client";

import { Tabs, TabsList, TabsTrigger } from "@project-aqua/ui/components/tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ReportGroupToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const group = searchParams.get("group") === "swimmer" ? "swimmer" : "event";

  function setGroup(next: string | null) {
    if (next !== "swimmer" && next !== "event") return;
    const params = new URLSearchParams(searchParams.toString());
    if (next === "event") params.delete("group");
    else params.set("group", "swimmer");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <Tabs value={group} onValueChange={setGroup}>
      <TabsList>
        <TabsTrigger value="event">By event</TabsTrigger>
        <TabsTrigger value="swimmer">By swimmer</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

"use client";

import { Tabs, TabsList, TabsTrigger } from "@project-aqua/ui/components/tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ReportSplitIntervalToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const split = searchParams.get("split");
  const interval =
    split === "25" || split === "50" || split === "100" ? split : "auto";

  function setSplit(next: string | null) {
    if (next !== "auto" && next !== "25" && next !== "50" && next !== "100") {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (next === "auto") params.delete("split");
    else params.set("split", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <Tabs value={interval} onValueChange={setSplit}>
      <TabsList>
        <TabsTrigger value="auto">Auto</TabsTrigger>
        <TabsTrigger value="25">25s</TabsTrigger>
        <TabsTrigger value="50">50s</TabsTrigger>
        <TabsTrigger value="100">100s</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

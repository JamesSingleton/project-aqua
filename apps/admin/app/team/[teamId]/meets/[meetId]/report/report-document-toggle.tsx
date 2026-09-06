"use client";

import { Tabs, TabsList, TabsTrigger } from "@project-aqua/ui/components/tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ReportDocumentToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const document = searchParams.get("doc") === "splits" ? "splits" : "entries";

  function setDocument(next: string | null) {
    if (next !== "splits" && next !== "entries") return;
    const params = new URLSearchParams(searchParams.toString());
    if (next === "entries") params.delete("doc");
    else params.set("doc", "splits");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <Tabs value={document} onValueChange={setDocument}>
      <TabsList>
        <TabsTrigger value="entries">Entries</TabsTrigger>
        <TabsTrigger value="splits">Split sheet</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

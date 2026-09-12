"use client";

import { Checkbox } from "@project-aqua/ui/components/checkbox";
import { Label } from "@project-aqua/ui/components/label";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ReportBlankRelaysToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const checked = searchParams.get("blankRelays") === "1";

  return (
    <Label
      className="flex items-center gap-2 text-sm"
      htmlFor="report-blank-relays-toggle"
    >
      <Checkbox
        id="report-blank-relays-toggle"
        checked={checked}
        onCheckedChange={(value) => {
          const params = new URLSearchParams(searchParams.toString());
          if (value === true) params.set("blankRelays", "1");
          else params.delete("blankRelays");
          const query = params.toString();
          router.replace(query ? `${pathname}?${query}` : pathname);
        }}
      />
      Blank relay lines
    </Label>
  );
}

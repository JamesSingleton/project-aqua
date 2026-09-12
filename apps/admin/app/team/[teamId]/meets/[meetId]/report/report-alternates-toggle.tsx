"use client";

import { Checkbox } from "@project-aqua/ui/components/checkbox";
import { Label } from "@project-aqua/ui/components/label";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ReportAlternatesToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const checked = searchParams.get("alts") === "1";

  return (
    <Label
      className="flex items-center gap-2 text-sm"
      htmlFor="report-alternates-toggle"
    >
      <Checkbox
        id="report-alternates-toggle"
        checked={checked}
        onCheckedChange={(value) => {
          const params = new URLSearchParams(searchParams.toString());
          if (value === true) params.set("alts", "1");
          else params.delete("alts");
          const query = params.toString();
          router.replace(query ? `${pathname}?${query}` : pathname);
        }}
      />
      Include relay alternates
    </Label>
  );
}

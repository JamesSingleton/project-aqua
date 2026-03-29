import { Badge } from "@project-aqua/design-system/components/ui/badge";
import { cn } from "@project-aqua/design-system/lib/utils";

export function RoundBadge({ round }: { round: string }) {
  return (
    <Badge
      className={cn(
        "text-xs",
        round === "P"
          ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
          : ""
      )}
      variant="secondary"
    >
      {round === "F" ? "Finals" : round === "P" ? "Prelims" : round}
    </Badge>
  );
}

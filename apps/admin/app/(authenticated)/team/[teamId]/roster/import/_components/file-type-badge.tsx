import { Badge } from "@project-aqua/design-system/components/ui/badge";
import { cn } from "@project-aqua/design-system/lib/utils";
import type { FileType } from "../page";

const FILE_TYPE_COLORS: Record<FileType, string> = {
  sd3: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  hy3: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  cl2: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  hyv: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  ev3: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  unknown: "bg-muted text-muted-foreground",
};

export function FileTypeBadge({ type }: { type: FileType }) {
  return (
    <Badge
      className={cn("font-mono text-xs uppercase", FILE_TYPE_COLORS[type])}
      variant="secondary"
    >
      {type}
    </Badge>
  );
}

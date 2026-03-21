import { Badge } from "@project-aqua/design-system/components/ui/badge";
import { cn } from "@project-aqua/design-system/lib/utils";

export function CourseBadge({ course }: { course: string }) {
  const colors: Record<string, string> = {
    Y: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    S: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    L: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  };
  return (
    <Badge
      className={cn("font-mono text-xs", colors[course] ?? "")}
      variant="outline"
    >
      {course === "Y" ? "SCY" : course === "S" ? "SCM" : "LCM"}
    </Badge>
  );
}

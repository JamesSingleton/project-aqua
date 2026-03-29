import { Badge } from "@project-aqua/design-system/components/ui/badge";
import { STROKE_LABELS } from "@project-aqua/parsers/types";

export function StrokeBadge({ stroke }: { stroke: string }) {
  return (
    <Badge className="whitespace-nowrap text-xs" variant="outline">
      {STROKE_LABELS[stroke as keyof typeof STROKE_LABELS] ?? stroke}
    </Badge>
  );
}

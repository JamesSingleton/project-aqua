import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/design-system/components/ui/select";
import { STROKE_LABELS } from "@project-aqua/parsers/types";

export function StrokeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger className="h-8 w-40 text-sm">
        <SelectValue placeholder="Stroke" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All strokes</SelectItem>
        {Object.entries(STROKE_LABELS)
          .filter(([k]) => k !== "I")
          .map(([k, v]) => (
            <SelectItem key={k} value={k}>
              {v}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

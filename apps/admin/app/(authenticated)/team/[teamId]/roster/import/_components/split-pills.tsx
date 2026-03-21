import { formatTime } from "@project-aqua/parsers/utils";

export function SplitPills({ splits }: { splits: number[] }) {
  if (!splits.length) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {splits.map((s, i) => (
        <span
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
          key={i}
        >
          {formatTime(s)}
        </span>
      ))}
    </div>
  );
}

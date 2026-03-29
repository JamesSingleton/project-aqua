import { formatTime } from "@project-aqua/parsers/utils";

export function TimeCell({ seconds }: { seconds: number | null }) {
  if (seconds === null) {
    return <span className="text-muted-foreground">NT</span>;
  }
  return <span className="font-mono text-sm">{formatTime(seconds)}</span>;
}

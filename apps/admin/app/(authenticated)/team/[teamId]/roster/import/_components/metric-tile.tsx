export function MetricTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-0.5 truncate font-medium text-sm leading-snug">
        {value || "—"}
      </p>
    </div>
  );
}
